import path from 'node:path';
import fs from 'fs-extra';
import glob from 'fast-glob';
import {Plugin} from 'vite';
import {
  Project,
  SourceFile
} from 'ts-morph';
import { execSync } from 'child_process';

type ApiStructureNode = { [key: string]: string | ApiStructureNode };
interface SchemaObject {
  [key: string]: string | SchemaObject;
}

export const isValidIdentifier = (s: string) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(s);

export const toPascalCase = (s: string) =>
  s.split(/[-_]+/).filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');

export const isHandlerFile = (filePath: string): boolean =>
  /\/(GET|POST|PUT|DELETE)\.ts$/.test(filePath);

// Try to run local ESLint with project rules to auto-fix formatting of generated files.
// This is best-effort: if ESLint is not installed, we just skip with a warning.
const runEslintFix = (files: string | string[]) => {
  try {
    const cwd = process.cwd();
    const list = Array.isArray(files) ? files : [files];
    const targets = list.map(f => path.isAbsolute(f) ? f : path.resolve(cwd, f));
    const eslintBin = path.resolve(
      cwd,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'eslint.cmd' : 'eslint'
    );

    const quoted = targets.map(f => `"${f}"`).join(' ');
    const cmd = fs.existsSync(eslintBin)
      ? `"${eslintBin}" --fix --quiet ${quoted}`
      : `npx -y eslint --fix --quiet ${quoted}`;

    execSync(cmd, { stdio: 'ignore', cwd });
  } catch (e) {
    const msg = (e as Error).message;
    console.warn('[youtrack-api-generator] ESLint auto-fix skipped:', msg);
    if (msg.includes('ENOENT') || msg.includes('not found') || msg.includes('spawn')) {
      console.warn('[youtrack-api-generator] Install ESLint to enable auto-fix: npm install -D eslint');
    }
  }
};

export const populateApiStructure = (
  parts: string[],
  method: 'GET' | 'POST',
  handler: string,
  apiStructure: ApiStructureNode
) => {
  let current: ApiStructureNode = apiStructure;
  for (const part of parts) {
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part] as ApiStructureNode;
  }
  current[
    method
  ] = `ExtractRPCFromHandler<${handler}.Handle>`;
};

export const processRouteFile = async (
  sourceFile: SourceFile,
  routerRoot: string,
  apiStructure: ApiStructureNode,
  allTypes: Map<string, { namespaceImports: Set<string>; namedImports: Set<string> }>
) => {
  const relativePath = path.relative(routerRoot, sourceFile.getFilePath());
  const parts = relativePath.replace(/\\/g, '/').split('/');
  const scope = parts[0];
  const method = path.basename(sourceFile.getFilePath(), '.ts') as 'GET' | 'POST';
  const routePath = parts.slice(1, -1);
  const handlerName = `${scope}${routePath.map(toPascalCase).join('')}${method}Handler`;

  populateApiStructure(
    [scope, ...routePath],
    method,
    handlerName,
    apiStructure
  );

  const importPath = `../backend/router/${relativePath.replace(/\.ts$/, '')}`;
  if (!allTypes.has(importPath)) {
    allTypes.set(importPath, { namespaceImports: new Set(), namedImports: new Set() });
  }
  const typeInfo = allTypes.get(importPath)!;
  // Import the full module as a namespace to access Req/Res exports
  typeInfo.namespaceImports.add(handlerName);
};

export const formatApiStructure = (obj: ApiStructureNode, depth = 0): string => {
  const pad = '    '.repeat(depth + 1);
  const closePad = '    '.repeat(depth);
  const entries = Object.entries(obj)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const safeKey = isValidIdentifier(key) ? key : `'${key}'`;
      if (typeof value === 'string') {
        return `${pad}${safeKey}: ${value};`;
      }
      return `${pad}${safeKey}: ${formatApiStructure(value, depth + 1)};`;
    })
    .join('\n');
  return `{\n${entries}\n${closePad}}`;
};

