import fs from 'fs-extra';
import path from 'node:path';
import { execSync } from 'child_process';
import crypto from 'crypto';
import chokidar, { type FSWatcher } from 'chokidar';
import glob from 'fast-glob';
import { upload } from '../cli/upload.js';
import type { Config } from '../../@types/types.js';

export interface BuildState {
  backend: { timestamp: number; hash: string } | null;
  frontend: { timestamp: number; hash: string } | null;
}

export interface CoordinatorOptions {
  /** Path to the build state file (default: .build-state.json) */
  stateFile?: string;
  /** Debounce delay in milliseconds (default: 1000) */
  debounceMs?: number;
  /**
   * Optional shell command used to perform the upload. When set, the
   * coordinator spawns it via `execSync` (legacy behaviour). When omitted,
   * the coordinator calls `upload()` from `@jetbrains/youtrack-apps-tools`
   * directly, reading host/token from a `.env` file in `cwd`.
   */
  uploadCommand?: string;
  /** Path to the directory uploaded to YouTrack (default: dist) */
  appDir?: string;
  /** Working directory (default: process.cwd()) */
  cwd?: string;
}

function getUploadFailureHint(errorMsg: string): string | null {
  const lower = errorMsg.toLowerCase();
  if (lower.includes('401') || lower.includes('unauthorized')) {
    return 'Check your .env file: YOUTRACK_HOST and YOUTRACK_TOKEN. Generate a token in YouTrack under Profile → Account Security.';
  }
  if (lower.includes('econnrefused') || lower.includes('enotfound') || lower.includes('getaddrinfo')) {
    return 'YouTrack may be unreachable. Verify YOUTRACK_HOST in the .env file and that YouTrack is running.';
  }
  if (lower.includes('404') || lower.includes('not found')) {
    return 'Check YOUTRACK_HOST in the .env file. The URL may be incorrect or the app upload endpoint may have changed.';
  }
  if (lower.includes('enoent') && (lower.includes('youtrack') || lower.includes('.env'))) {
    return 'Create a .env file with YOUTRACK_HOST and YOUTRACK_TOKEN. See the README for setup instructions.';
  }
  return null;
}

/**
 * Upload coordinator that watches build state and uploads once when all builds stabilize
 */
export class UploadCoordinator {
  private stateFile: string;
  private debounceMs: number;
  private uploadCommand: string | undefined;
  private appDir: string;
  private cwd: string;
  private uploadTimer: NodeJS.Timeout | null = null;
  private lastUploadedState: BuildState = { backend: null, frontend: null };
  private watcher: FSWatcher | null = null;
  private readonly handleExit = (): void => {
    this.stop();
    process.exit(0);
  };

  constructor(options: CoordinatorOptions = {}) {
    this.stateFile = options.stateFile || '.build-state.json';
    this.debounceMs = options.debounceMs ?? 1000;
    this.uploadCommand = options.uploadCommand;
    this.appDir = options.appDir || 'dist';
    this.cwd = options.cwd || process.cwd();
  }

