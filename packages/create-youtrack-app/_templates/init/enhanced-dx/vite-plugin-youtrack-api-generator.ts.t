---
to: vite-plugin-youtrack-api-generator.ts
---
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

const populateApiStructure = (
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

const processRouteFile = async (
  sourceFile: SourceFile,
  routerRoot: string,
  apiStructure: ApiStructureNode,
  allTypes: Map<string, { namespaceImports: Set<string>; namedImports: Set<string> }>
) => {
  const relativePath = path.relative(routerRoot, sourceFile.getFilePath());
  const parts = relativePath.split(path.sep);
  const scope = parts[0];
  const method = path.basename(sourceFile.getFilePath(), '.ts') as 'GET' | 'POST';
  const routePath = parts.slice(1, -1);
  const handlerName = `${scope}${routePath.join('')}${method}Handler`;

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

const formatApiStructure = (obj: ApiStructureNode): string => {
  const entries = Object.entries(obj).
    map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}: ${value};`;
      }
      return `${key}: ${formatApiStructure(value)};`;
    }).
    join('\n');
  return `{\n${entries}\n}`;
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
    console.warn(`Warning: Could not read file ${filePath}: ${(error as Error).message}`);
  }
  
  return discoveredTypes;
};

const generateZodSchemas = async (routeFiles: string[]) => {
  const apiZodPath = 'src/api/api.zod.ts';
  
  try {
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
          const parts = relativePath.split(path.sep);
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
      typesContent = Array.from(allDiscoveredTypes).join('\n\n') + '\n\n';
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
        
        const generatedContent = await fs.readFile(apiZodPath, 'utf8');
        
        const buildNestedSchema = (mapping: typeof schemaMapping) => {
          const result: Record<string, unknown> = {};
          
          for (const [, info] of Object.entries(mapping)) {
            let current = result;
            
            // Navigate/create the nested structure
            for (const segment of info.path) {
              if (!current[segment]) {
                current[segment] = {};
              }
              current = current[segment];
            }
            
            // Add the method and schemas
            if (!current[info.method]) {
              current[info.method] = {};
            }
            // Only add schemas if the type exists and is not empty
            if (info.reqType && info.reqType.trim()) {
              current[info.method].Req = `${info.reqType.charAt(0).toLowerCase() + info.reqType.slice(1)}Schema`;
            }
            if (info.resType && info.resType.trim()) {
              current[info.method].Res = `${info.resType.charAt(0).toLowerCase() + info.resType.slice(1)}Schema`;
            }
          }
          
          return result;
        };
        
        const nestedSchema = buildNestedSchema(schemaMapping);
        
        // Generate schema object string without JSON.stringify to preserve object references
        const generateSchemaObject = (obj: Record<string, unknown>, indent = 0): string => {
          const spaces = '  '.repeat(indent);
          const entries = Object.entries(obj).map(([key, value]) => {
            if (typeof value === 'string') {
              // This is a schema reference, don't quote it
              return `${spaces}  ${key}: ${value}`;
            } else if (typeof value === 'object' && value !== null) {
              // This is a nested object
              return `${spaces}  ${key}: {\n${generateSchemaObject(value, indent + 1)}\n${spaces}  }`;
            }
            return `${spaces}  ${key}: ${value}`;
          }).join(',\n');
          return entries;
        };
        
        const schemaObjectString = `{\n${generateSchemaObject(nestedSchema)}\n}`;
        
        const enhancedContent = generatedContent + '\n' + 
          `// Nested schema object for validation system\n` +
          `export const schema = ${schemaObjectString};\n`;
        
        await fs.writeFile(apiZodPath, enhancedContent);
        
        console.log('✓ Generated Zod schemas with ts-to-zod');
      } catch (execError) {
        console.error('ts-to-zod failed:', (execError as Error).message);
        throw execError;
      }
      
      // Clean up temp file
      await fs.remove(tempTypesFile);
      
    } else {
      // Create empty schema file if no @zod-to-schema annotations found
      await fs.writeFile(apiZodPath, `import {z} from 'zod';\n// No schemas generated - no @zod-to-schema annotations found\nexport const schema = {};\n`);
      console.log('✓ Created empty Zod schema (no @zod-to-schema annotations found)');
    }
  } catch (error) {
    console.warn('Warning: Could not generate Zod schemas:', (error as Error).message);
    // Create empty schema file as fallback
    await fs.writeFile(apiZodPath, `import {z} from 'zod';\n// Fallback - schema generation failed\nexport const schema = {};\n`);
  }
};

export default function youtrackApiGenerator(): Plugin {
  const routerRoot = path.resolve(process.cwd(), 'src/backend/router');
  const apiDtsPath = path.resolve(process.cwd(), 'src/api/api.d.ts');

  return {
    name: 'vite-plugin-youtrack-api-generator',
    async buildStart() {
      const routeFiles = await glob('**/(GET|POST|PUT|DELETE).ts', {
        cwd: routerRoot,
        absolute: true
      });

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

      const apiDtsFile = project.createSourceFile(apiDtsPath, '', {
        overwrite: true
      });

      apiDtsFile.addImportDeclaration({
        moduleSpecifier: '../backend/types/utility',
        namedImports: ['ExtractRPCFromHandler']
      });

      for (const [moduleSpecifier, typeInfo] of allTypes.entries()) {
        // Prioritize namespace imports over named imports to avoid conflicts
        // If we have namespace imports, use those exclusively for this module
        if (typeInfo.namespaceImports.size > 0) {
          for (const namespaceName of typeInfo.namespaceImports) {
            apiDtsFile.addImportDeclaration({
              moduleSpecifier,
              namespaceImport: namespaceName
            });
          }
        } else if (typeInfo.namedImports.size > 0) {
          // Only use named imports if we don't have namespace imports for this module
          apiDtsFile.addImportDeclaration({
            moduleSpecifier,
            namedImports: Array.from(typeInfo.namedImports)
          });
        }
      }

      apiDtsFile.addTypeAlias({
        name: 'ApiRouter',
        isExported: true,
        type: formatApiStructure(apiStructure)
      });

      await fs.writeFile(apiDtsPath, apiDtsFile.getFullText());

      await generateZodSchemas(routeFiles);
    }
  };
}
