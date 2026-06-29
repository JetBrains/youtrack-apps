import {Config} from '../../@types/types.js';
import {i18n} from '../../lib/i18n/i18n.js';

export const DEFAULT_PAGE_SIZE = 50;

export interface PaginationOptions {
  limit?: number;
  skip?: number;
}

export interface PaginationMetadata {
  skip: number;
  limit: number;
  returned: number;
  nextSkip: number | null;
  hasMore: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMetadata;
}

export interface PaginationPlan {
  limit: number;
  skip: number;
}

export function paginationFromConfig(config: Config): PaginationOptions {
  return {
    limit: parsePositiveOption(config.limit, 'limit'),
    skip: parseNonNegativeOption(config.skip, 'skip'),
  };
}

export function createPaginationPlan(options: PaginationOptions = {}): PaginationPlan {
  return {
    limit: options.limit ?? DEFAULT_PAGE_SIZE,
    skip: options.skip ?? 0,
  };
}

export function emptyPage<T>(options: PaginationOptions = {}): PaginatedResult<T> {
  const plan = createPaginationPlan(options);
  return {
    items: [],
    pagination: {
      skip: plan.skip,
      limit: plan.limit,
      returned: 0,
      nextSkip: null,
      hasMore: false,
    },
  };
}

export function printPaginationNotice(resourceName: string, result: PaginatedResult<unknown>, options: PaginationOptions = {}): void {
  if (!result.pagination.hasMore) {
    return;
  }

  const nextSkip = result.pagination.nextSkip ?? 0;
  const limit = result.pagination.limit ?? createPaginationPlan(options).limit;
  console.log(i18n(`Showing ${result.pagination.returned} ${resourceName}. Use --skip ${nextSkip} --limit ${limit} for more.`));
}

function parsePositiveOption(value: string | null, name: string): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(i18n(`Option "--${name}" should be a positive number`));
  }

  return parsed;
}

function parseNonNegativeOption(value: string | null, name: string): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(i18n(`Option "--${name}" should be a non-negative number`));
  }

  return parsed;
}
