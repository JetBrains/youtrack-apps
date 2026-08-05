import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {formatProjectLabel} from '../management/types.js';
import {printStructured} from './output.js';

export async function attach(config: Config, appName?: string): Promise<void> {
  await setProjectScope(config, appName, 'attach');
}

export async function detach(config: Config, appName?: string): Promise<void> {
  await setProjectScope(config, appName, 'detach');
}

async function setProjectScope(config: Config, appName: string | undefined, action: 'attach' | 'detach'): Promise<void> {
  try {
    const result = await createAppManagementOperations(config).setProjectScope(appName, config.project, action);
    if (printStructured(config, {...result, action})) {
      return;
    }
    console.log(i18n(`App "${result.app.name}" ${action === 'attach' ? 'attached to' : 'detached from'} project "${formatProjectLabel(result.project)}"`));
  } catch (error) {
    exit(error);
  }
}
