import type { Plugin } from 'vite';

export interface DevHtmlOptions {
  enabled?: boolean;
  devServerUrl?: string;
  devServerPort?: number;
}

export default function youtrackDevHtml(options: DevHtmlOptions = {}): Plugin {
  const {
    enabled = false,
    devServerUrl = 'http://localhost',
    devServerPort = 9000
  } = options;

  const fullDevUrl = `${devServerUrl}:${devServerPort}`;

  return {
    name: 'vite-plugin-youtrack-dev-html',
    apply: 'build',
    enforce: 'post',

    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!enabled) {
          console.log('[youtrack-dev-html] Disabled (DEV_MODE not set)');
          return html;
        }

        if (!ctx.filename) {
          console.warn('[youtrack-dev-html] Could not determine the widget path from the filename');
          return html;
        }

        console.log(`[youtrack-dev-html] Transforming ${ctx.filename} to use the dev server`);

        // Use the source entry point (typically index.tsx) instead of the built asset
        // The built HTML has bundled assets like "../../widgets/assets/xxx.js", but we need the original source
        const originalEntry = 'index.tsx';

        // Determine the widget path from the filename
        const widgetPath = ctx.filename
          .replace(/.*\/widgets\//, 'widgets/')
          .replace(/\/index\.html$/, '');

        if (!widgetPath.startsWith('widgets/')) {
          console.error(`[youtrack-dev-html] Invalid widget path: ${widgetPath}`);
          return html;
        }

        // Replace all production script tags with dev server references
        let devHtml = html.replace(
          /<script[^>]*type="module"[^>]*src="[^"]*"[^>]*><\/script>/g,
          ''
        );

        // Remove production CSS links (CSS is imported in source files for HMR)
        devHtml = devHtml.replace(
          /<link[^>]*rel="stylesheet"[^>]*>/g,
          ''
        );

        // Inject Vite client and entry point
        const devScripts = `
    <script type="module" src="${fullDevUrl}/@vite/client"></script>
    <script type="module" src="${fullDevUrl}/${widgetPath}/${originalEntry}"></script>`;

        devHtml = devHtml.replace('</body>', `${devScripts}\n  </body>`);

        console.log(`[youtrack-dev-html] Injected dev-server scripts: ${fullDevUrl}/${widgetPath}/${originalEntry}`);

        return devHtml;
      }
    }
  };
}
