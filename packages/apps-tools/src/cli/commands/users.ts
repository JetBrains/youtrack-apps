import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {formatBoolean, printYaml, UserSummary} from '../management/types.js';
import {paginationFromConfig} from '../pagination.js';
import {printList} from './output.js';

export async function userList(config: Config, query?: string): Promise<void> {
  try {
    const pagination = paginationFromConfig(config);
    const result = await createAppManagementOperations(config).listUsers(query, pagination);

    printList({
      config,
      result,
      pagination,
      resourceName: 'users',
      emptyMessage: i18n('No users found'),
      formatItem: formatUser,
    });
  } catch (error) {
    exit(error);
  }
}

export async function userInfo(config: Config, userKey?: string): Promise<void> {
  try {
    const user = await createAppManagementOperations(config).getUserInfo(userKey, paginationFromConfig(config));

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
