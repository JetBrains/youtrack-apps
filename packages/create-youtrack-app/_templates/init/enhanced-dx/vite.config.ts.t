---
to: vite.config.ts
---
import { resolve, dirname } from "node:path";
import {fileURLToPath} from 'node:url';
import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from "vite-plugin-static-copy";
import { youtrackAutoUpload } from '@jetbrains/youtrack-enhanced-dx-tools';

/*
      See https://vitejs.dev/config/
*/

const currentDir = dirname(fileURLToPath(import.meta.url));

const dropCrossoriginAttributePlugin = () => {
  return {
    name: "no-attribute",
    transformIndexHtml(html: string) {
      return html.replaceAll("crossorigin", "");
    },
  };
};

export default defineConfig({
  optimizeDeps: {
    exclude: ['@jetbrains/youtrack-enhanced-dx-tools']
  },
  ssr: {
    noExternal: [],
    external: ['@jetbrains/youtrack-enhanced-dx-tools']
  },
  plugins: [
    react(),
    dropCrossoriginAttributePlugin(),
    youtrackAutoUpload({ enabled: process.env.AUTOUPLOAD === 'true', buildName: 'frontend' }),
    viteStaticCopy({
      targets: [
        {
          src: "../manifest.json",
          dest: ".",
        },
        {
          src: "*.*",
          dest: ".",
        },
        {
          src: "../public/*.*",
          dest: ".",
        },
        // Note: Backend JS files are already in dist/ from backend build
        // No need to copy them - frontend build has emptyOutDir: false
      ],
    }),
    viteStaticCopy({
      targets: [
        // Widget icons and configurations
        {
          src: "widgets/*/*.{svg,png,jpg,json}",
          dest: ".",
        },
      ],
      structured: true,
      silent: true, // Don't error if no files match
    }),
  ],
  resolve: {
      alias: {
        "@": resolve(currentDir, "src"),
      }
  },
  server: {
    port: 9099
  },
  root: "./src",
  base: "",
  publicDir: "public",
  build: {
    outDir: "../dist",
    emptyOutDir: false,
    copyPublicDir: false,
    target: ["es2022"],
    assetsDir: "widgets/assets",
    // Frontend widget files are always minified (they're bundled code, not explorable)
    minify: true,
    rollupOptions: {
      input: {
        // List every widget entry point here
        enhancedDX: resolve(__dirname, 'src/widgets/enhanced-dx/index.html'),
      },
      external: [
        // Exclude Vite plugins and their Node.js dependencies from bundling
        '@jetbrains/youtrack-enhanced-dx-tools',
        'child_process',
        'fs-extra',
        'node:path',
        'node:fs',
        'fast-glob',
        'ts-morph'
      ]
    },
  },
});
