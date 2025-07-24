---
to: vite-plugin-youtrack-router.ts
---
import path from 'node:path';
import glob from 'fast-glob';
import {Plugin} from 'vite';

type Route = {
  scope: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  filePath: string;
};

export default function youtrackRouter(): Plugin {
  const routerRoot = path.resolve(process.cwd(), 'src/backend/router');
  const routes: Route[] = [];

  return {
    name: 'vite-plugin-youtrack-router',
    config(config) {
      if (!config.build) {
        config.build = {};
      }
      if (!config.build.lib) {
        config.build.lib = {entry: ''};
      }
      const routeFiles = glob.sync('**/(GET|POST|PUT|DELETE).ts', {
        cwd: routerRoot,
        absolute: true
      });
      const requirementsFile = path.resolve(process.cwd(), 'src/backend/requirements.ts');
      config.build.lib.entry = [...routeFiles, requirementsFile];
      return config;
    },
    async buildStart() {
      const routeFiles = await glob('**/(GET|POST|PUT|DELETE).ts', {
        cwd: routerRoot,
        absolute: true
      });

      routes.push(...routeFiles.map((filePath) => {
        const relativePath = path.relative(routerRoot, filePath);
        const parts = relativePath.split(path.sep);
        const scope = parts[0];
        const method = path.basename(filePath, '.ts') as Route['method'];
        const routePath = parts.slice(1, -1).join('/');
        return {
          scope,
          path: routePath,
          method,
          filePath
        };
      }));
    },
    generateBundle(options, bundle) {
      const routesByScope = routes.reduce((acc, route) => {
        if (!acc[route.scope]) {
          acc[route.scope] = [];
        }
        acc[route.scope].push(route);
        return acc;
      }, {} as Record<string, Route[]>);

      for (const scope in routesByScope) {
        if (Object.prototype.hasOwnProperty.call(routesByScope, scope)) {
          const scopeRoutes = routesByScope[scope];
          const endpoints = scopeRoutes.map(route => {
            const relativePath = path.relative(routerRoot, route.filePath);
            const parsedPath = path.parse(relativePath);
            const fileName = path.join(parsedPath.dir, parsedPath.name).replace(/[\\/]/g, '-');
            return `{
              method: "${route.method}",
              path: "${route.path}",
              scope: "${route.scope}",
              handle: require("./${fileName}.js")
            }`;
          }).join(',\n');

          const fileContent = `
            exports.httpHandler = {
              endpoints: [
                ${endpoints}
              ],
              requirements: require("./requirements.js").requirements
            };
          `;

          this.emitFile({
            type: 'asset',
            fileName: `${scope}.js`,
            source: fileContent
          });
        }
      }

      for (const fileName in bundle) {
        if (fileName.endsWith('.js')) {
          const isRoute = routes.some(route => fileName.startsWith(path.basename(route.filePath, '.ts')));
          if (isRoute) {
            delete bundle[fileName];
          }
        }
      }
    }
  };
}
