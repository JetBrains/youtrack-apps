import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {CustomFieldValue} from '../management/types.js';
import {paginationFromConfig} from '../pagination.js';
import {printList} from './output.js';

export async function fieldValues(config: Config, query?: string): Promise<void> {
  try {
    const pagination = paginationFromConfig(config);
    const result = await createAppManagementOperations(config).searchFieldValues(query, config.project, config.field, pagination);

    printList({
      config,
      result,
      pagination,
      resourceName: 'field values',
      emptyMessage: 'No field values found',
      formatItem: formatFieldValue,
    });
  } catch (error) {
    exit(error);
  }
}

function formatFieldValue(value: CustomFieldValue): string {
  const label = value.presentation ?? value.localizedName ?? value.name ?? value.fullName ?? value.login ?? value.id ?? 'unknown';
  return value.id && value.id !== label ? `${label} (${value.id})` : label;
}
