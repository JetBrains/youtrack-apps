import { describe, it } from 'node:test';
import assert from 'node:assert';
import { writable } from '../src/utility/writable.js';

describe('writable', () => {
  it('.value returns the current field value', () => {
    const entity = { summary: 'Hello' };
    const w = writable(entity);
    assert.strictEqual(w.summary.value, 'Hello');
  });

  it('.setValue() assigns the value to the underlying entity', () => {
    const entity: { readonly summary: string } = { summary: 'Before' };
    const w = writable(entity);
    w.summary.setValue('After');
    assert.strictEqual(entity.summary, 'After');
  });

  it('mutates the original entity (not a copy)', () => {
    const entity = { summary: 'Hello' };
    const w = writable(entity);
    w.summary.setValue('Updated');
    assert.strictEqual(entity.summary, 'Updated');
  });

  it('works for arbitrary extension property names', () => {
    const entity: { readonly [key: string]: unknown } = {};
    const w = writable(entity);
    w['State'].setValue('In Progress');
    assert.strictEqual((entity as Record<string, unknown>)['State'], 'In Progress');
  });

  it('allows setting null', () => {
    const entity: { description: string | null } = { description: 'text' };
    const w = writable(entity);
    w.description.setValue(null);
    assert.strictEqual(entity.description, null);
  });

  it('.value reflects the updated value after .setValue()', () => {
    const entity = { summary: 'Before' };
    const w = writable(entity);
    w.summary.setValue('After');
    assert.strictEqual(w.summary.value, 'After');
  });

  it('different property accesses are independent', () => {
    const entity = { summary: 'Hello', description: 'World' };
    const w = writable(entity);
    w.summary.setValue('Updated');
    assert.strictEqual(w.description.value, 'World');
  });
});
