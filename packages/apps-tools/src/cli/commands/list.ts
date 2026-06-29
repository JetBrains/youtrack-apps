import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {paginationFromConfig, printPaginationNotice} from '../pagination.js';
import {printJson} from '../management/types.js';
import {YouTrackAppsClient} from '../youtrack/youtrack-apps-client.js';

export async function list(config: Config): Promise<void> {
  try {
    const pagination = paginationFromConfig(config);
    const result = await new YouTrackAppsClient(config).listApps(['id', 'name'], pagination);
    if (config.json) {
      printJson(result);
      return;
    }

    result.items.forEach(x => {
      print(x.name);
    });
    printPaginationNotice('apps', result, pagination);
  } catch (error) {
    exit(error);
  }

  function print(name: string) {
    console.log(name);
  }
}
