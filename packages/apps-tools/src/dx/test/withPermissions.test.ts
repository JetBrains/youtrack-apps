import { describe, it } from 'node:test';
import assert from 'node:assert';
import { withPermissions } from '../utility/withPermissions.js';

describe('withPermissions', () => {
  it('attaches permissions to handler function', () => {
    const handler = () => {};
    const wrapped = withPermissions(handler, ['read-issue', 'update-issue']);

    assert.strictEqual((wrapped as { permissions?: string[] }).permissions?.length, 2);
    assert.deepStrictEqual((wrapped as { permissions?: string[] }).permissions, [
      'read-issue',
      'update-issue'
    ]);
  });

  it('returns callable function', () => {
    let called = false;
    const handler = () => {
      called = true;
    };
    const wrapped = withPermissions(handler, ['read-issue']);

    wrapped();
    assert.strictEqual(called, true);
  });

  it('preserves function identity for type inference', () => {
    const handler = (x: number) => x + 1;
    const wrapped = withPermissions(handler, ['read-issue']);

    assert.strictEqual(wrapped(41), 42);
  });

  it('handles empty permissions array', () => {
    const handler = () => {};
    const wrapped = withPermissions(handler, []);

    assert.deepStrictEqual((wrapped as { permissions?: string[] }).permissions, []);
  });
});
