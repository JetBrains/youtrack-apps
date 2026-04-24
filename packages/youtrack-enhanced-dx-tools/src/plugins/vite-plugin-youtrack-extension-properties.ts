import path from 'node:path';
import fs from 'fs-extra';
import { Plugin } from 'vite';
import { Project, SourceFile } from 'ts-morph';
import { execSync } from 'child_process';

/**
 * Extension property definition from entity-extensions.json
 */
interface ExtensionProperty {
  type: 'string' | 'integer' | 'float' | 'boolean' | string; // string can be any YouTrack entity type
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
 * YouTrack entity types that should be imported from youtrack-types
 */
const youtrackEntityTypes = new Set([
  'Issue',
  'Project',
  'Article',
  'User',
  'UserGroup',
  'Tag',
  'State',
  'Build',
  'ProjectVersion',
  'EnumField',
  'OwnedField',
  'Field',
  'Comment',
  'IssueComment',
  'ArticleComment',
  'WorkItemType',
  'Sprint',
  'Agile',
  'Gantt',
  'SavedQuery',
  'IssueTag',
  'VcsChange',
  'PullRequest',
  'IssueWorkItem',
  'IssueAttachment',
  'ArticleAttachment',
  'Channel',
  'MailboxChannel',
  'FeedbackForm',
  'Calendar',
  'SimpleCalendar',
  'Calendar24x7',
  'ProjectType',
  'ProjectTeam',
  'ChangesProcessor',
  'VcsServer',
  'WatchFolder',
  'BaseEntity',
]);

/**
 * Try to run local ESLint with project rules to auto-fix formatting of generated files.
 */
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
    console.warn('[youtrack-extension-properties] ESLint auto-fix skipped:', msg);
    if (msg.includes('ENOENT') || msg.includes('not found') || msg.includes('spawn')) {
      console.warn('[youtrack-extension-properties] Install ESLint to enable auto-fix: npm install -D eslint');
    }
  }
};

/**
 * Convert extension property type to TypeScript type
 */
export const getTypeScriptType = (prop: ExtensionProperty, entityTypes: Set<string>): string => {
  const baseType = typeMapping[prop.type] || (youtrackEntityTypes.has(prop.type) ? prop.type : 'unknown');

  if (prop.multi) {
    // Multi properties return a Set
    return `Set<${baseType}>`;
  }

  return baseType;
};

/**
 * Generate TypeScript type for extension properties
 */
export const generateExtensionPropertiesType = (
  properties: Record<string, ExtensionProperty>,
  entityTypes: Set<string>
): string => {
  const entries = Object.entries(properties)
    .map(([name, prop]) => {
      const tsType = getTypeScriptType(prop, entityTypes);
      return `  ${name}?: ${tsType};`;
    })
    .join('\n');

  return `{\n${entries}\n}`;
};

/**
 * Generate AppGlobalStorage extension properties type
 */
const generateGlobalStorageType = (
  properties: Record<string, ExtensionProperty>,
  entityTypes: Set<string>
): string => {
  const extensionPropertiesType = generateExtensionPropertiesType(properties, entityTypes);

  return `/**
 * Global storage extension properties for the app
 */
export interface AppGlobalStorageExtensionProperties ${extensionPropertiesType}`;
};

/**
 * Generate extended entity type
 */
const generateExtendedEntityType = (
  entityType: string,
  properties: Record<string, ExtensionProperty>,
  entityTypes: Set<string>
): string => {
  const extensionPropertiesType = generateExtensionPropertiesType(properties, entityTypes);

  return `/**
 * Extended ${entityType} with app-specific extension properties
 */
export interface Extended${entityType} extends ${entityType} {
  extensionProperties: ${extensionPropertiesType};
}`;
};

/**
 * Generate all extended entity types
 */
