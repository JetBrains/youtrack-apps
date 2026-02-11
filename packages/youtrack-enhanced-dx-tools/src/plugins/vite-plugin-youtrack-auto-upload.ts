import { Plugin } from 'vite';
import path from 'node:path';
import fs from 'fs-extra';
import { promises as fsp } from 'node:fs';
import { hashDirectory, BuildState } from '../upload-coordinator.js';

export interface AutoUploadOptions {
  /** Whether to enable auto-upload (default: false) */
  enabled?: boolean;
  /** Build name to identify this build (e.g., 'frontend' or 'backend') */
  buildName?: 'frontend' | 'backend';
  /** Path to build state file (default: .build-state.json) */
  stateFile?: string;
}

/**
 * Vite plugin to write build state for upload coordinator
 * Instead of uploading directly, this signals the coordinator that a build is complete
 */
export default function youtrackAutoUpload(options: AutoUploadOptions = {}): Plugin {
  const {
    enabled = false,
    buildName = 'backend',
    stateFile = '.build-state.json'
  } = options;

  const cwd = process.cwd();
  const stateFilePath = path.resolve(cwd, stateFile);
  const lockFilePath = `${stateFilePath}.lock`;

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const withStateLock = async <T>(fn: () => Promise<T>): Promise<T> => {
    const timeoutMs = 15_000;
    const staleLockMs = 30_000;
    const startTime = Date.now();

    while (true) {
      try {
        const lockHandle = await fsp.open(lockFilePath, 'wx');
        await lockHandle.close();
        break;
      } catch (error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code !== 'EEXIST') {
          throw nodeError;
        }

        try {
          const lockStats = await fsp.stat(lockFilePath);
          if (Date.now() - lockStats.mtimeMs > staleLockMs) {
            await fsp.unlink(lockFilePath);
            continue;
          }
        } catch {
          // Lock file can disappear between stat/unlink attempts.
        }

        if (Date.now() - startTime > timeoutMs) {
          throw new Error(`Timed out acquiring build state lock: ${lockFilePath}`);
        }

        await sleep(50);
      }
    }

    try {
      return await fn();
    } finally {
      try {
        await fsp.unlink(lockFilePath);
      } catch {
        // Lock can be removed by stale-lock cleanup in rare failure scenarios.
      }
    }
  };

  const updateBuildState = async () => {
    try {
      // Calculate hash of built files
      const distDir = path.resolve(cwd, 'dist');
      let hash = '';
      
      if (buildName === 'backend') {
        // Hash backend JS files
        hash = hashDirectory(distDir, '*.js');
      } else {
        // Hash frontend widget files
        hash = hashDirectory(distDir, 'widgets/**/*');
      }

      await withStateLock(async () => {
        // Read current state or create empty state
        let currentState: BuildState = { backend: null, frontend: null };

        if (await fs.pathExists(stateFilePath)) {
          try {
            currentState = await fs.readJson(stateFilePath);
          } catch {
            // If file is corrupted, start fresh
          }
        }

        // Update state under lock to avoid lost updates.
        currentState[buildName] = {
          timestamp: Date.now(),
          hash
        };

        await fs.writeJson(stateFilePath, currentState, { spaces: 2 });
      });

      console.log(`[youtrack-auto-upload] ${buildName} build state updated (hash: ${hash.substring(0, 8)}...)`);
    } catch (error) {
      console.error('[youtrack-auto-upload] Error updating build state:', (error as Error).message);
    }
  };

  return {
    name: `vite-plugin-youtrack-auto-upload-${buildName}`,

    // Only activate in build mode
    apply: 'build',

    async writeBundle() {
      if (!enabled) {
        return;
      }

      await updateBuildState();
    }
  };
}
