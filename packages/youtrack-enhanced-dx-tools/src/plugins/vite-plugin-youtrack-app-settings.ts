import path from 'node:path';
import fs from 'fs-extra';
import { Plugin } from 'vite';
import { execSync } from 'child_process';

/**
 * JSON Schema type definition
 */
interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  enum?: unknown[];
  required?: string[];
  description?: string;
  'x-entity'?: string;
  [key: string]: unknown;
}

/**
 * Extension property definition from entity-extensions.json
 */
interface ExtensionProperty {
  type: 'string' | 'integer' | 'float' | 'boolean' | string;
  multi?: boolean;
}

/**
 * Entity type extension definition
 */
interface EntityTypeExtension {
  entityType: string;
  properties: Record<string, ExtensionProperty>;
}

/**
 * Root structure of entity-extensions.json
 */
interface EntityExtensions {
  entityTypeExtensions: EntityTypeExtension[];
}

/**
 * TypeScript type mapping for extension property types
 */
const typeMapping: Record<string, string> = {
  string: 'string',
  integer: 'number',
  float: 'number',
  boolean: 'boolean',
};

/**
 * YouTrack entity types that should be imported from youtrack-workflow-api
 */
const youtrackEntityTypes = new Set([
  'Issue', 'Project', 'Article', 'User', 'UserGroup', 'Tag', 'State',
  'Build', 'ProjectVersion', 'EnumField', 'OwnedField', 'Field',
  'Comment', 'IssueComment', 'ArticleComment', 'WorkItemType', 'Sprint',
  'Agile', 'Gantt', 'SavedQuery', 'IssueTag', 'VcsChange', 'PullRequest',
  'IssueWorkItem', 'IssueAttachment', 'ArticleAttachment', 'Channel',
  'MailboxChannel', 'FeedbackForm', 'Calendar', 'SimpleCalendar',
  'Calendar24x7', 'ProjectType', 'ProjectTeam', 'ChangesProcessor',
  'VcsServer', 'WatchFolder', 'BaseEntity',
]);

/**
 * Run ESLint fix on generated files
 */
const runEslintFix = (files: string | string[]) => {
  try {
    const cwd = process.cwd();
    const list = Array.isArray(files) ? files : [files];
    const targets = list.map(f => path.isAbsolute(f) ? f : path.resolve(cwd, f));
    const eslintBin = path.resolve(cwd, 'node_modules', '.bin',
      process.platform === 'win32' ? 'eslint.cmd' : 'eslint');
    
    const quoted = targets.map(f => `"${f}"`).join(' ');
    const cmd = fs.existsSync(eslintBin)
      ? `"${eslintBin}" --fix --quiet ${quoted}`
      : `npx -y eslint --fix --quiet ${quoted}`;
    
    execSync(cmd, { stdio: 'ignore', cwd });
  } catch (e) {
    const msg = (e as Error).message;
    console.warn('[youtrack-app-settings] ESLint auto-fix skipped:', msg);
    if (msg.includes('ENOENT') || msg.includes('not found') || msg.includes('spawn')) {
      console.warn('[youtrack-app-settings] Install ESLint to enable: npm install -D eslint');
    }
  }
};

/**
 * Returns a TypeScript-safe property key: bare identifier or single-quoted string.
 */