// Helper function to recursively discover all @zod-to-schema annotated types
const discoverAnnotatedTypes = async (filePath: string, processedFiles: Set<string>): Promise<string[]> => {
  // Avoid infinite recursion by tracking processed files
  if (processedFiles.has(filePath)) {
    return [];
  }
  processedFiles.add(filePath);

  const discoveredTypes: string[] = [];

  try {
    const content = await fs.readFile(filePath, 'utf8');

    if (content.includes('@zod-to-schema')) {
      // two-step approach to find annotated types
      // Step 1: Find all @zod-to-schema annotations
      const annotationPattern = /\/\*\*\s*\n\s*\*\s*@zod-to-schema\s*\n\s*\*\//g;
      const annotations = [...content.matchAll(annotationPattern)];

      for (const annotation of annotations) {
        const startIndex = annotation.index + annotation[0].length;
        const remainingContent = content.substring(startIndex);

        // Step 2: Look for the next export type after each annotation
        const typeMatch = remainingContent.match(/\s*export\s+type\s+\w+\s*=\s*(?:\{[\s\S]*?\}|(?:\s*\|?\s*"[^"]*"\s*)+);?/);
        if (typeMatch) {
          // Combine annotation plus type for complete definition
          const fullDefinition = annotation[0] + typeMatch[0];
          discoveredTypes.push(fullDefinition);
        }
      }
    }

    // Find import statements that might reference other annotated types
    const importMatches = content.match(/import\s+(?:type\s+)?{[^}]+}\s+from\s+['"][^'"]+['"];?/g);
    if (importMatches) {
      for (const importStatement of importMatches) {
        // Extract the import path
        const pathMatch = importStatement.match(/from\s+['"]([^'"]+)['"]/);
        if (pathMatch) {
          let importPath = pathMatch[1];

          // Resolve relative imports
          if (importPath.startsWith('.')) {
            const currentDir = path.dirname(filePath);
            importPath = path.resolve(currentDir, importPath);
          } else if (importPath.startsWith('@/')) {
            // Handle @/ alias
            const srcDir = path.resolve(process.cwd(), 'src');
            importPath = path.resolve(srcDir, importPath.substring(2));
          }

          // Add .ts extension if not present
          if (!importPath.endsWith('.ts') && !importPath.endsWith('.tsx')) {
            if (await fs.pathExists(importPath + '.ts')) {
              importPath += '.ts';
            } else if (await fs.pathExists(importPath + '.tsx')) {
              importPath += '.tsx';
            }
          }

          // Recursively check imported files
          if (await fs.pathExists(importPath)) {
            const nestedTypes = await discoverAnnotatedTypes(importPath, processedFiles);
            discoveredTypes.push(...nestedTypes);
          }
        }
      }
    }
  } catch (error) {
    // Silently ignore files that can't be read
    console.warn(`[youtrack-api-generator] Could not read ${filePath}: ${(error as Error).message}`);
  }

  return discoveredTypes;
};

const generateZodSchemas = async (routeFiles: string[]) => {
  const apiZodPath = 'src/api/api.zod.ts';

  try {
    await fs.ensureDir(path.dirname(apiZodPath));
    const tempTypesFile = 'temp-types-for-zod.ts';
    let typesContent = '';
    let hasTypes = false;
    const schemaMapping: { [key: string]: { path: string[], method: string, reqType: string, resType: string } } = {};
    const allDiscoveredTypes = new Set<string>();

    for (const file of routeFiles) {
      const content = await fs.readFile(file, 'utf8');

      if (content.includes('@zod-to-schema')) {
        // Discover all annotated types from this file and its dependencies
        const processedFiles = new Set<string>();
        const discoveredTypes = await discoverAnnotatedTypes(file, processedFiles);

        // Add all discovered types to collection
        for (const typeDefinition of discoveredTypes) {
          allDiscoveredTypes.add(typeDefinition);
        }

        // extract the route-specific types for schema mapping
        const routeTypeMatches = content.match(/export\s+type\s+\w+(?:Req|Res)\s*=\s*(?:{[\s\S]*?}|[^;]+);?/g);
        if (routeTypeMatches) {
          hasTypes = true;

          // Extract path information for schema mapping
          const relativePath = path.relative(path.resolve(process.cwd(), 'src/backend/router'), file);
          const parts = relativePath.replace(/\\/g, '/').split('/');
          const method = path.basename(file, '.ts') as 'GET' | 'POST' | 'PUT' | 'DELETE';
          const routePath = parts.slice(0, -1); // Remove the method file

          // Extract type names - expecting descriptive names that are already unique
          // e.g., CreateTestRunReq, UpdateTestStepReq, GetProjectSettingsRes
          const reqMatch = content.match(/export\s+type\s+(\w+Req)\s*=/);
          const resMatch = content.match(/export\s+type\s+(\w+Res)\s*=/);

          // Include in schema mapping if we have at least one type (for GET endpoints, only Res is needed)
          if (reqMatch || resMatch) {
            const pathKey = routePath.join('/') + '/' + method;
            schemaMapping[pathKey] = {
              path: routePath,
              method,
              reqType: reqMatch ? reqMatch[1] : '', // Use the descriptive type name directly
              resType: resMatch ? resMatch[1] : ''  // Use the descriptive type name directly
            };
          }
        }
      }
    }

    // Convert discovered types to content string
    if (allDiscoveredTypes.size > 0) {
      typesContent = Array.from(allDiscoveredTypes).sort().join('\n\n') + '\n\n';
      hasTypes = true;
    }

    if (hasTypes) {
      // Write temp file to current working directory
      await fs.writeFile(tempTypesFile, typesContent);

      // Run ts-to-zod with proper error handling
      try {
        execSync(`npx ts-to-zod ${tempTypesFile} ${apiZodPath} --skipValidation`, {
          stdio: 'inherit',
          cwd: process.cwd()
        });

        let generatedContent = await fs.readFile(apiZodPath, 'utf8');

        // ts-to-zod generates Zod v3-style z.record(valueSchema) calls, but
        // Zod v4 removed the single-argument overload. Patch to z.record(z.string(), valueSchema).
        generatedContent = generatedContent.replace(
          /z\.record\((?!z\.string\(\))/g,
          'z.record(z.string(), '
        );

        const isSchemaObject = (value: string | SchemaObject | undefined): value is SchemaObject =>
          typeof value === 'object' && value !== null;

        const buildNestedSchema = (mapping: typeof schemaMapping) => {
          const result: SchemaObject = {};

          for (const [, info] of Object.entries(mapping)) {
            let current: SchemaObject = result;

            // Navigate/create the nested structure
            for (const segment of info.path) {
              const next = current[segment];
              if (!isSchemaObject(next)) {
                const nested: SchemaObject = {};
                current[segment] = nested;
                current = nested;
              } else {
                current = next;
              }
            }

            // Add the method and schemas
            const existingMethodSchema = current[info.method];
            if (!isSchemaObject(existingMethodSchema)) {
              current[info.method] = {};
            }
            const methodSchema = current[info.method] as SchemaObject;
            // Only add schemas if the type exists and is not empty
            if (info.reqType && info.reqType.trim()) {
              methodSchema.Req = `${info.reqType.charAt(0).toLowerCase() + info.reqType.slice(1)}Schema`;
            }
            if (info.resType && info.resType.trim()) {
              methodSchema.Res = `${info.resType.charAt(0).toLowerCase() + info.resType.slice(1)}Schema`;
            }
          }

          return result;
        };

        const nestedSchema = buildNestedSchema(schemaMapping);

        // Generate schema object string without JSON.stringify to preserve object references
        const generateSchemaObject = (obj: SchemaObject, indent = 0): string => {
          const spaces = '  '.repeat(indent);
          const entries = Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => {
            const safeKey = isValidIdentifier(key) ? key : `'${key}'`;
            if (typeof value === 'string') {
              return `${spaces}  ${safeKey}: ${value}`;
            } else if (typeof value === 'object' && value !== null) {
              return `${spaces}  ${safeKey}: {\n${generateSchemaObject(value, indent + 1)}\n${spaces}  }`;
            }
            return `${spaces}  ${safeKey}: ${value}`;
          }).join(',\n');
          return entries;
        };

        const schemaObjectString = `{\n${generateSchemaObject(nestedSchema)}\n}`;

        // Prevent duplicate schema exports by removing any existing ones first
        // This handles race conditions in watch mode where multiple builds may occur
        const schemaMarker = '// Nested schema object for validation system';
        const cleanedContent = (generatedContent.includes(schemaMarker)
          ? generatedContent.split(schemaMarker)[0]
          : generatedContent).trimEnd();

        // Now append the schema once
        const enhancedContent = cleanedContent + '\n\n' +
          `// Nested schema object for validation system\n` +
          `export const schema = ${schemaObjectString};\n`;

        await fs.writeFile(apiZodPath, enhancedContent);
        // Try to format the generated file with local ESLint rules
        runEslintFix(apiZodPath);

        console.log('✓ Generated Zod schemas with ts-to-zod');
      } catch (execError) {
        const msg = (execError as Error).message;
        console.error('[youtrack-api-generator] ts-to-zod failed:', msg);
        if (msg.includes('ENOENT') || msg.includes('not found') || msg.includes('Cannot find')) {
          console.error('[youtrack-api-generator] Install ts-to-zod with: npm install -D ts-to-zod');
        }
        throw execError;
      }

      // Clean up temp file
      await fs.remove(tempTypesFile);

    } else {
      // Create empty schema file if no @zod-to-schema annotations found
      await fs.writeFile(apiZodPath, `import {z} from 'zod';\n// No schemas generated - no @zod-to-schema annotations found\nexport const schema = {};\n`);
      runEslintFix(apiZodPath);
      console.log('✓ Created an empty Zod schema file (no @zod-to-schema annotations found)');
    }
  } catch (error) {
    console.warn('[youtrack-api-generator] Could not generate Zod schemas:', (error as Error).message);
    // Create empty schema file as fallback
    await fs.writeFile(apiZodPath, `import {z} from 'zod';\n// Fallback - schema generation failed\nexport const schema = {};\n`);
    runEslintFix(apiZodPath);
  }
};

export interface YoutrackApiGeneratorOptions {
  watchDebounceMs?: number;
}

/** Stable key for the current set of route files: sorted paths + mtimes. */
const routeKey = (routeFiles: string[]): string =>
  [...routeFiles].sort().map(f => {
    try { return `${f}:${fs.statSync(f).mtimeMs}`; } catch { return f; }
  }).join('|');

export default function youtrackApiGenerator(options: YoutrackApiGeneratorOptions = {}): Plugin {
  const { watchDebounceMs = 500 } = options;
  const routerRoot = path.resolve(process.cwd(), 'src/backend/router');
  const apiDtsPath = path.resolve(process.cwd(), 'src/api/api.d.ts');
  const apiZodPath = path.resolve(process.cwd(), 'src/api/api.zod.ts');

  // Cache the last-seen route key so that buildStart is a no-op when nothing
  // has changed. This prevents spurious re-writes to api.d.ts / api.zod.ts
  // which would otherwise trigger a rebuild loop via the file watcher.
  let lastRouteKey: string | null = null;

  const generateApi = async () => {
    const routeFiles = await glob('**/(GET|POST|PUT|DELETE).ts', {
      cwd: routerRoot,
      absolute: true
    });

    // Skip generation if routes are unchanged and both output files already exist.
    const key = routeKey(routeFiles);
    const [apiDtsExists, apiZodExists] = await Promise.all([
      fs.pathExists(apiDtsPath),
      fs.pathExists(apiZodPath),
    ]);
    if (apiDtsExists && apiZodExists) {
      // Same-process cache hit (e.g. second buildStart in watch mode).
      if (key === lastRouteKey) return;

      // Cross-process freshness check: on the very first buildStart of this
      // process, api files from a previous build (e.g. dev:upload) are still
      // current if every route file is older than api.d.ts.
      // Restricted to lastRouteKey === null so that deletions (which change the
      // key but don't update surviving files' mtimes) are never silently skipped.
      if (lastRouteKey === null) {
        try {
          const apiMtime = (await fs.stat(apiDtsPath)).mtimeMs;
          if (routeFiles.every(f => { try { return fs.statSync(f).mtimeMs <= apiMtime; } catch { return false; } })) {
            lastRouteKey = key;
            return;
          }
        } catch { /* stat failed, fall through to generation */ }
      }
    }

    const project = new Project();
    project.addSourceFilesAtPaths(routeFiles);

    const allTypes = new Map<string, { namespaceImports: Set<string>; namedImports: Set<string> }>();
    const apiStructure: ApiStructureNode = {};

    await Promise.all(
      project.getSourceFiles().map((sourceFile) =>
        processRouteFile(
          sourceFile,
          routerRoot,
          apiStructure,
          allTypes
        )
      )
    );

    // Generate Zod schemas BEFORE writing api.d.ts to avoid import resolution errors
    await generateZodSchemas(routeFiles);

    // Build api.d.ts as a plain string so formatApiStructure's indentation is
    // preserved exactly — going through ts-morph's printer flattens all nesting.
    const importLines = [`import { ExtractRPCFromHandler } from "../backend/types/utility";`];
    for (const [moduleSpecifier, typeInfo] of Array.from(allTypes.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      for (const namespaceName of Array.from(typeInfo.namespaceImports).sort()) {
        importLines.push(`import * as ${namespaceName} from "${moduleSpecifier}";`);
      }
      for (const namedImport of Array.from(typeInfo.namedImports).sort()) {
        importLines.push(`import { ${namedImport} } from "${moduleSpecifier}";`);
      }
    }

    const fileContent =
      importLines.join('\n') +
      '\n\n' +
      `export type ApiRouter = ${formatApiStructure(apiStructure)};\n`;

    await fs.ensureDir(path.dirname(apiDtsPath));
    await fs.writeFile(apiDtsPath, fileContent);
    runEslintFix(apiDtsPath);

    // Update the cache only after all writes succeed so a failed generation
    // is retried on the next buildStart.
    lastRouteKey = key;
  };

  return {
    name: 'vite-plugin-youtrack-api-generator',

    async config() {
      // Ignore generated API files from watch to prevent loops
      return {
        server: {
          watch: {
            ignored: (filepath: string) => {
              return filepath.includes('api.d.ts') || filepath.includes('api.zod.ts');
            }
          }
        }
      };
    },

    async buildStart() {
      // Regenerate API types on every build to pick up route changes.
      // Non-fatal: errors are logged so the backend build still produces handler files.
      try {
        await generateApi();
      } catch (err) {
        console.error('[youtrack-api-generator] Failed to generate API types:', (err as Error).message);
      }
      // Watch the router root so new/deleted handler files trigger a rebuild in
      // vite build --watch mode. Without this, Rollup only watches files already
      // in the module graph — adding a handler to a new subdirectory would never
      // be detected. In non-watch builds this call is silently ignored.
      this.addWatchFile(routerRoot);
    },

    configureServer(server) {
      const handlerGlob = path.join(routerRoot, '**', '{GET,POST,PUT,DELETE}.ts');
      server.watcher.add(handlerGlob);

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      let inFlight: Promise<void> | null = null;
      let pendingAfterFlight = false;

      const runGeneration = () => {
        inFlight = generateApi()
          .catch(err => {
            console.error('[youtrack-api-generator] Regeneration failed:', (err as Error).message);
          })
          .finally(() => {
            inFlight = null;
            if (pendingAfterFlight) {
              pendingAfterFlight = false;
              runGeneration();
            }
          });
      };

      const handleChange = (filePath: string) => {
        if (!isHandlerFile(filePath)) return;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          if (inFlight) {
            // Generation already running; coalesce into one trailing run.
            pendingAfterFlight = true;
          } else {
            runGeneration();
          }
        }, watchDebounceMs);
      };

      server.watcher.on('add', handleChange);
      server.watcher.on('change', handleChange);
      server.watcher.on('unlink', handleChange);
    },
  };
}
