import {Config} from '../../../@types/types.js';
import {printJson, printYaml} from '../management/types.js';
import {PaginatedResult, PaginationOptions, printPaginationNotice} from '../pagination.js';

type ListLine = string | string[];

export function printStructured(config: Config, data: unknown): boolean {
  if (config.json) {
    printJson(data);
    return true;
  }

  if (config.yaml) {
    printYaml(data);
    return true;
  }

  return false;
}

export function printList<T>(options: {
  config: Config;
  result: PaginatedResult<T>;
  pagination: PaginationOptions;
  resourceName: string;
  emptyMessage?: string;
  formatItem: (item: T) => ListLine;
}): void {
  const {config, result, pagination, resourceName, emptyMessage, formatItem} = options;

  if (printStructured(config, result)) {
    return;
  }

  if (!result.items.length) {
    if (emptyMessage) {
      console.log(emptyMessage);
    }
    return;
  }

  for (const item of result.items) {
    const lines = formatItem(item);
    for (const line of Array.isArray(lines) ? lines : [lines]) {
      console.log(line);
    }
  }
  printPaginationNotice(resourceName, result, pagination);
}
