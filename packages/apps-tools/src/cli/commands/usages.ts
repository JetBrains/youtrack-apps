import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {AppUsageDiagnostics, formatBoolean, formatProjectLabel} from '../management/types.js';
import {paginationFromConfig} from '../pagination.js';
import {printList} from './output.js';

export async function usages(config: Config, appName?: string): Promise<void> {
  try {
    const pagination = paginationFromConfig(config);
    const result = await createAppManagementOperations(config).listUsages(appName, pagination);

    printList({
      config,
      result,
      pagination,
      resourceName: 'app usages',
      emptyMessage: 'No app usages found',
      formatItem: formatUsage,
    });
  } catch (error) {
    exit(error);
  }
}

function formatUsage(usage: AppUsageDiagnostics): string[] {
  const project = usage.project ? formatProjectLabel(usage.project) : 'unknown';
  const lines = [[
    `${project} (${usage.id})`,
    `enabled: ${formatBoolean(usage.enabled)}`,
    `active: ${formatBoolean(usage.isActive)}`,
    `broken: ${formatBoolean(usage.isBroken)}`,
    `missing settings: ${formatBoolean(usage.missingRequiredSettings)}`,
    `problems: ${usage.problems.length}`,
  ].join(', ')];

  for (const problem of usage.problems) {
    const key = problem.problemKey ? `${problem.problemKey}: ` : '';
    const object = problem.pluggableObjectName ?? problem.pluggableObjectTitle ?? problem.pluggableObjectId ?? 'unknown object';
    lines.push(`  ${object}: ${key}${problem.message ?? 'Unknown error'}`);
  }

  return lines;
}
