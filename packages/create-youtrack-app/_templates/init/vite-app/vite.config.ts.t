---
 to: vite.config.ts
---
import {resolve} from 'node:path';
import {defineConfig} from 'vite';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import react from '@vitejs/plugin-react';

/*
      See https://vitejs.dev/config/
*/

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.'
        },
        {
          src: 'src/*.*',
          dest: '.'
        }
      ]
    })
  ],
  base: '',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    copyPublicDir: true,
    target: ['es2022'],
    assetsDir: 'widgets/assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'widgets/main/index.html')
        // Add widgets here
      }
    }
  }
});
