import fs from 'fs-extra';
import path from 'node:path';
import { execSync } from 'child_process';
import crypto from 'crypto';
import chokidar, { type FSWatcher } from 'chokidar';
import glob from 'fast-glob';

export interface BuildState {
  backend: { timestamp: number; hash: string } | null;
  frontend: { timestamp: number; hash: string } | null;
}

export interface CoordinatorOptions {
  /** Path to the build state file (default: .build-state.json) */
  stateFile?: string;
  /** Debounce delay in milliseconds (default: 1000) */
  debounceMs?: number;
  /** Upload command (default: npm run upload-local) */
  uploadCommand?: string;
  /** Working directory (default: process.cwd()) */
  cwd?: string;
}

/**
 * Upload coordinator that watches build state and uploads once when all builds stabilize
 */
export class UploadCoordinator {
  private stateFile: string;
  private debounceMs: number;
  private uploadCommand: string;
  private cwd: string;
  private uploadTimer: NodeJS.Timeout | null = null;
  private lastUploadedState: BuildState = { backend: null, frontend: null };
  private watcher: FSWatcher | null = null;

  constructor(options: CoordinatorOptions = {}) {
    this.stateFile = options.stateFile || '.build-state.json';
    this.debounceMs = options.debounceMs || 3000;
    this.uploadCommand = options.uploadCommand || 'npm run upload-local';
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

    // Handle cleanup on exit
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  /**
   * Stop watching
   */
  stop(): void {
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

      // Determine if backend changed
      const backendChanged = currentState.backend?.hash !== this.lastUploadedState.backend?.hash;

      console.log('[upload-coordinator] Changes detected, uploading...');
      if (backendChanged) {
        console.log('[upload-coordinator] Backend changed - will trigger full reload');
      }

      // Perform upload
      await this.upload();

      // Mark backend change for full reload
      if (backendChanged) {
        const markerPath = path.resolve(this.cwd, '.backend-changed');
        await fs.writeFile(markerPath, Date.now().toString());
      }

      // Update last uploaded state
      this.lastUploadedState = JSON.parse(JSON.stringify(currentState));

      console.log('[upload-coordinator] ✓ Upload successful\n');
    } catch (error) {
      console.error('[upload-coordinator] ✗ Error:', (error as Error).message);
    }
  }

  /**
   * Perform the actual upload
   */
  private async upload(): Promise<void> {
    execSync(this.uploadCommand, {
      stdio: 'inherit',
      cwd: this.cwd
    });
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
