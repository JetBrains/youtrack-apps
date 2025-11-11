---
to: vite.config.backend.ts
---
import {defineConfig} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { youtrackApiGenerator, youtrackRouter } from '@jetbrains/youtrack-enhanced-dx-tools';
import path from 'node:path';


export default defineConfig({
    plugins: [tsconfigPaths(), youtrackApiGenerator(), youtrackRouter()],
    build: {
        outDir: './dist',
        emptyOutDir: true, // empty dist dir, as backend build runs first
    lib: {
        entry: [],
        name: 'router',
        fileName: 'router',
        formats: ['cjs']
    },
    rollupOptions: {
      external: [/^@jetbrains\/youtrack-scripting-api\//],
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
