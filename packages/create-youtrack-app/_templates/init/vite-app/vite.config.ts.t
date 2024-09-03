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
          src: '../manifest.json',
          dest: '.'
        },
        {
          src: '*.*',
          dest: '.'
        }
      ]
    }),
    viteStaticCopy({
      targets: [
        // Widget icons and configurations
        {
          src: 'widgets/*/*.{svg,png,jpg,json}',
          dest: '.'
        }
      ],
      structured: true
    })
  ],
  root: './src',
  base: '',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    copyPublicDir: true,
    target: ['es2022'],
    assetsDir: 'widgets/assets',
    rollupOptions: {
      input: {
        // List every widget entry point here
        main: resolve(__dirname, 'src/widgets/main/index.html')
      }
    }
  }
});
