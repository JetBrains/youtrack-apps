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

      // Configure output naming
      if (!config.build.rollupOptions) {
        config.build.rollupOptions = {};
      }
      if (!config.build.rollupOptions.output) {
        config.build.rollupOptions.output = {};
      }
      const output = Array.isArray(config.build.rollupOptions.output)
        ? config.build.rollupOptions.output[0]
        : config.build.rollupOptions.output;

      output.entryFileNames = (chunkInfo) => {
        // Name the requirements file correctly
        if (chunkInfo.facadeModuleId && chunkInfo.facadeModuleId.includes('requirements.ts')) {
          return 'requirements.js';
        }
        // Name endpoint files by their path
        const routerRootResolved = path.resolve(process.cwd(), 'src/backend/router');
        if (chunkInfo.facadeModuleId && chunkInfo.facadeModuleId.startsWith(routerRootResolved)) {
          const relativePath = path.relative(routerRootResolved, chunkInfo.facadeModuleId);
          const parsedPath = path.parse(relativePath);
          const name = path.join(parsedPath.dir, parsedPath.name).replace(/[\\/]/g, '-');
          return `${name}.js`;
        }
        return '[name].js';
      };

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

      // Extract handler functions from compiled chunks
      const handlerFunctions = new Map<string, string>();
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk' && fileName.endsWith('.js')) {
          const isRoute = routes.some(route => {
            const relativePath = path.relative(routerRoot, route.filePath);
            const parsedPath = path.parse(relativePath);
            const expectedName = path.join(parsedPath.dir, parsedPath.name).replace(/[\\/]/g, '-');
            return fileName === `${expectedName}.js`;
          });

          if (isRoute) {
            // Extract the default export function - find it by counting braces
            const code = chunk.code;
            const lines = code.split('\n');
            let funcStart = -1;
            let funcEnd = -1;

            for (let i = 0; i < lines.length; i++) {
              if (lines[i].match(/^function\s+\w+\s*\(/)) {
                funcStart = i;
                let braceCount = 0;
                let foundOpen = false;

                for (let j = i; j < lines.length; j++) {
                  for (const char of lines[j]) {
                    if (char === '{') {
                      braceCount++;
                      foundOpen = true;
                    }
                    if (char === '}') {
                      braceCount--;
                      if (foundOpen && braceCount === 0) {
                        funcEnd = j;
                        break;
                      }
                    }
                  }
                  if (funcEnd !== -1) break;
                }
                break;
              }
            }

            if (funcStart !== -1 && funcEnd !== -1) {
              const funcCode = lines.slice(funcStart, funcEnd + 1).join('\n');
              handlerFunctions.set(fileName, funcCode);
            }
          }
        }
      }

      for (const scope in routesByScope) {
        if (Object.prototype.hasOwnProperty.call(routesByScope, scope)) {
          const scopeRoutes = routesByScope[scope];
          const endpoints = scopeRoutes.map(route => {
            const relativePath = path.relative(routerRoot, route.filePath);
            const parsedPath = path.parse(relativePath);
            const fileName = `${path.join(parsedPath.dir, parsedPath.name).replace(/[\\/]/g, '-')}.js`;
            const handlerCode = handlerFunctions.get(fileName) || 'function() {}';

            // Clean up function name and indent properly
            const cleanHandler = handlerCode.replace(/function\s+\w+\s*\(/, 'function(');
            // Indent each line of the function by 12 spaces (3 levels of 4 spaces)
            const indentedHandler = cleanHandler.split('\n').map((line, idx) => {
              if (idx === 0) return line; // Don't indent the first line (function declaration)
              return '        ' + line; // 12 spaces for function body
            }).join('\n');

            return `      {
        method: "${route.method}",
        path: "${route.path}",
        scope: "${route.scope}",
        handle: ${indentedHandler}
      }`;
          }).join(',\n');

          const fileContent = `"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const requirements = require("./requirements.js");

const httpHandler = {
    endpoints: [
${endpoints}
    ],
    requirements: requirements.requirements
};

exports.httpHandler = httpHandler;
`;

          this.emitFile({
            type: 'asset',
            fileName: `${scope}.js`,
            source: fileContent
          });
        }
      }

      // Delete individual endpoint files
      for (const fileName in bundle) {
        if (fileName.endsWith('.js')) {
          const isRoute = routes.some(route => {
            const relativePath = path.relative(routerRoot, route.filePath);
            const parsedPath = path.parse(relativePath);
            const expectedName = path.join(parsedPath.dir, parsedPath.name).replace(/[\\/]/g, '-');
            return fileName === `${expectedName}.js`;
          });
          if (isRoute) {
            delete bundle[fileName];
          }
        }
      }
    }
  };
}
