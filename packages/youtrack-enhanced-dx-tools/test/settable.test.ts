import { describe, it } from 'node:test';
import assert from 'node:assert';
import { settable } from '../src/utility/settable.js';

describe('settable', () => {
  it('$set assigns a known field value', () => {
    const entity: { readonly summary: string } = { summary: 'Before' };
    const s = settable(entity);
    s.$set('summary', 'After');
    assert.strictEqual(entity.summary, 'After');
  });

  it('$set assigns an extension field value', () => {
    const entity: { readonly id: string; readonly [key: string]: unknown } = { id: 'DEMO-1' };
    const s = settable(entity);
    s.$set('State', 'In Progress');
    assert.strictEqual((entity as Record<string, unknown>)['State'], 'In Progress');
  });

  it('$set is non-enumerable', () => {
    const entity = { summary: 'Hello' };
    const s = settable(entity);
    assert.ok(!Object.keys(s).includes('$set'));
    assert.ok(!Object.keys(entity).includes('$set'));
  });

  it('returns the same object reference', () => {
    const entity = { summary: 'Hello' };
    const s = settable(entity);
    assert.strictEqual(s, entity as unknown);
  });

  it('calling settable() twice does not throw', () => {
    const entity = { summary: 'Hello' };
    settable(entity);
    assert.doesNotThrow(() => settable(entity));
  });

  it('allows setting null', () => {
    const entity: { description: string | null } = { description: 'text' };
    const s = settable(entity);
    s.$set('description', null);
    assert.strictEqual(entity.description, null);
  });

  it('does not affect unrelated fields', () => {
    const entity = { summary: 'Hello', description: 'World' };
    const s = settable(entity);
    s.$set('summary', 'Updated');
    assert.strictEqual(entity.description, 'World');
  });
});
