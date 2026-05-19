import { Plugin, ResolvedConfig } from 'vite';
import path from 'node:path';
import fs from 'node:fs';

export interface WidgetEntriesOptions {
  /** Directory containing widget subdirectories, relative to config.root (default: 'widgets') */
  widgetsDir?: string;
}

/**
 * Discover all widget entry points by scanning for index.html in widget subdirectories.
 */
export function discoverWidgetEntries(widgetsDir: string): Record<string, string> {
  const entries: Record<string, string> = {};

  if (!fs.existsSync(widgetsDir)) {
    return entries;
  }

  const dirs = fs.readdirSync(widgetsDir, { withFileTypes: true });
  for (const dirent of dirs) {
    if (!dirent.isDirectory()) continue;
    const htmlPath = path.resolve(widgetsDir, dirent.name, 'index.html');
    if (fs.existsSync(htmlPath)) {
      entries[dirent.name] = htmlPath;
    }
  }

  return entries;
}

/**
 * Vite plugin that automatically discovers widget entry points from src/widgets/\*\/index.html.
 *
 * Replaces the need for a hardcoded rollupOptions.input list. In watch mode, it also
 * watches the widgets directory so that newly generated widgets trigger a rebuild
 * and get included automatically.
 */
export default function youtrackWidgetEntries(options: WidgetEntriesOptions = {}): Plugin {
  const { widgetsDir: widgetsDirOption = 'widgets' } = options;
  let resolvedWidgetsDir: string;
  let knownEntries: Set<string> = new Set();

  return {
    name: 'vite-plugin-youtrack-widget-entries',
    apply: 'build',

    configResolved(config: ResolvedConfig) {
      resolvedWidgetsDir = path.isAbsolute(widgetsDirOption)
        ? widgetsDirOption
        : path.resolve(config.root, widgetsDirOption);
    },

    options(opts) {
      const entries = discoverWidgetEntries(resolvedWidgetsDir);
      const names = Object.keys(entries).sort();
      knownEntries = new Set(names);

      if (names.length === 0) {
        throw new Error(
          `[widget-entries] No widgets found in ${resolvedWidgetsDir}.\n` +
          `Create at least one widget with: npm run g -- widget --key <name>`
        );
      }

      console.log(`[widget-entries] Discovered widgets: ${names.join(', ')}`);
      return { ...opts, input: entries };
    },

    buildStart() {
      this.addWatchFile(resolvedWidgetsDir);

      for (const entry of knownEntries) {
        this.addWatchFile(path.resolve(resolvedWidgetsDir, entry));
      }
    },
  };
}
