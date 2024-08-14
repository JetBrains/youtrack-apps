import {defineConfig} from 'vite';
import {resolve} from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  build: {
    target: ['es2022'],
    assetsDir: 'widgets',
    rollupOptions: {
      input: {
        'feedback-form': resolve(__dirname, 'widgets/feedback-form/index.html'),
        'feedback-statistics': resolve(__dirname, 'widgets/feedback-statistics/index.html')
      }
    }
  },
  plugins: [react()]
});
