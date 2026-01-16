import { Plugin } from 'vite';
import chokidar from 'chokidar';
import path from 'node:path';

export interface BackendReloadOptions {
  /** Path to the backend change marker file (default: .backend-changed) */
  markerFile?: string;
}

/**
 * Vite plugin that watches for backend changes and triggers full page reload
 * When the upload coordinator detects backend changes, it writes a marker file
 * This plugin watches that file and sends a full-reload event to HMR clients
 */
export default function backendReloadPlugin(options: BackendReloadOptions = {}): Plugin {
  const { markerFile = '.backend-changed' } = options;

  return {
    name: 'vite-plugin-backend-reload',
    
    // Only active in serve mode (dev server)
    apply: 'serve',

    configureServer(server) {
      const markerPath = path.resolve(process.cwd(), markerFile);

      console.log('[backend-reload] Watching for backend changes...');

      // Watch the marker file
      const watcher = chokidar.watch(markerPath, {
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50
        }
      });

      watcher.on('add', () => {
        console.log('[backend-reload] Backend changed, triggering full reload...');
        server.ws.send({
          type: 'full-reload',
          path: '*'
        });
      });

      watcher.on('change', () => {
        console.log('[backend-reload] Backend changed, triggering full reload...');
        server.ws.send({
          type: 'full-reload',
          path: '*'
        });
      });

      // Clean up watcher when server closes
      server.httpServer?.once('close', () => {
        watcher.close();
      });
    }
  };
}
