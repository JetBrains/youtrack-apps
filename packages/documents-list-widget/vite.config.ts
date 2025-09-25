import {resolve} from 'node:path';
import {defineConfig} from 'vite';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import react from '@vitejs/plugin-react';
import {poTransformPlugin} from '../lib/tools/vite-po-transform-plugin.ts';

/*
      See https://vitejs.dev/config/
*/

export default defineConfig({
  plugins: [
    react(),
    poTransformPlugin(),
    viteStaticCopy({
      targets: [
        {
          src: '../manifest.json',
          dest: '.'
        },
        {
          src: '../public/*.*',
          dest: '.'
        }
      ]
    }),
    viteStaticCopy({
      targets: [
        // Widget icons and configurations
        {
          src: 'widgets/**/*.{svg,png,jpg,json}',
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
    copyPublicDir: false,
    target: ['es2022'],
    assetsDir: 'widgets/assets',
    rollupOptions: {
      input: {
        // List every widget entry point here
        documentsListWidget: resolve(__dirname, 'src/widgets/documents-list-widget/index.html'),

      }
    }
  },
  resolve: {
    alias: {
      '@jetbrains/ring-ui': '@jetbrains/ring-ui-built', // for hub-widget-ui folder
      '@lib': resolve(__dirname, '../lib')
    }
  }
});
