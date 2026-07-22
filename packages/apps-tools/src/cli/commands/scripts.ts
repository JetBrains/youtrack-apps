import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {printJson} from '../management/types.js';

export async function scripts(config: Config, args?: string): Promise<void> {
  try {
    const [appName, fileKey] = splitScriptArgs(args);
    const result = await createAppManagementOperations(config).getFile(appName, fileKey);

    if (config.json) {
      printJson(result);
      return;
    }

    console.log(result.content);
  } catch (error) {
    exit(error);
  }
}

function splitScriptArgs(args: string | undefined): [string | undefined, string | undefined] {
  const parts = (args ?? '').split(/\s+/).filter(Boolean);
  return [parts[0], parts[1]];
}
