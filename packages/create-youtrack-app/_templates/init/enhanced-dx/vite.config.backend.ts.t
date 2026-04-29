---
to: vite.config.backend.ts
---
import {defineConfig} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { youtrackApiGenerator, youtrackRouter, youtrackExtensionProperties, youtrackAppSettings, youtrackAutoUpload, youtrackBackendBundles } from '@jetbrains/youtrack-enhanced-dx-tools';


export default defineConfig({
    optimizeDeps: {
        exclude: ['@jetbrains/youtrack-enhanced-dx-tools']
    },
    ssr: {
        noExternal: [],
        external: ['@jetbrains/youtrack-enhanced-dx-tools']
    },
    plugins: [
        tsconfigPaths(),
        youtrackAppSettings(),  // Generate type-safe AppSettings from settings.json
        youtrackApiGenerator(),
        youtrackRouter(),
        youtrackExtensionProperties(),
        youtrackBackendBundles([
            { src: 'src/backend/workflows' },
            { src: 'src/backend/ai-tools' },
            { src: 'src/backend/sla' },
        ]),
        youtrackAutoUpload({ enabled: process.env.AUTOUPLOAD === 'true', buildName: 'backend' })
    ],
    build: {
        outDir: './dist',
        emptyOutDir: !process.argv.includes('--watch'), // clean dist/ on fresh builds, preserve it in watch mode
        // Backend files should NOT be minified for easier debugging in workflow editor
        minify: false,
        lib: {
            entry: [],
            name: 'router',
            fileName: 'router',
            formats: ['cjs']
        },
        rollupOptions: {
            external: [
                /^@jetbrains\/youtrack-scripting-api\//,
                /^node:/,
                // Externalize Node.js built-ins and Vite plugin dependencies
                'child_process',
                'fs-extra',
                'fast-glob',
                'ts-morph',
                'path',
                'fs',
                'os',
                'stream',
                'util',
                'assert',
                'constants',
                'events',
                'perf_hooks'
            ],
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                // Create shared chunks for backend modules to force require() statements
                manualChunks: (id) => {
                    // Handler files (entry points) - don't chunk
                    if (id.includes('/backend/router/')) {
                        return null;
                    }

                    // Any other backend code - create shared chunks by top-level directory
                    const backendMatch = id.match(/\/backend\/([^/]+)\//);
                    if (backendMatch) {
                        return `backend-${backendMatch[1]}`; // e.g., backend-infrastructure, backend-utils, backend-services
                    }

                    return null;
                },
            },
        },
    }
});
