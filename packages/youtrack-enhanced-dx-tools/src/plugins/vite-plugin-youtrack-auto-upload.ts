import { Plugin } from 'vite';
import { execSync } from 'child_process';
import path from 'node:path';
import fs from 'fs-extra';

export interface AutoUploadOptions {
  /** Whether to enable auto-upload (default: false) */
  enabled?: boolean;
  /** Custom upload command (default: uses npm run upload-local) */
  command?: string;
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number;
  /** Build name to identify this build (e.g., 'frontend' or 'backend') */
  buildName?: 'frontend' | 'backend';
}

/**
 * Vite plugin to automatically upload the built app to YouTrack after successful builds
 * Coordinates between frontend and backend builds using lock files
 * Frontend build polls for backend completion and triggers upload
 */
export default function youtrackAutoUpload(options: AutoUploadOptions = {}): Plugin {
  const {
    enabled = false,
    command = 'npm run upload-local',
    debounceMs = 500,
    buildName = 'backend'
  } = options;

  const lockDir = path.resolve(process.cwd(), 'node_modules', '.youtrack-build-lock');
  const buildLockFile = path.join(lockDir, `${buildName}.lock`);
  const uploadLockFile = path.join(lockDir, 'upload.lock');

  let uploadTimeout: NodeJS.Timeout | null = null;
  let pollInterval: NodeJS.Timeout | null = null;
  let hasInitialized = false;

  const upload = async () => {
    // Check if upload is already in progress
    try {
      if (await fs.pathExists(uploadLockFile)) {
        return;
      }

      // Create upload lock
      await fs.writeFile(uploadLockFile, Date.now().toString());

      console.log('\n[youtrack-auto-upload] Uploading to YouTrack...');
      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('[youtrack-auto-upload] ✓ Upload successful\n');

      // Clean up all lock files after successful upload
      await fs.remove(lockDir);

      // Stop polling after successful upload
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    } catch (error) {
      console.error('[youtrack-auto-upload] ✗ Upload failed:', (error as Error).message);
      // Remove upload lock on failure so it can retry
      try {
        await fs.remove(uploadLockFile);
      } catch {}
    }
  };

  const scheduleUpload = () => {
    if (uploadTimeout) {
      clearTimeout(uploadTimeout);
    }
    uploadTimeout = setTimeout(upload, debounceMs);
  };

  const checkAndScheduleUpload = async () => {
    try {
      const frontendLock = path.join(lockDir, 'frontend.lock');
      const backendLock = path.join(lockDir, 'backend.lock');

      const [frontendExists, backendExists] = await Promise.all([
        fs.pathExists(frontendLock),
        fs.pathExists(backendLock)
      ]);

      if (frontendExists && backendExists) {
        console.log('[youtrack-auto-upload] Both builds complete, scheduling upload...');
        scheduleUpload();

        // Stop polling once both builds are complete
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }
    } catch (error) {
      // Silently ignore check errors
    }
  };

  return {
    name: `vite-plugin-youtrack-auto-upload-${buildName}`,

    // Only activate in build mode
    apply: 'build',

    async buildStart() {
      if (!enabled || hasInitialized) {
        return;
      }

      // Clean up stale lock files and upload locks on first build
      try {
        const uploadLockExists = await fs.pathExists(uploadLockFile);
        if (uploadLockExists) {
          await fs.remove(uploadLockFile);
        }

        // For frontend, start the polling loop once
        if (buildName === 'frontend' && !pollInterval) {
          pollInterval = setInterval(async () => {
            await checkAndScheduleUpload();
          }, 300);
        }

        hasInitialized = true;
      } catch (error) {
        // Ignore cleanup errors
      }
    },

    async writeBundle() {
      if (!enabled) {
        return;
      }

      try {
        // Ensure lock directory exists
        await fs.ensureDir(lockDir);

        // Write this build's lock file with timestamp
        await fs.writeFile(buildLockFile, Date.now().toString());
        console.log(`[youtrack-auto-upload] ${buildName} build complete`);

        // Both frontend and backend should trigger upload check
        await checkAndScheduleUpload();
      } catch (error) {
        console.error('[youtrack-auto-upload] Error writing build lock:', (error as Error).message);
      }
    }

    // Note: No closeBundle - polling continues in watch mode across rebuilds
  };
}