export const generateExtendedEntities = (extensions: EntityExtensions): string => {
  const entityTypes = new Set<string>();
  const imports = new Set<string>();
  const globalStorageExt = extensions.entityTypeExtensions.find(ext => ext.entityType === 'AppGlobalStorage');

  // Collect all entity types that have extensions
  const extendedEntityTypes = new Set<string>();

  extensions.entityTypeExtensions.forEach(ext => {
    if (ext.entityType !== 'AppGlobalStorage') {
      entityTypes.add(ext.entityType);
      extendedEntityTypes.add(ext.entityType);
    }
    Object.values(ext.properties).forEach(prop => {
      if (youtrackEntityTypes.has(prop.type)) {
        entityTypes.add(prop.type);
        imports.add(prop.type);
      }
    });
  });

  // Add base entity types to imports for extended types
  extendedEntityTypes.forEach(entityType => {
    imports.add(entityType);
  });

  // Generate imports from the workflow API
  const importStatements = imports.size > 0
    ? `import type { ${Array.from(imports).sort().join(', ')} } from '@jetbrains/youtrack-enhanced-dx-tools/youtrack-workflow-api';\n\n`
    : '';

  // Generate extended entity types (excluding AppGlobalStorage)
  const extendedTypes = extensions.entityTypeExtensions
    .filter(ext => ext.entityType !== 'AppGlobalStorage')
    .map(ext => generateExtendedEntityType(ext.entityType, ext.properties, entityTypes))
    .join('\n\n');

  // Generate AppGlobalStorage extension properties type
  const globalStorageType = globalStorageExt
    ? `\n\n${generateGlobalStorageType(globalStorageExt.properties, entityTypes)}`
    : '';

  // Generate ExtendedProperties map with all possible entities
  const allPossibleEntities = ['Issue', 'Project', 'Article', 'User'];
  const extendedPropertiesMap = allPossibleEntities.map(entityType => {
    const hasExtension = extendedEntityTypes.has(entityType);
    return `  ${entityType}: ${hasExtension ? `Extended${entityType}` : 'never'};`;
  }).join('\n');

  const hasGlobalStorage = !!globalStorageExt;
  const globalStorageEntry = `  AppGlobalStorage: ${hasGlobalStorage ? 'AppGlobalStorageExtensionProperties' : 'never'};`;

  const extendedPropertiesType = `\n\n/**
 * Map of entity types to their extended versions
 * Extended types have extension properties, others are 'never'
 */
export type ExtendedProperties = {
${extendedPropertiesMap}
${globalStorageEntry}
};`;

  return `${importStatements}${extendedTypes}${globalStorageType}${extendedPropertiesType}`;
};

/**
 * Generate utility types for using extended entities in contexts
 */
const generateContextUtilities = (extensions: EntityExtensions): string => {
  const entitiesToExtend = new Set<string>();
  extensions.entityTypeExtensions.forEach(ext => {
    entitiesToExtend.add(ext.entityType);
  });

  if (entitiesToExtend.size === 0) {
    return `// No extended entities - use base context types from @jetbrains/youtrack-enhanced-dx-tools
export type ExtendedIssueCtx<T extends import('@jetbrains/youtrack-enhanced-dx-tools').IssueCtx> = T;
export type ExtendedProjectCtx<T extends import('@jetbrains/youtrack-enhanced-dx-tools').ProjectCtx> = T;
export type ExtendedArticleCtx<T extends import('@jetbrains/youtrack-enhanced-dx-tools').ArticleCtx> = T;
export type ExtendedUserCtx<T extends import('@jetbrains/youtrack-enhanced-dx-tools').UserCtx> = T;
`;
  }

  const extendedEntityNames = Array.from(entitiesToExtend)
    .map(e => `Extended${e}`)
    .sort();

  const utilities: string[] = [];

  // Generate utility types that replace base entities with extended ones
  if (entitiesToExtend.has('Issue')) {
    utilities.push(`/**
 * Issue context with extended entity (includes extension properties)
 */
export type ExtendedIssueCtx<T extends import('@jetbrains/youtrack-enhanced-dx-tools').IssueCtx> =
  Omit<T, 'issue'> & { issue: ExtendedIssue };`);
  }

  if (entitiesToExtend.has('Project')) {
    utilities.push(`/**
 * Project context with extended entity (includes extension properties)
 */
export type ExtendedProjectCtx<T extends import('@jetbrains/youtrack-enhanced-dx-tools').ProjectCtx> =
  Omit<T, 'project'> & { project: ExtendedProject };`);
  }

  if (entitiesToExtend.has('Article')) {
    utilities.push(`/**
 * Article context with extended entity (includes extension properties)
 */
export type ExtendedArticleCtx<T extends import('@jetbrains/youtrack-enhanced-dx-tools').ArticleCtx> =
  Omit<T, 'article'> & { article: ExtendedArticle };`);
  }

  if (entitiesToExtend.has('User')) {
    utilities.push(`/**
 * User context with extended entity (includes extension properties)
 */
export type ExtendedUserCtx<T extends import('@jetbrains/youtrack-enhanced-dx-tools').UserCtx> =
  Omit<T, 'user'> & { user: ExtendedUser };`);
  }

  // Check for AppGlobalStorage
  const hasGlobalStorage = extensions.entityTypeExtensions.some(ext => ext.entityType === 'AppGlobalStorage');
  const globalStorageImport = hasGlobalStorage ? ', AppGlobalStorageExtensionProperties' : '';

  return `import type { ${extendedEntityNames.join(', ')}${globalStorageImport} } from './extended-entities.js';

${utilities.join('\n\n')}

${hasGlobalStorage ? `/**
 * Extended global context with app-specific global storage extension properties
 */
export type ExtendedGlobalCtx<T extends import('@jetbrains/youtrack-enhanced-dx-tools').GlobalCtx> =
  Omit<T, 'globalStorage'> & {
    globalStorage: {
      extensionProperties: AppGlobalStorageExtensionProperties;
    };
  };` : ''}
`;
};

