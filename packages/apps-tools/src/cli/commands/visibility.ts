import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {formatProjectLabel, printJson, printYaml, VisibilityResult} from '../management/types.js';

export async function visibility(config: Config, appName?: string): Promise<void> {
  try {
    const result = await createAppManagementOperations(config).getVisibility(appName, config.project);

    if (config.json) {
      printJson(result);
      return;
    }

    if (config.yaml) {
      printYaml(result);
      return;
    }

    printVisibility(result);
  } catch (error) {
    exit(error);
  }
}

function printVisibility(result: VisibilityResult): void {
  console.log(`App: ${result.app.title ?? result.app.name}`);
  if (result.project) {
    console.log(`Project: ${formatProjectLabel(result.project)}`);
  } else {
    console.log('Scope: global');
  }

  const users = result.visibilitySettings?.permittedUsers ?? [];
  const groups = result.visibilitySettings?.permittedGroups ?? [];
  console.log(`Groups: ${groups.length ? groups.map(group => group.name ?? group.id ?? 'unknown').join(', ') : i18n('none')}`);
  console.log(`Users: ${users.length ? users.map(user => user.login ?? user.name ?? user.id ?? 'unknown').join(', ') : i18n('none')}`);
}
