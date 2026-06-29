import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {formatBoolean, printJson, printYaml, UserSummary} from '../management/types.js';
import {paginationFromConfig, printPaginationNotice} from '../pagination.js';

export async function userList(config: Config): Promise<void> {
  try {
    const pagination = paginationFromConfig(config);
    const result = await createAppManagementOperations(config).listUsers(pagination);

    if (config.json) {
      printJson(result);
      return;
    }

    if (config.yaml) {
      printYaml(result);
      return;
    }

    if (!result.items.length) {
      console.log(i18n('No users found'));
      return;
    }

    for (const user of result.items) {
      console.log(formatUser(user));
    }
    printPaginationNotice('users', result, pagination);
  } catch (error) {
    exit(error);
  }
}

export async function userInfo(config: Config, userKey?: string): Promise<void> {
  try {
    const user = await createAppManagementOperations(config).getUserInfo(userKey);

    if (config.yaml) {
      printYaml(user);
      return;
    }

    console.log(`Email: ${user.email ?? 'unknown'}`);
    console.log(`Guest: ${formatBoolean(user.guest)}`);
    console.log(`User type: ${user.userType?.id ?? 'unknown'}`);
  } catch (error) {
    exit(error);
  }
}

function formatUser(user: UserSummary): string {
  const login = user.login ?? user.name ?? user.fullName ?? 'unknown';
  const displayName = user.fullName ?? user.name ?? 'unknown';
  return `${login} (${user.id}) - ${displayName}`;
}
