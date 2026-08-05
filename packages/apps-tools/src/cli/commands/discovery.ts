import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {
  AppCatalogResult,
  AppModuleReference,
  formatBoolean,
} from '../management/types.js';
import {paginationFromConfig} from '../pagination.js';
import {printList, printStructured} from './output.js';

export async function list(config: Config): Promise<void> {
  try {
    const pagination = paginationFromConfig(config);
    const result = await createAppManagementOperations(config).list(pagination);

    printList({
      config,
      result,
      pagination,
      resourceName: 'apps',
      emptyMessage: i18n('No apps found'),
      formatItem: app => app.name,
    });
  } catch (error) {
    exit(error);
  }
}

export async function info(config: Config, appName?: string): Promise<void> {
  try {
    const details = await createAppManagementOperations(config).getCatalog(appName);

    if (printStructured(config, details)) {
      return;
    }

    printCatalog(details);
  } catch (error) {
    exit(error);
  }
}

function printCatalog(result: AppCatalogResult): void {
  const app = result.app;
  console.log(`Name: ${app.name}`);
  console.log(`ID: ${app.id}`);
  console.log(`Title: ${app.title ?? 'unknown'}`);
  console.log(`Version: ${app.version ?? 'unknown'}`);
  console.log(`Global enabled: ${formatBoolean(app.globalConfig?.enabled ?? app.enabled)}`);
  console.log(`Missing global settings: ${formatBoolean(app.globalConfig?.missingRequiredSettings)}`);
  console.log(`Attachable: ${formatBoolean(app.canBeAttached)}`);
  console.log(`Marketplace: ${app.marketplaceId ?? (app.fromMarketplace ? 'yes' : 'no')}`);
  if (app.hasBrokenUsages !== undefined) {
    console.log(`Has broken usages: ${formatBoolean(app.hasBrokenUsages)}`);
  }

  if (app.vendor) {
    console.log(`Vendor: ${[app.vendor.name, app.vendor.email, app.vendor.url].filter(Boolean).join(', ') || 'unknown'}`);
  }

  console.log(`Tags: ${formatList((app.tags ?? []).map(tag => tag.name ?? 'unknown'))}`);
  printFiles(result);
  printModules(result);
}

function printFiles(result: AppCatalogResult): void {
  const appFiles = result.files.filter(file => file.type !== 'script');
  console.log('Files:');
  if (!appFiles.length) {
    console.log('  none');
    return;
  }

  for (const file of appFiles) {
    console.log(`  ${file.key} - ${file.label}`);
  }
}

function printModules(result: AppCatalogResult): void {
  console.log(`Modules: ${result.modules.length}`);
  for (const [type, modules] of groupModulesByType(result.modules)) {
    printModuleGroup(type, modules);
  }
}

function printModuleGroup(label: string, modules: AppModuleReference[]): void {
  if (!modules.length) {
    return;
  }

  console.log(`${label}:`);
  for (const module of modules) {
    console.log(`  ${formatModule(module)}`);
  }
}

function groupModulesByType(modules: AppModuleReference[]): [string, AppModuleReference[]][] {
  const groups = new Map<string, AppModuleReference[]>();
  for (const module of modules) {
    const type = module.type ?? 'unknown';
    groups.set(type, [...(groups.get(type) ?? []), module]);
  }

  return [...groups.entries()];
}

function formatModule(module: AppModuleReference): string {
  if (module.type === 'Widget') {
    return `${module.name}${module.description ? ` - ${module.description}` : ''}`;
  }

  const type = module.type?.toLowerCase() ?? '';
  if (type.includes('http')) {
    const details = [module.scriptId ? `script id: ${module.scriptId}` : undefined].filter(Boolean).join(', ');
    return details ? `${module.name} (${details})` : module.name;
  }

  if (isRuleType(type)) {
    const details = [
      module.file ? `file: ${module.file}` : undefined,
      module.scriptId ? `script id: ${module.scriptId}` : undefined,
    ].filter(Boolean).join(', ');
    return details ? `${module.name} (${details})` : module.name;
  }

  const details = [
    module.file ? `file: ${module.file}` : undefined,
    module.scriptId ? `script id: ${module.scriptId}` : undefined,
  ].filter(Boolean).join(', ');
  const suffix = details ? ` (${details})` : '';
  const description = module.description ? ` - ${module.description}` : '';
  return `${module.name}${description}${suffix}`;
}

function isRuleType(type: string): boolean {
  return ['action', 'on-schedule', 'state-machine', 'custom-script'].includes(type) || type.includes('rule');
}

function formatList(values: string[]): string {
  return values.length ? values.join(', ') : 'none';
}