/**
 * Generate type augmentation file that automatically uses extended entities in global context types
 * This allows CtxGetProject, CtxPostIssue, etc. to automatically use ExtendedProject, ExtendedIssue, etc.
 */
const generateTypeAugmentation = (extensions: EntityExtensions): string => {
  const entitiesToExtend = new Set<string>();
  extensions.entityTypeExtensions.forEach(ext => {
    if (ext.entityType !== 'AppGlobalStorage') {
      entitiesToExtend.add(ext.entityType);
    }
  });

  if (entitiesToExtend.size === 0) {
    return `// No extended entities to augment - base types will be used
// Add extension properties to entity-extensions.json to enable automatic type augmentation
`;
  }

  const extendedEntityNames = Array.from(entitiesToExtend)
    .map(e => `Extended${e}`)
    .sort();

  const hasGlobalStorage = extensions.entityTypeExtensions.some(ext => ext.entityType === 'AppGlobalStorage');
  const globalStorageImport = hasGlobalStorage ? ', AppGlobalStorageExtensionProperties' : '';

  // Generate type augmentation that replaces base entity types with extended ones
  const augmentations: string[] = [];

  if (entitiesToExtend.has('Issue')) {
    augmentations.push(`  /** Available when scope is 'issue' - automatically uses ExtendedIssue if available */
  issue?: ExtendedIssue;`);
  }

  if (entitiesToExtend.has('Project')) {
    augmentations.push(`  /** Available when scope is 'project' - automatically uses ExtendedProject if available */
  project?: ExtendedProject;`);
  }

  if (entitiesToExtend.has('Article')) {
    augmentations.push(`  /** Available when scope is 'article' - automatically uses ExtendedArticle if available */
  article?: ExtendedArticle;`);
  }

  if (entitiesToExtend.has('User')) {
    augmentations.push(`  /** Available when scope is 'user' - automatically uses ExtendedUser if available */
  user?: ExtendedUser;`);
  }

  if (hasGlobalStorage) {
    augmentations.push(`  /** Global storage extension properties - automatically uses AppGlobalStorageExtensionProperties if available */
  globalStorage?: {
    extensionProperties: AppGlobalStorageExtensionProperties;
  };`);
  }

  return `/**
 * Type augmentation for global context types
 * This file automatically augments the global CtxGet, CtxPost, CtxPut, CtxDelete types
 * to use extended entities when extension properties are defined in entity-extensions.json
 *
 * Simply import this file in your backend types or ensure it's included in your tsconfig
 * and the extended entities will be automatically used in all context types.
 *
 * @example
 * // In your handler file, just use CtxGetProject as normal:
 * export default function handle(ctx: CtxGetProject<Response, Query>): void {
 *   // ctx.project.extensionProperties.myProperty is now fully typed! 🎉
 *   const value = ctx.project.extensionProperties.myProperty;
 * }
 *
 * @see https://www.jetbrains.com/help/youtrack/devportal/apps-extension-properties.html
 */

import type { ${extendedEntityNames.join(', ')}${globalStorageImport} } from './extended-entities.js';

// Import the augmentation to ensure it's loaded
import './extended-entities.js';

declare global {
  /**
   * Augment global context types to use extended entities
   * This makes CtxGet, CtxPost, CtxPut, CtxDelete automatically use ExtendedIssue, ExtendedProject, etc.
   */
  namespace GlobalContextTypes {
    interface ExtendedEntities {
${augmentations.map(a => `      ${a}`).join('\n')}
    }
  }
}

// Re-export extended entities for convenience
export type { ${extendedEntityNames.join(', ')}${globalStorageImport} } from './extended-entities.js';
`;
};

