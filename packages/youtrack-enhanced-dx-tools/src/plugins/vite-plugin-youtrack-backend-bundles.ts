import path from 'node:path';
import fs from 'node:fs';
import glob from 'fast-glob';
import chokidar, { FSWatcher } from 'chokidar';
import { Plugin, ResolvedConfig } from 'vite';

export interface BundleDir {
  src: string;
}

export interface BundleEntry {
  id: string;
  baseName: string;
}

export function discoverBundleEntries(dirs: BundleDir[], cwd = process.cwd()): BundleEntry[] {
  const entries: BundleEntry[] = [];
  for (const dir of dirs) {
    const srcDir = path.resolve(cwd, dir.src);
    if (!fs.existsSync(srcDir)) continue;
    const files = glob.sync('**/*.ts', { cwd: srcDir, absolute: true, ignore: ['**/*.d.ts'] });
    for (const file of files) {
      entries.push({ id: file, baseName: path.basename(file, '.ts') });
    }
  }
  return entries;
}

export function checkForCollisions(entries: BundleEntry[]): void {
  const seen = new Map<string, string>();
  for (const entry of entries) {
    if (seen.has(entry.baseName)) {
      throw new Error(
        `[youtrack-backend-bundles] basename collision: '${entry.baseName}'\n` +
        `  ${seen.get(entry.baseName)}\n` +
        `  ${entry.id}\n` +
        `Rename one of these files.`
      );
    }
    seen.set(entry.baseName, entry.id);
  }
}

export function createBundleDirWatcher(
  dirs: BundleDir[],
  cwd: string,
  bump: () => void
): FSWatcher | null {
  const watchPaths = [...new Set(
    dirs.flatMap(d => {
      const absDir = path.resolve(cwd, d.src);
      let watchable = absDir;
      while (!fs.existsSync(watchable) && watchable !== cwd) {
        watchable = path.dirname(watchable);
      }
      return fs.existsSync(watchable) ? [watchable] : [];
    })
  )];
  if (watchPaths.length === 0) return null;
  const watcher = chokidar.watch(watchPaths, { ignoreInitial: true, depth: 2 });
  watcher.on('add', (p) => { if (p.endsWith('.ts') && !p.endsWith('.d.ts')) bump(); });
  watcher.on('unlink', (p) => { if (p.endsWith('.ts')) bump(); });
  watcher.on('addDir', bump);
  return watcher;
}

export default function youtrackBackendBundles(dirs: BundleDir[]): Plugin {
  let dirWatcher: FSWatcher | null = null;
  let sentinelPath: string | null = null;
  let prevBasenames: Set<string> | null = null;
  let isWatchMode = false;

  return {
    name: 'vite-plugin-youtrack-backend-bundles',
    apply: 'build',

    configResolved(config: ResolvedConfig) {
      isWatchMode = !!config.build.watch;
    },

    config(config) {
      const cwd = process.cwd();
      const rawOutput = config.build?.rollupOptions?.output;
      const output = Array.isArray(rawOutput) ? rawOutput[0] : rawOutput;
      if (!output) return;
      const existing = output.manualChunks;
      type ChunkFn = Extract<typeof existing, (...args: never[]) => unknown>;
      output.manualChunks = (id: string, meta: Parameters<ChunkFn>[1]) => {
        if (dirs.some(d => id.startsWith(path.resolve(cwd, d.src) + '/'))) return null;
        return typeof existing === 'function' ? existing(id, meta) : null;
      };
    },

    options(opts) {
      const entries = discoverBundleEntries(dirs, process.cwd());
      if (entries.length === 0) return null;

      checkForCollisions(entries);

      const existing = opts.input;
      let normalized: Record<string, string> = {};
      if (typeof existing === 'string' && existing) {
        normalized = { '': existing };
      } else if (Array.isArray(existing)) {
        normalized = Object.fromEntries(
          (existing as string[]).map((f, i) => [`_entry_${i}`, f])
        );
      } else if (existing && typeof existing === 'object') {
        normalized = { ...(existing as Record<string, string>) };
      }

      const additional = Object.fromEntries(entries.map(e => [e.baseName, e.id]));
      return { ...opts, input: { ...normalized, ...additional } };
    },

    generateBundle(outputOptions) {
      const cwd = process.cwd();
      const currentEntries = discoverBundleEntries(dirs, cwd);
      const currentBasenames = new Set(currentEntries.map(e => e.baseName));

      if (prevBasenames !== null) {
        // generateBundle runs before Rollup writes new files to disk, so deleting
        // stale output here ensures auto-upload sees a clean dist when it hashes.
        const outDir = outputOptions.dir ?? path.resolve(cwd, 'dist');
        for (const stale of prevBasenames) {
          if (!currentBasenames.has(stale)) {
            const staleFile = path.join(outDir, `${stale}.js`);
            try { if (fs.existsSync(staleFile)) fs.unlinkSync(staleFile); } catch { /* ignore */ }
          }
        }
      }
      prevBasenames = currentBasenames;
    },

    buildStart() {
      const cwd = process.cwd();

      for (const dir of dirs) {
        this.addWatchFile(path.resolve(cwd, dir.src));
      }

      if (!isWatchMode) return;
      
      if (!sentinelPath) {
        sentinelPath = path.join(cwd, '.backend-bundles-sentinel');
        fs.writeFileSync(sentinelPath, '0');
      }
      this.addWatchFile(sentinelPath);

      // Recreate on each buildStart so newly created dirs are added to the watch set.
      dirWatcher?.close();
      const bump = () => { fs.writeFileSync(sentinelPath!, String(Date.now())); };
      dirWatcher = createBundleDirWatcher(dirs, cwd, bump);
    },

    closeBundle() {
      if (isWatchMode) return;
      dirWatcher?.close();
      dirWatcher = null;
      if (sentinelPath) {
        try { fs.unlinkSync(sentinelPath); } catch { /* ignore */ }
        sentinelPath = null;
      }
    },
  };
}