import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { addSecurityHeaders, isValidHeaderName } from '../workflow-security.js';

const settings = JSON.parse(readFileSync(new URL('../../settings.json', import.meta.url), 'utf8'));

// JT-100132: a CR or LF in the header name would add header lines to the request.

describe('isValidHeaderName', () => {
  it.each(['X-YouTrack-Token', 'Authorization', "x!#$%&'*+-.^_`|~9"])('accepts %s', (name) => {
    expect(isValidHeaderName(name)).toBe(true);
  });

  it.each([
    ['CR LF and a second header', 'X-A\r\nX-Injected: 1'],
    ['a trailing line break', 'X-A\r\n'],
    ['a bare LF', 'X-A\nX: 1'],
    ['a space', 'X A'],
    ['a colon', 'X-A:'],
    ['a leading space', ' X-A'],
    ['NUL', 'X\u0000A'],
    ['an empty string', ''],
    ['null', null],
    ['a number', 42],
  ])('rejects %s', (_label, name) => {
    expect(isValidHeaderName(name)).toBe(false);
  });
});

describe('addSecurityHeaders', () => {
  it('adds the token header for a valid name', () => {
    const connection = { addHeader: vi.fn() };
    vi.spyOn(console, 'log').mockImplementation(() => {});

    addSecurityHeaders(connection, 'token', 'X-YouTrack-Token');

    expect(connection.addHeader).toHaveBeenCalledWith('X-YouTrack-Token', 'token');
  });

  it('throws instead of adding a header with an invalid name', () => {
    const connection = { addHeader: vi.fn() };

    expect(() => addSecurityHeaders(connection, 'token', 'X-A\r\nX-Injected: 1')).toThrow(
      'not a valid HTTP header name',
    );
    expect(connection.addHeader).not.toHaveBeenCalled();
  });
});

describe('headerName pattern in settings.json', () => {
  // The backend validates settings with this pattern on save; the runtime check covers names stored earlier.
  // They are written separately, so this keeps them from drifting.
  const pattern = new RegExp(settings.properties.headerName.pattern);

  it.each([
    'X-YouTrack-Token',
    'Authorization',
    "x!#$%&'*+-.^_`|~9",
    'X-A\r\nX-Injected: 1',
    'X-A\r\n',
    'X-A\n',
    'X A',
    'X-A:',
    ' X-A',
    'X-A ',
    'X\u0000A',
    '',
    'X-\u00fc',
  ])('agrees with isValidHeaderName for %j', (name) => {
    expect(pattern.test(name)).toBe(isValidHeaderName(name));
  });
});