  /**
   * Start watching the build state file
   */
  start(): void {
    const stateFilePath = path.resolve(this.cwd, this.stateFile);

    console.log(`[upload-coordinator] Watching ${this.stateFile} for changes...`);

    this.watcher = chokidar.watch(stateFilePath, {
      ignoreInitial: false,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    this.watcher.on('add', () => this.onStateChange());
    this.watcher.on('change', () => this.onStateChange());

    // Handle cleanup on exit (remove first to avoid duplicates if start is called again)
    process.off('SIGINT', this.handleExit);
    process.off('SIGTERM', this.handleExit);
    process.on('SIGINT', this.handleExit);
    process.on('SIGTERM', this.handleExit);
  }

  /**
   * Stop watching
   */
  stop(): void {
    process.off('SIGINT', this.handleExit);
    process.off('SIGTERM', this.handleExit);
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.uploadTimer) {
      clearTimeout(this.uploadTimer);
      this.uploadTimer = null;
    }
  }

  /**
   * Called when build state file changes
   */
  private onStateChange(): void {
    // Clear existing timer
    if (this.uploadTimer) {
      clearTimeout(this.uploadTimer);
    }

    // Schedule upload after debounce period
    this.uploadTimer = setTimeout(() => {
      this.checkAndUpload();
    }, this.debounceMs);
  }

  /**
   * Check if state changed and perform upload
   */
  private async checkAndUpload(): Promise<void> {
    try {
      const stateFilePath = path.resolve(this.cwd, this.stateFile);

      // Read current state
      if (!(await fs.pathExists(stateFilePath))) {
        return;
      }

      const currentState: BuildState = await fs.readJson(stateFilePath);

      // Wait for BOTH backend and frontend to have built at least once
      if (!currentState.backend || !currentState.frontend) {
        console.log('[upload-coordinator] Waiting for all builds to complete...');
        return;
      }

      // Check if anything actually changed
      if (this.stateEquals(currentState, this.lastUploadedState)) {
        console.log('[upload-coordinator] No changes detected, skipping upload');
        return;
      }

      // Verify dist/ is coherent before uploading
      const manifestPath = path.resolve(this.cwd, 'dist', 'manifest.json');
      if (!(await fs.pathExists(manifestPath))) {
        console.log('[upload-coordinator] Waiting for dist/manifest.json (frontend build may still be in progress)...');
        return;
      }

      // Determine if backend changed
      const backendChanged = currentState.backend?.hash !== this.lastUploadedState.backend?.hash;

      console.log('[upload-coordinator] Changes detected, uploading...');
      if (backendChanged) {
        console.log('[upload-coordinator] Backend changed; a full reload will be triggered after the upload.');
      }

      // Perform upload first - must complete before browser reloads
      await this.upload();

      // Mark backend change for full reload AFTER upload completes
      // This ensures YouTrack has the new code before browser reloads
      if (backendChanged) {
        const markerPath = path.resolve(this.cwd, '.backend-changed');
        await fs.writeFile(markerPath, Date.now().toString());
      }

      // Update last uploaded state
      this.lastUploadedState = JSON.parse(JSON.stringify(currentState));

      console.log('[upload-coordinator] ✓ Upload successful\n');
    } catch (error) {
      const msg = (error as Error).message;
      console.error('[upload-coordinator] ✗ Upload failed:', msg);
      const hint = getUploadFailureHint(msg);
      if (hint) {
        console.error('[upload-coordinator] Hint:', hint);
      }
    }
  }

  /**
   * Perform the actual upload. If a custom `uploadCommand` was supplied,
   * spawn it via `execSync` for backwards compatibility. Otherwise call the
   * programmatic `upload()` from this package, which avoids the shell hop.
   */
  private async upload(): Promise<void> {
    if (this.uploadCommand) {
      execSync(this.uploadCommand, {
        stdio: 'inherit',
        cwd: this.cwd
      });
      return;
    }

    const env = await loadDotEnv(path.resolve(this.cwd, '.env'));
    const host = env.YOUTRACK_HOST || process.env.YOUTRACK_HOST;
    const token = env.YOUTRACK_TOKEN || process.env.YOUTRACK_API_TOKEN || process.env.YOUTRACK_TOKEN;

    if (!host || !token) {
      throw new Error(
        'YOUTRACK_HOST and YOUTRACK_TOKEN must be defined either in .env (in the working directory) or in the process environment.'
      );
    }

    const config: Config = {
      host,
      token,
      output: null,
      overwrite: null,
      manifest: null,
      schema: null,
      open: null,
      cwd: this.cwd
    };

    await upload(config, this.appDir);
  }

  /**
   * Check if two build states are equal
   */
  private stateEquals(a: BuildState, b: BuildState): boolean {
    return (
      a.backend?.hash === b.backend?.hash &&
      a.frontend?.hash === b.frontend?.hash
    );
  }
}

/**
 * Read a `KEY=VALUE` `.env` file. Returns an empty record when the file
 * does not exist. Quoted values are unquoted; comments and blank lines are
 * ignored. No interpolation, no exports, no inheritance — keep it boring.
 */
async function loadDotEnv(filePath: string): Promise<Record<string, string>> {
  if (!(await fs.pathExists(filePath))) {
    return {};
  }
  const raw = await fs.readFile(filePath, 'utf8');
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Calculate hash of files in a directory
 */
export function hashDirectory(dir: string, pattern: string = '**/*'): string {
  const absoluteDir = path.resolve(dir);

  if (!fs.existsSync(absoluteDir)) {
    return '';
  }

  const files = glob.sync(pattern, {
    cwd: absoluteDir,
    dot: false,
    onlyFiles: true
  });

  const hash = crypto.createHash('md5');

  for (const file of files.sort()) {
    const filePath = path.join(absoluteDir, file);
    try {
      const content = fs.readFileSync(filePath);
      hash.update(file);
      hash.update(content);
    } catch {
      // Skip files that can't be read
    }
  }

  return hash.digest('hex');
}
