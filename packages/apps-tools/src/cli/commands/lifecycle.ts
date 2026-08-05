import {createInterface} from 'node:readline/promises';
import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {formatProjectLabel} from '../management/types.js';
import {printStructured} from './output.js';

export async function deleteApp(config: Config, appName?: string): Promise<void> {
  try {
    const confirmed = await confirmDelete(config, appName);
    if (!confirmed) {
      if (printStructured(config, {action: 'cancelled'})) {
        return;
      }
      console.log(i18n('Delete cancelled'));
      return;
    }

    const app = await createAppManagementOperations(config).deleteApp(appName);
    if (printStructured(config, {action: 'deleted', app})) {
      return;
    }
    console.log(i18n(`App "${app.name}" deleted`));
  } catch (error) {
    exit(error);
  }
}

export async function enable(config: Config, appName?: string): Promise<void> {
  await setEnabled(config, appName, true);
}

export async function disable(config: Config, appName?: string): Promise<void> {
  await setEnabled(config, appName, false);
}

async function setEnabled(config: Config, appName: string | undefined, enabled: boolean): Promise<void> {
  try {
    const result = await createAppManagementOperations(config).setEnabled(appName, enabled, config.project);
    if (printStructured(config, result)) {
      return;
    }
    if (result.project) {
      console.log(i18n(`App "${result.app.name}" ${enabled ? 'enabled' : 'disabled'} for project "${formatProjectLabel(result.project)}"`));
      return;
    }

    console.log(i18n(`App "${result.app.name}" globally ${enabled ? 'enabled' : 'disabled'}`));
  } catch (error) {
    exit(error);
  }
}

async function confirmDelete(config: Config, appName?: string): Promise<boolean> {
  if (!appName) {
    throw new Error(i18n('App name should be defined'));
  }

  if (config.yes) {
    return true;
  }

  if (!process.stdin.isTTY) {
    throw new Error(i18n('Deletion requires confirmation. Re-run with --yes to delete without prompting'));
  }

  const prompt = createInterface({input: process.stdin, output: process.stdout});
  const answer = await prompt.question(i18n(`Permanently delete app "${appName}" and everything app-related? Type "yes" to continue: `));
  prompt.close();
  return answer.trim().toLowerCase() === 'yes';
}
