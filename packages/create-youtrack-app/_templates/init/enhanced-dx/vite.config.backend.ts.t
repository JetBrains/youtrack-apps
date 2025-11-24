---
to: vite.config.backend.ts
---
import {defineConfig} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { youtrackApiGenerator, youtrackRouter, youtrackExtensionProperties, youtrackAutoUpload } from '@jetbrains/youtrack-enhanced-dx-tools';
import path from 'node:path';


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
        youtrackApiGenerator(),
        youtrackRouter(),
        youtrackExtensionProperties(),
        youtrackAutoUpload({ enabled: process.env.AUTOUPLOAD === 'true', buildName: 'backend' })
    ],
    build: {
        outDir: './dist',
        emptyOutDir: true, // empty dist dir, as backend build runs first
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
        // Externalize Node.js built-ins and Vite plugin dependencies
        'child_process',
        'fs-extra',
        'node:path',
        'node:fs',
        'node:fs/promises',
        'node:os',
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
          entryFileNames: (chunkInfo) => {
              const routerRoot = path.resolve(process.cwd(), 'src', 'backend', 'router');
              if (chunkInfo.facadeModuleId && chunkInfo.facadeModuleId.startsWith(routerRoot)) {
                  const relativePath = path.relative(routerRoot, chunkInfo.facadeModuleId);
                  const parsedPath = path.parse(relativePath);
                  const name = path.join(parsedPath.dir, parsedPath.name).replace(/[\\/]/g, '-');
                  return `${name}.js`;
              }
              return '[name].js';
          },
          chunkFileNames: '[name].js'
          }
        },
      },
});
