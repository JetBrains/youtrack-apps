import path from 'node:path';
import fs from 'node:fs';
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
  const permissionsByFile = new Map<string, string[]>();

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

      // Collect route metadata
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

      // Try to parse permissions arrays from source files (optional wrapper)
      for (const filePath of routeFiles) {
        try {
          const src = fs.readFileSync(filePath, 'utf-8');
          // Match withPermissions(<fn>, [ 'PERM1', "PERM2" ])
          const match = src.match(/withPermissions\s*\(\s*(?:function|\([^)]*\)\s*=>)[\s\S]*?,\s*\[([\s\S]*?)\]\s*\)/m);
          if (match && match[1]) {
            const inside = match[1];
            const keys = inside
              .split(',')
              .map(s => s.trim())
              .map(s => s.replace(/^['"`]/, '').replace(/['"`]$/, ''))
              .filter(s => s.length > 0);
            if (keys.length > 0) {
              permissionsByFile.set(filePath, keys);
            }
          }
        } catch {
          // ignore read errors
        }
      }
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
                break;
              }
            }
            if (funcStart !== -1) {
              // Find matching closing brace of function body
              let braceCount = 0;
              for (let i = funcStart; i < lines.length; i++) {
                const line = lines[i];
                for (const ch of line) {
                  if (ch === '{') braceCount++;
                  else if (ch === '}') braceCount--;
                }
                if (braceCount === 0) {
                  funcEnd = i;
                  break;
                }
              }
              if (funcEnd !== -1) {
                const funcCode = lines.slice(funcStart, funcEnd + 1).join('\n');

                // Determine expected filename for this route
                const route = routes.find(r => {
                  const rel = path.relative(routerRoot, r.filePath);
                  const parsed = path.parse(rel);
                  const expected = `${path.join(parsed.dir, parsed.name).replace(/[\\/]/g, '-')}.js`;
                  return expected === fileName;
                });
                if (route) {
                  const fileNameKey = `${path.join(path.parse(path.relative(routerRoot, route.filePath)).dir, path.parse(route.filePath).name).replace(/[\\/]/g, '-')}.js`;
                  handlerFunctions.set(fileNameKey, funcCode);
                }
              }
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

            const perms = permissionsByFile.get(route.filePath);
            const permsLine = perms && perms.length > 0 ? `\n        permissions: [${perms.map(p => `'${p}'`).join(', ')}],` : '';

            return `      {
        method: "${route.method}",
        path: "${route.path}",
        scope: "${route.scope}",${permsLine}
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
