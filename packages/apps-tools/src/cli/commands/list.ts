import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {paginationFromConfig} from '../pagination.js';
import {YouTrackAppsClient} from '../youtrack/youtrack-apps-client.js';
import {printList} from './output.js';

export async function list(config: Config): Promise<void> {
  try {
    const pagination = paginationFromConfig(config);
    const result = await new YouTrackAppsClient(config).listApps(['id', 'name'], pagination);

    printList({
      config,
      result,
      pagination,
      resourceName: 'apps',
      formatItem: app => app.name,
    });
  } catch (error) {
    exit(error);
  }
}
