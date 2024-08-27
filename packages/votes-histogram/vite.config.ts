import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import react from '@vitejs/plugin-react'
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [
    react(),
    eslint({
      failOnError: false,
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '../'
        },
        {
          src: 'votes-histogram-app.svg',
          dest: '../'
        },
        {
          src: 'public/*',
          dest: '../'
        },
      ],
    }),
  ],
  base: './',
  publicDir: '',
  build: {
    outDir: 'dist/widgets',
    target: ['es2022']
  },
})
