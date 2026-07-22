import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {GroupMembersResult, printJson, printYaml, UserGroup} from '../management/types.js';
import {paginationFromConfig} from '../pagination.js';
import {printList} from './output.js';

export async function groupList(config: Config, query?: string): Promise<void> {
  try {
    const pagination = paginationFromConfig(config);
    const result = await createAppManagementOperations(config).listGroups(query, pagination);

    printList({
      config,
      result,
      pagination,
      resourceName: 'user groups',
      emptyMessage: i18n('No user groups found'),
      formatItem: formatGroup,
    });
  } catch (error) {
    exit(error);
  }
}

export async function groupMembers(config: Config, groupKey?: string): Promise<void> {
  try {
    if (!groupKey) {
      const pagination = paginationFromConfig(config);
      const result = await createAppManagementOperations(config).listGroupMembers(pagination);
      printList({
        config,
        result,
        pagination,
        resourceName: 'user groups',
        emptyMessage: i18n('No user groups found'),
        formatItem: formatGroupMembers,
      });
      return;
    }

    const result = await createAppManagementOperations(config).getGroupMembers(groupKey, paginationFromConfig(config));

    if (config.json) {
      printJson(result);
      return;
    }

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
  return `${group.name} (${group.id})`;
}

function formatGroupMembers(result: GroupMembersResult): string[] {
  const lines = [formatGroup(result.group)];
  if (!result.members.length) {
    lines.push('  no direct members');
    return lines;
  }

  return lines.concat(result.members.map(member => `  ${member.id}`));
}
