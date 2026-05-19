import { describe, it, expect } from 'vitest';
import path from 'node:path';

// Resolve CommonJS module from ES context of Vitest
// eslint-disable-next-line n/no-missing-require
const { trimPathSegments } = require(path.resolve(__dirname, '../utils/sanitize.js'));

describe('trimPathSegments', () => {
  const cases = [
    { in: '', out: '' },
    { in: '/', out: '' },
    { in: '///', out: '' },
    { in: 'foo', out: 'foo' },
    { in: '/foo', out: 'foo' },
    { in: 'foo/', out: 'foo' },
    { in: '/foo/', out: 'foo' },
    { in: 'foo//bar', out: 'foo/bar' },
    { in: '/foo//bar///baz/', out: 'foo/bar/baz' },
    { in: '////foo////bar', out: 'foo/bar' },
  ];

  it('normalizes various forms of slashes', () => {
    for (const c of cases) {
      expect(trimPathSegments(c.in)).toBe(c.out);
    }
  });
});
