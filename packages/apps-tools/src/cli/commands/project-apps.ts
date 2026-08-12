import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {AppConfiguration, formatBoolean} from '../management/types.js';
import {paginationFromConfig} from '../pagination.js';
import {printList} from './output.js';

export async function projectApps(config: Config, projectKey?: string): Promise<void> {
  try {
    const pagination = paginationFromConfig(config);
    const result = await createAppManagementOperations(config).listProjectApps(projectKey, pagination);

    printList({
      config,
      result,
      pagination,
      resourceName: 'project apps',
      emptyMessage: 'No project apps found',
      formatItem: formatProjectApp,
    });
  } catch (error) {
    exit(error);
  }
}

function formatProjectApp(config: AppConfiguration): string {
  const app = config.app;
  const label = app?.title && app.title !== app.name ? `${app.title} (${app.name ?? app.id})` : app?.name ?? app?.id ?? 'unknown';
  return [
    `${label} (${config.id})`,
    `enabled: ${formatBoolean(config.enabled)}`,
    `active: ${formatBoolean(config.isActive)}`,
    `missing settings: ${formatBoolean(config.missingRequiredSettings)}`,
  ].join(', ');
}
