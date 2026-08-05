const assert = require('node:assert/strict');
const {describe, it} = require('node:test');
const {trimPathSegments} = require('../utils/sanitize.js');

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
      assert.equal(trimPathSegments(c.in), c.out);
    }
  });
});
