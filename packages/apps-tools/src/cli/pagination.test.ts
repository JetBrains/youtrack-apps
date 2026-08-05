import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {Config} from '../../@types/types.js';
import {createPaginationPlan, paginationFromConfig, printPaginationNotice} from './pagination.js';

describe('pagination', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses skip and limit for the pagination plan', () => {
    expect(createPaginationPlan({skip: 100, limit: 25})).toEqual({
      limit: 25,
      skip: 100,
    });
  });

  it('defaults to the first 50 results', () => {
    expect(createPaginationPlan()).toEqual({
      limit: 50,
      skip: 0,
    });
  });

  it('maps config skip and limit to pagination options', () => {
    expect(paginationFromConfig(config({skip: '100', limit: '25'}))).toEqual({
      limit: 25,
      skip: 100,
    });
  });

  it('prints skip notice for the next page', () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});

    printPaginationNotice('apps', {
      items: [],
      pagination: {
        skip: 0,
        limit: 50,
        returned: 50,
        nextSkip: 50,
        hasMore: true,
      },
    });

    expect(console.log).toHaveBeenCalledWith('Showing 50 apps. Use --skip 50 --limit 50 for more.');
  });
});

function config(overrides: Partial<Config> = {}): Config {
  return {
    host: 'https://youtrack.example.com',
    token: 'token',
    output: null,
    overwrite: null,
    manifest: null,
    schema: null,
    open: null,
    json: false,
    yaml: false,
    yes: false,
    project: null,
    skip: null,
    limit: null,
    settings: null,
    enabled: null,
    cwd: process.cwd(),
    ...overrides,
  };
}
