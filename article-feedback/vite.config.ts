import {defineConfig} from 'vite'
import {resolve} from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  build: {
    target: ['es2022'],
    assetsDir: 'widgets',
    rollupOptions: {
      input: {
        'sample-widget': resolve(__dirname, 'widgets/sample-widget/index.html'),
      },
    },
  },
  plugins: [react()],
})
