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

    handleHotUpdate({ file, server, modules }) {
      // Suppress Vite's automatic reload for API files
      // We'll trigger reload manually via .backend-changed marker when both builds are ready
      if (file.includes('/api/api.zod.ts') || file.includes('/api/api.d.ts')) {
        console.log('[backend-reload] API file changed, invalidating modules but suppressing auto-reload');
        
        // Invalidate all affected modules so they're fresh when we manually reload
        modules.forEach(mod => {
          server.moduleGraph.invalidateModule(mod);
        });
        
        // Return empty array to prevent Vite from sending reload/update messages
        // Modules are invalidated but browser won't reload yet
        return [];
      }
      
      // Let other files trigger normal HMR
      return modules;
    },

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

      const triggerReload = () => {
        console.log('[backend-reload] Backend changed, clearing caches and triggering full reload...');
        
        // Invalidate all modules that depend on API files
        const apiModules = Array.from(server.moduleGraph.urlToModuleMap.entries())
          .filter(([url]) => url.includes('/api/api.zod') || url.includes('/api/api.d'))
          .map(([, mod]) => mod);
        
        apiModules.forEach(mod => {
          server.moduleGraph.invalidateModule(mod, new Set(), Date.now(), true);
        });
        
        // Send full reload
        server.ws.send({
          type: 'full-reload',
          path: '*'
        });
      };

      watcher.on('add', triggerReload);
      watcher.on('change', triggerReload);

      // Clean up watcher when server closes
      server.httpServer?.once('close', () => {
        watcher.close();
      });
    }
  };
}
