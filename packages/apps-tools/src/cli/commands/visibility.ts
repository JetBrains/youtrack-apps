import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {formatProjectLabel, VisibilityResult} from '../management/types.js';
import {printStructured} from './output.js';

export async function visibility(config: Config, appName?: string): Promise<void> {
  try {
    const result = await createAppManagementOperations(config).getVisibility(appName, config.project);

    if (printStructured(config, result)) {
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
  console.log(`Groups: ${groups.length ? groups.map(group => group.name ?? group.id ?? 'unknown').join(', ') : 'none'}`);
  console.log(`Users: ${users.length ? users.map(user => user.login ?? user.name ?? user.id ?? 'unknown').join(', ') : 'none'}`);
}