export const safeKey = (key: string): string =>
  /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
    ? key
    : `'${key.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/**
 * Convert JSON Schema type to TypeScript type
 */
export const jsonSchemaToTS = (schema: JSONSchema): string => {
  if (!schema.type) return 'unknown';
  
  switch (schema.type) {
    case 'string':
      if (schema.enum) {
        return schema.enum.map(v => `'${v}'`).join(' | ');
      }
      return 'string';
    
    case 'number':
    case 'integer':
      return 'number';
    
    case 'boolean':
      return 'boolean';
    
    case 'array':
      if (schema.items) {
        const itemType = jsonSchemaToTS(schema.items);
        return `${itemType}[]`;
      }
      return 'unknown[]';
    
    case 'object':
      if (schema['x-entity']) {
        // YouTrack entity reference
        return schema['x-entity'];
      }
      if (schema.properties) {
        return generateObjectType(schema.properties, schema.required);
      }
      return 'Record<string, unknown>';
    
    case 'null':
      return 'null';
    
    default:
      return 'unknown';
  }
};

/**
 * Generate TypeScript object type from JSON Schema properties
 */
export const generateObjectType = (
  properties: Record<string, JSONSchema>,
  required: string[] = []
): string => {
  const props = Object.entries(properties).map(([key, schema]) => {
    const isRequired = required.includes(key);
    const optional = isRequired ? '' : '?';
    const type = jsonSchemaToTS(schema);
    const description = schema.description ? `\n    /** ${schema.description} */` : '';
    return `${description}\n    ${safeKey(key)}${optional}: ${type};`;
  });
  
  return `{\n  ${props.join('\n  ')}\n  }`;
};

/**
 * Convert extension property type to TypeScript type
 */
const getExtensionPropertyType = (prop: ExtensionProperty): string => {
  const baseType = typeMapping[prop.type] || 
    (youtrackEntityTypes.has(prop.type) ? prop.type : 'unknown');
  
  if (prop.multi) {
    return `Set<${baseType}>`;
  }
  
  return baseType;
};

/**
 * Generate extension properties type
 */
export const generateExtensionPropertiesType = (
  properties: Record<string, ExtensionProperty>
): string => {
  const entries = Object.entries(properties)
    .map(([name, prop]) => {
      const tsType = getExtensionPropertyType(prop);
      return `      ${safeKey(name)}?: ${tsType};`;
    })
    .join('\n');
  
  return `{\n${entries}\n    }`;
};

/**
 * Entity type to registry key mapping
 */
const entityTypeToRegistryKey: Record<string, string> = {
  'Issue': 'issueExtensions',
  'Project': 'projectExtensions',
  'Article': 'articleExtensions',
  'User': 'userExtensions',
  'AppGlobalStorage': 'appGlobalStorageExtensions'
};

/**
 * Main plugin function
 */
export default function youtrackAppSettings(): Plugin {
  const settingsPath = path.resolve(process.cwd(), 'src', 'settings.json');
  const extensionsPath = path.resolve(process.cwd(), 'src', 'entity-extensions.json');
  const outputPath = path.resolve(process.cwd(), 'src', 'api', 'app.d.ts');
  
  const generateTypes = async () => {
    let settingsType = 'Record<string, unknown>';
    const extensionTypes: Record<string, string> = {
      issueExtensions: 'Record<string, never>',
      projectExtensions: 'Record<string, never>',
      articleExtensions: 'Record<string, never>',
      userExtensions: 'Record<string, never>',
      appGlobalStorageExtensions: 'Record<string, never>'
    };
    
    const imports = new Set<string>();
    
    // Parse app settings.json
    if (await fs.pathExists(settingsPath)) {
      try {
        const settingsSchema: JSONSchema = await fs.readJson(settingsPath);
        if (settingsSchema.properties) {
          settingsType = generateObjectType(
            settingsSchema.properties,
            settingsSchema.required
          );
          
          // Collect YouTrack entity types used in settings
          const collectEntityTypes = (schema: JSONSchema) => {
            if (schema['x-entity'] && youtrackEntityTypes.has(schema['x-entity'])) {
              imports.add(schema['x-entity']);
            }
            if (schema.properties) {
              Object.values(schema.properties).forEach(collectEntityTypes);
            }
            if (schema.items) {
              collectEntityTypes(schema.items);
            }
          };
          Object.values(settingsSchema.properties).forEach(collectEntityTypes);
        }
      } catch (error) {
        console.error('[youtrack-app-settings] Error parsing settings.json:', (error as Error).message);
      }
    }
    
    // Parse entity-extensions.json
    if (await fs.pathExists(extensionsPath)) {
      try {
        const extensions: EntityExtensions = await fs.readJson(extensionsPath);
        
        extensions.entityTypeExtensions.forEach(ext => {
          const registryKey = entityTypeToRegistryKey[ext.entityType];
          if (registryKey) {
            extensionTypes[registryKey] = generateExtensionPropertiesType(ext.properties);
            
            // Collect entity types used in extensions
            Object.values(ext.properties).forEach(prop => {
              if (youtrackEntityTypes.has(prop.type)) {
                imports.add(prop.type);
              }
            });
          }
        });
      } catch (error) {
        console.error('[youtrack-app-settings] Error parsing entity-extensions.json:', (error as Error).message);
      }
    }
    
    // Generate import statement for YouTrack entity types
    const importStatement = imports.size > 0
      ? `import type { ${Array.from(imports).sort().join(', ')} } from '@jetbrains/youtrack-enhanced-dx-tools/youtrack-workflow-api';\n\n`
      : '';
    
    // Generate global type declarations (for use with global CtxGet, CtxPost, etc.)
    const content = `${importStatement}/**
 * App Settings - Auto-generated types for app settings and extension properties
 * 
 * This file is automatically generated by the youtrack-app-settings Vite plugin.
 * DO NOT EDIT MANUALLY - changes will be overwritten.
 * 
 * Generated from:
 * - src/settings.json (app settings)
 * - entity-extensions.json (extension properties)
 * 
 * These types are declared globally and automatically picked up by all handler contexts.
 * 
 * @generated
 */

declare global {
  /**
   * App settings type from settings.json
   * Automatically accessible via ctx.settings in all handlers
   */
  type AppSettings = ${settingsType};
  
  /**
   * Issue extension properties type from entity-extensions.json
   * Automatically accessible via issue.extensionProperties when using ExtendedIssue
   */
  type IssueExtensionProperties = ${extensionTypes.issueExtensions};
  
  /**
   * Project extension properties type from entity-extensions.json
   * Automatically accessible via project.extensionProperties when using ExtendedProject
   */
  type ProjectExtensionProperties = ${extensionTypes.projectExtensions};
  
  /**
   * Article extension properties type from entity-extensions.json
   * Automatically accessible via article.extensionProperties when using ExtendedArticle
   */
  type ArticleExtensionProperties = ${extensionTypes.articleExtensions};
  
  /**
   * User extension properties type from entity-extensions.json
   * Automatically accessible via user.extensionProperties when using ExtendedUser
   */
  type UserExtensionProperties = ${extensionTypes.userExtensions};
  
  /**
   * AppGlobalStorage extension properties type from entity-extensions.json
   * Automatically accessible via ctx.globalStorage.extensionProperties
   */
  type AppGlobalStorageExtensionProperties = ${extensionTypes.appGlobalStorageExtensions};
}

// This is needed to make the file a module
export {};
`;
    
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, content);
    runEslintFix(outputPath);
    
    console.log('✓ Generated app type registry from settings.json and entity-extensions.json');
  };
  
  return {
    name: 'vite-plugin-youtrack-app-settings',
    
    async config() {
      return {
        server: {
          watch: {
            ignored: (filepath: string) => filepath.includes('app.d.ts')
          }
        }
      };
    },
    
    async buildStart() {
      const settingsPath = path.resolve(process.cwd(), 'src', 'settings.json');
      const extensionsPath = path.resolve(process.cwd(), 'src', 'entity-extensions.json');
      this.addWatchFile(settingsPath);
      this.addWatchFile(extensionsPath);
      await generateTypes();
    }
  };
}
