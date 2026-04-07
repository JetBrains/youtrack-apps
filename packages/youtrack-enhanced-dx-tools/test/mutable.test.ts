import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mutable } from '../src/utility/mutable.js';

describe('mutable', () => {
  it('returns the same object reference', () => {
    const entity = { summary: 'Hello', id: '1' };
    const m = mutable(entity);
    assert.strictEqual(m, entity as unknown);
  });

  it('allows writing a string field', () => {
    const entity: { readonly summary: string } = { summary: 'Before' };
    const m = mutable(entity);
    m.summary = 'After';
    assert.strictEqual(entity.summary, 'After');
  });

  it('allows writing an arbitrary field not in the original type', () => {
    const entity = { id: 'DEMO-1' };
    const m = mutable(entity);
    m['State'] = 'In Progress';
    assert.strictEqual((entity as Record<string, unknown>)['State'], 'In Progress');
  });

  it('allows overwriting with number', () => {
    const entity: { readonly priority: number } = { priority: 1 };
    const m = mutable(entity);
    m.priority = 2;
    assert.strictEqual(entity.priority, 2);
  });

  it('allows overwriting with boolean', () => {
    const entity: { readonly resolved: boolean } = { resolved: false };
    const m = mutable(entity);
    m.resolved = true;
    assert.strictEqual(entity.resolved, true);
  });

  it('allows writing null', () => {
    const entity: { description: string | null } = { description: 'text' };
    const m = mutable(entity);
    m.description = null;
    assert.strictEqual(entity.description, null);
  });

  it('does not affect unrelated fields', () => {
    const entity = { summary: 'Hello', description: 'World' };
    const m = mutable(entity);
    m.summary = 'Updated';
    assert.strictEqual(entity.description, 'World');
  });
});