/**
 * Main plugin function
 */
export default function youtrackExtensionProperties(): Plugin {
  const extensionsPath = path.resolve(process.cwd(), 'src', 'entity-extensions.json');
  const extendedEntitiesPath = path.resolve(process.cwd(), 'src', 'api', 'extended-entities.d.ts');
  const contextUtilitiesPath = path.resolve(process.cwd(), 'src', 'api', 'extended-context.d.ts');
  const typeAugmentationPath = path.resolve(process.cwd(), 'src', 'api', 'extended-types-augmentation.d.ts');

  const generateTypes = async () => {
    if (!await fs.pathExists(extensionsPath)) {
      // No extensions file, create empty extended entities file
      await fs.ensureDir(path.dirname(extendedEntitiesPath));
      await fs.writeFile(
        extendedEntitiesPath,
        '// No extension properties defined\n// Add src/entity-extensions.json to enable extension property types\n'
      );
      console.log('✓ No entity-extensions.json found, created empty extended-entities.d.ts');
      return;
    }

    try {
      // Read and parse entity-extensions.json
      const extensionsContent = await fs.readFile(extensionsPath, 'utf8');
      const extensions: EntityExtensions = JSON.parse(extensionsContent);

      if (!extensions.entityTypeExtensions || extensions.entityTypeExtensions.length === 0) {
        // Empty extensions, create empty file
        await fs.ensureDir(path.dirname(extendedEntitiesPath));
        await fs.writeFile(
          extendedEntitiesPath,
          '// No extension properties defined\n'
        );
        console.log('✓ No extension properties defined');
        return;
      }

      // Generate extended entity types
      const extendedEntitiesContent = generateExtendedEntities(extensions);

      // Write extended entities file
      await fs.ensureDir(path.dirname(extendedEntitiesPath));
      await fs.writeFile(extendedEntitiesPath, extendedEntitiesContent);
      runEslintFix(extendedEntitiesPath);

      // Generate context utilities
      const contextUtilitiesContent = generateContextUtilities(extensions);
      await fs.writeFile(contextUtilitiesPath, contextUtilitiesContent);
      runEslintFix(contextUtilitiesPath);

      // Generate type augmentation for automatic injection
      const typeAugmentationContent = generateTypeAugmentation(extensions);
      await fs.writeFile(typeAugmentationPath, typeAugmentationContent);
      runEslintFix(typeAugmentationPath);

      console.log('✓ Generated extended entity types, context utilities, and type augmentation from entity-extensions.json');
    } catch (error) {
      console.error('[youtrack-extension-properties] Could not generate extension property types:', (error as Error).message);
      // Create fallback file
      await fs.ensureDir(path.dirname(extendedEntitiesPath));
      await fs.writeFile(
        extendedEntitiesPath,
        `// Error generating extension properties: ${(error as Error).message}\n`
      );
    }
  };

  return {
    name: 'vite-plugin-youtrack-extension-properties',

    async config(config) {
      // Add generated files to watch ignore list using chokidar function format
      return {
        server: {
          watch: {
            ignored: (filepath: string) => {
              return filepath.includes('extended-entities.d.ts') ||
                     filepath.includes('extended-context.d.ts') ||
                     filepath.includes('extended-types-augmentation.d.ts');
            }
          }
        }
      };
    },

    async buildStart() {
      const extensionsPath = path.resolve(process.cwd(), 'src', 'entity-extensions.json');
      this.addWatchFile(extensionsPath);
      await generateTypes();
    }
  };
}

