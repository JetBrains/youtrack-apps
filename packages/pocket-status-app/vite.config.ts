import {resolve} from 'node:path';
import {copyFileSync} from 'node:fs';
import {defineConfig} from 'vite';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import react from '@vitejs/plugin-react';

/*
      See https://vitejs.dev/config/
*/

const copyManifestPlugin = () => ({
  name: 'copy-manifest',
  writeBundle() {
    copyFileSync(resolve(import.meta.dirname, 'manifest.json'), resolve(import.meta.dirname, 'dist', 'manifest.json'));
  }
});

const dropCrossoriginAttributePlugin = () => ({
  name: 'no-attribute',
  transformIndexHtml(html: string) {
    return html.replaceAll('crossorigin', '');
  }
});

export default defineConfig({
  plugins: [
    react(),
    copyManifestPlugin(),
    dropCrossoriginAttributePlugin(),
    viteStaticCopy({
      targets: [
        {
          src: '*.*',
          dest: '.'
        },
        // Widget icons and configurations
        {
          src: 'widgets/*/*.{svg,png,jpg,json}',
          dest: '.'
        }
      ]
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
    cssMinify: 'esbuild',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        pocketStatus: resolve(import.meta.dirname, 'src/widgets/pocket-status/index.html'),
        pocketStatusSettings: resolve(import.meta.dirname, 'src/widgets/pocket-status-settings/index.html')
      }
    }
  }
});
