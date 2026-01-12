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
    devServerPort = 9099
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
          console.warn('[youtrack-dev-html] Could not determine widget path from filename');
          return html;
        }

        console.log(`[youtrack-dev-html] Transforming ${ctx.filename} to use dev server`);

        // Extract the widget entry point from the original script tag
        const scriptMatch = html.match(/<script[^>]*type="module"[^>]*src="([^"]*)"[^>]*>/);
        const originalEntry = scriptMatch?.[1] || 'index.tsx';
        
        if (!scriptMatch) {
          console.warn('[youtrack-dev-html] No module script found in HTML, using default: index.tsx');
        }

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

        // Inject Vite client and entry point
        const devScripts = `
    <script type="module" src="${fullDevUrl}/@vite/client"></script>
    <script type="module" src="${fullDevUrl}/${widgetPath}/${originalEntry}"></script>`;

        devHtml = devHtml.replace('</body>', `${devScripts}\n  </body>`);

        console.log(`[youtrack-dev-html] Injected dev server scripts: ${fullDevUrl}/${widgetPath}/${originalEntry}`);

        return devHtml;
      }
    }
  };
}
