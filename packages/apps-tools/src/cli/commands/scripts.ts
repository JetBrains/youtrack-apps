import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {printStructured} from './output.js';

export type ScriptsArgs = {
  app?: string;
  fileKey?: string;
};

export async function scripts(config: Config, args?: ScriptsArgs): Promise<void> {
  try {
    const result = await createAppManagementOperations(config).getFile(args?.app, args?.fileKey);

    if (printStructured(config, {file: result.file, content: result.content})) {
      return;
    }

    console.log(result.content);
  } catch (error) {
    exit(error);
  }
}
