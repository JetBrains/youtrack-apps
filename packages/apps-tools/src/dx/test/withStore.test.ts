import { describe, it } from 'node:test';
import assert from 'node:assert';
import { withStore } from '../utility/withStore.js';

describe('withStore', () => {
  it('returns the handler unchanged at runtime (identity curry)', () => {
    const handler = { endpoints: [], asyncFunctions: { onDone: () => {} } };
    const result = withStore<{ a: string }>()(handler as never);
    assert.strictEqual(result, handler);
  });

  it('first call returns a callable (no extra side effects)', () => {
    const bind = withStore<{ a: string }>();
    assert.strictEqual(typeof bind, 'function');
  });

  it('accepts AI tool via 3-generic overload (TArgs, TResult, S)', () => {
    const tool = {
      name: 't',
      description: 'd',
      execute: () => 'ok',
      asyncFunctions: { onResult: () => {} }
    };
    const result = withStore<{ q: string }, string, { last: string }>()(tool as never);
    assert.strictEqual(result, tool);
  });

  it('first call of 3-generic AI overload returns a callable', () => {
    const bind = withStore<{ q: string }, string, { last: string }>();
    assert.strictEqual(typeof bind, 'function');
  });

  it('accepts HTTP handler shape', () => {
    const handler = {
      endpoints: [
        {
          scope: 'global',
          method: 'POST',
          path: '/tick',
          handle: () => {}
        }
      ],
      asyncFunctions: { onTick: () => {} }
    };
    const result = withStore<{ count: number }>()(handler as never);
    assert.strictEqual(result, handler);
  });
});