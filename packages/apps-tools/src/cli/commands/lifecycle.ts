import {createInterface} from 'node:readline/promises';
import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
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
      console.log('Delete cancelled');
      return;
    }

    const app = await createAppManagementOperations(config).deleteApp(appName);
    if (printStructured(config, {action: 'deleted', app})) {
      return;
    }
    console.log(`App "${app.name}" deleted`);
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
      console.log(`App "${result.app.name}" ${enabled ? 'enabled' : 'disabled'} for project "${formatProjectLabel(result.project)}"`);
      return;
    }

    console.log(`App "${result.app.name}" globally ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    exit(error);
  }
}

async function confirmDelete(config: Config, appName?: string): Promise<boolean> {
  if (!appName) {
    throw new Error('App name should be defined');
  }

  if (config.confirmDestructiveAction) {
    return true;
  }

  if (!process.stdin.isTTY) {
    throw new Error('Deletion requires confirmation. Re-run with --yes to delete without prompting');
  }

  const prompt = createInterface({input: process.stdin, output: process.stdout});
  const answer = await prompt.question(`Permanently delete app "${appName}" and everything app-related? Type "yes" to continue: `);
  prompt.close();
  return answer.trim().toLowerCase() === 'yes';
}
