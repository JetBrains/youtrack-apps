---
to: vite.config.ts
---
import { resolve, dirname } from "node:path";
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from "vite-plugin-static-copy";
import { youtrackAutoUpload, youtrackDevHtml, backendReloadPlugin, youtrackWidgetEntries } from '@jetbrains/youtrack-apps-tools';

const isServing = process.argv.includes('--mode') === false && !process.argv.includes('build');

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

const watchStaticJsonPlugin = () => ({
  name: 'watch-static-json',
  buildStart() {
    // Ensure frontend rebuilds (and re-copies via viteStaticCopy) when these files change
    const jsonFiles = ['settings.json'].map(f => resolve(currentDir, 'src', f));
    for (const f of jsonFiles) {
      if (fs.existsSync(f)) {
        this.addWatchFile(f);
      }
    }
  }
});

const cleanAssetsPlugin = () => {
  return {
    name: "clean-assets-on-watch",
    apply: 'build' as const,

    async buildStart() {
      // Only clean in watch mode to avoid duplicate artifacts
      if (this.meta.watchMode) {
        const nodeFs = await import('node:fs');
        const nodePath = await import('node:path');

        const assetsDir = nodePath.resolve(currentDir, 'dist/widgets/assets');

        if (nodeFs.existsSync(assetsDir)) {
          nodeFs.rmSync(assetsDir, { recursive: true, force: true });
          console.log('[clean-assets] Cleaned old artifacts');
        }
      }
    }
  };
};

export default defineConfig({
  optimizeDeps: {
    exclude: ['@jetbrains/youtrack-apps-tools']
  },
  ssr: {
    noExternal: [],
    external: ['@jetbrains/youtrack-apps-tools']
  },
  plugins: [
    // Automatically discover widget entry points from src/widgets/*/index.html
    youtrackWidgetEntries(),
    // Clean old frontend assets before each rebuild in watch mode
    cleanAssetsPlugin(),
    watchStaticJsonPlugin(),
    // Only use React plugin during build, not during dev server
    // (Fast Refresh doesn't work in iframe/YouTrack context)
    ...(!isServing ? [react()] : []),
    // Watch for backend changes and trigger full reload in dev server
    ...(isServing ? [backendReloadPlugin()] : []),
    dropCrossoriginAttributePlugin(),
    youtrackDevHtml({
      enabled: process.env.DEV_MODE === 'true',
      devServerPort: 9000
    }),
    youtrackAutoUpload({ enabled: process.env.AUTOUPLOAD === 'true', buildName: 'frontend' }),
    viteStaticCopy({
      targets: [
        {
          src: "../manifest.json",
          dest: ".",
        },
        {
          src: "*.{svg,json}",
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
    port: 9000,
    cors: {
      origin: '*',
      credentials: true
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    }
  },
  root: "./src",
  base: "",
  publicDir: "public",
  build: {
    outDir: "../dist",
    emptyOutDir: false, // Keep backend files, but manually clean assets in watch mode
    copyPublicDir: false,
    target: ["es2022"],
    assetsDir: "widgets/assets",
    // Frontend widget files are always minified (they're bundled code, not explorable)
    minify: true,
    rollupOptions: {
      // Widget entries are discovered automatically by youtrackWidgetEntries()
      external: [
        // Exclude Vite plugins and their Node.js dependencies from bundling
        '@jetbrains/youtrack-apps-tools',
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
