import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {printJson, printYaml, UserGroup} from '../management/types.js';
import {paginationFromConfig, printPaginationNotice} from '../pagination.js';

export async function groupList(config: Config): Promise<void> {
  try {
    const pagination = paginationFromConfig(config);
    const result = await createAppManagementOperations(config).listGroups(pagination);

    if (config.json) {
      printJson(result);
      return;
    }

    if (config.yaml) {
      printYaml(result);
      return;
    }

    if (!result.items.length) {
      console.log(i18n('No user groups found'));
      return;
    }

    for (const group of result.items) {
      console.log(formatGroup(group));
    }
    printPaginationNotice('user groups', result, pagination);
  } catch (error) {
    exit(error);
  }
}

export async function groupMembers(config: Config, groupKey?: string): Promise<void> {
  try {
    const result = await createAppManagementOperations(config).getGroupMembers(groupKey);

    if (config.yaml) {
      printYaml(result);
      return;
    }

    if (!result.members.length) {
      console.log(i18n(`No members found for user group "${result.group.name}"`));
      return;
    }

    for (const member of result.members) {
      console.log(member.id);
    }
  } catch (error) {
    exit(error);
  }
}

function formatGroup(group: UserGroup): string {
  const users = group.userCount === undefined ? 'unknown' : group.userCount.toString();
  return `${group.name} (${group.id}), users: ${users}`;
}
