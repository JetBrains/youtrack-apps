import { describe, it } from 'node:test';
import assert from 'node:assert';
import { set } from '../src/utility/set.js';

describe('set', () => {
  it('assigns a known string field', () => {
    const entity: { readonly summary: string } = { summary: 'Before' };
    set(entity, 'summary', 'After');
    assert.strictEqual(entity.summary, 'After');
  });

  it('assigns a known number field with the correct type', () => {
    const entity: { readonly priority: number } = { priority: 1 };
    set(entity, 'priority', 42);
    assert.strictEqual(entity.priority, 42);
  });

  it('assigns a known boolean field', () => {
    const entity: { readonly resolved: boolean } = { resolved: false };
    set(entity, 'resolved', true);
    assert.strictEqual(entity.resolved, true);
  });

  it('assigns an arbitrary extension field', () => {
    const entity: { readonly id: string; readonly [key: string]: unknown } = { id: 'DEMO-1' };
    set(entity, 'State', 'In Progress');
    assert.strictEqual((entity as Record<string, unknown>)['State'], 'In Progress');
  });

  it('assigns null to a nullable field', () => {
    const entity: { description: string | null } = { description: 'text' };
    set(entity, 'description', null);
    assert.strictEqual(entity.description, null);
  });

  it('does not affect unrelated fields', () => {
    const entity = { summary: 'Hello', description: 'World' };
    set(entity, 'summary', 'Updated');
    assert.strictEqual(entity.description, 'World');
  });

  it('mutates the original object (same reference)', () => {
    const entity = { summary: 'Hello' };
    set(entity, 'summary', 'Updated');
    assert.strictEqual(entity.summary, 'Updated');
  });
});
