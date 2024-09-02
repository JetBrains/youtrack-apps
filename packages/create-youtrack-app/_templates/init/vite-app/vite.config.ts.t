---
 to: vite.config.ts
---
import {resolve} from 'node:path';
import {defineConfig} from 'vite';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '../'
        },
        {
          src: 'public/*',
          dest: '../'
        }
      ]
    })
  ],
  base: './',
  publicDir: '',
  build: {
    outDir: 'dist/widgets',
    target: ['es2022'],
    assetsDir: 'widgets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/widgets/main/index.html')
        // Add widgets here
      }
    }
  }
});
