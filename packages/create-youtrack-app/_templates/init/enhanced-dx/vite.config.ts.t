---
to: vite.config.ts
---
import { resolve, dirname } from "node:path";
import {fileURLToPath} from 'node:url';
import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from "vite-plugin-static-copy";

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
  plugins: [
    react(),
    dropCrossoriginAttributePlugin(),
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
        {
          src: "backend/*.*",
          dest: ".",
        },
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
    rollupOptions: {
      input: {
        // List every widget entry point here
        enhancedDX: resolve(__dirname, 'src/widgets/enhanced-dx/index.html'),
      },
    },
  },
});
