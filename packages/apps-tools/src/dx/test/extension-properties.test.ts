import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getTypeScriptType,
  generateExtensionPropertiesType,
  generateExtendedEntities,
} from '../plugins/vite-plugin-youtrack-extension-properties.js';

describe('getTypeScriptType', () => {
  const entityTypes = new Set(['Issue', 'Project', 'User']);

  it('maps primitive types correctly', () => {
    assert.strictEqual(getTypeScriptType({ type: 'string' }, entityTypes), 'string');
    assert.strictEqual(getTypeScriptType({ type: 'integer' }, entityTypes), 'number');
    assert.strictEqual(getTypeScriptType({ type: 'float' }, entityTypes), 'number');
    assert.strictEqual(getTypeScriptType({ type: 'boolean' }, entityTypes), 'boolean');
  });

  it('maps known entity types to themselves', () => {
    assert.strictEqual(getTypeScriptType({ type: 'Issue' }, entityTypes), 'Issue');
    assert.strictEqual(getTypeScriptType({ type: 'Project' }, entityTypes), 'Project');
  });

  it('maps unknown types to unknown', () => {
    assert.strictEqual(getTypeScriptType({ type: 'SomeCustomThing' }, entityTypes), 'unknown');
  });

  it('wraps multi properties in Set<>', () => {
    assert.strictEqual(getTypeScriptType({ type: 'string', multi: true }, entityTypes), 'Set<string>');
    assert.strictEqual(getTypeScriptType({ type: 'Issue', multi: true }, entityTypes), 'Set<Issue>');
  });
});

describe('generateExtensionPropertiesType', () => {
  const entityTypes = new Set(['Issue', 'Project']);

  it('generates properties without readonly', () => {
    const result = generateExtensionPropertiesType(
      { myProp: { type: 'string' }, count: { type: 'integer' } },
      entityTypes,
    );
    assert.ok(result.includes('myProp?: string;'), `Expected myProp, got:\n${result}`);
    assert.ok(result.includes('count?: number;'), `Expected count, got:\n${result}`);
    assert.ok(!result.includes('readonly'), `Should NOT contain readonly, got:\n${result}`);
  });

  it('handles multi properties', () => {
    const result = generateExtensionPropertiesType(
      { tags: { type: 'string', multi: true } },
      entityTypes,
    );
    assert.ok(result.includes('tags?: Set<string>;'), `Expected Set<string>, got:\n${result}`);
    assert.ok(!result.includes('readonly'), `Should NOT contain readonly, got:\n${result}`);
  });

  it('handles entity type references', () => {
    const result = generateExtensionPropertiesType(
      { relatedIssue: { type: 'Issue' } },
      entityTypes,
    );
    assert.ok(result.includes('relatedIssue?: Issue;'), `Expected Issue type, got:\n${result}`);
  });

  it('returns empty block for no properties', () => {
    const result = generateExtensionPropertiesType({}, entityTypes);
    assert.strictEqual(result.trim(), '{\n\n}');
  });
});

describe('generateExtendedEntities', () => {
  it('generates ExtendedIssue without readonly properties', () => {
    const output = generateExtendedEntities({
      entityTypeExtensions: [
        {
          entityType: 'Issue',
          properties: {
            priority: { type: 'integer' },
            label: { type: 'string' },
          },
        },
      ],
    });

    assert.ok(output.includes('export interface ExtendedIssue extends Issue'), `Missing ExtendedIssue, got:\n${output}`);
    assert.ok(output.includes('priority?: number;'), `Missing priority, got:\n${output}`);
    assert.ok(output.includes('label?: string;'), `Missing label, got:\n${output}`);
    assert.ok(!output.includes('readonly'), `Should NOT contain readonly, got:\n${output}`);
  });

  it('generates AppGlobalStorageExtensionProperties without readonly', () => {
    const output = generateExtendedEntities({
      entityTypeExtensions: [
        {
          entityType: 'AppGlobalStorage',
          properties: {
            configKey: { type: 'string' },
          },
        },
      ],
    });

    assert.ok(
      output.includes('export interface AppGlobalStorageExtensionProperties'),
      `Missing AppGlobalStorageExtensionProperties, got:\n${output}`,
    );
    assert.ok(output.includes('configKey?: string;'), `Missing configKey, got:\n${output}`);
    assert.ok(!output.includes('readonly'), `Should NOT contain readonly, got:\n${output}`);
  });

  it('generates ExtendedProperties map', () => {
    const output = generateExtendedEntities({
      entityTypeExtensions: [
        {
          entityType: 'Issue',
          properties: { flag: { type: 'boolean' } },
        },
        {
          entityType: 'Project',
          properties: { code: { type: 'string' } },
        },
      ],
    });

    assert.ok(output.includes('export type ExtendedProperties'), `Missing ExtendedProperties, got:\n${output}`);
    assert.ok(output.includes('Issue: ExtendedIssue;'), `Missing Issue mapping, got:\n${output}`);
    assert.ok(output.includes('Project: ExtendedProject;'), `Missing Project mapping, got:\n${output}`);
    assert.ok(output.includes('Article: never;'), `Article should be never, got:\n${output}`);
    assert.ok(output.includes('User: never;'), `User should be never, got:\n${output}`);
  });

  it('imports entity types referenced in properties', () => {
    const output = generateExtendedEntities({
      entityTypeExtensions: [
        {
          entityType: 'Issue',
          properties: { assignee: { type: 'User' } },
        },
      ],
    });

    assert.ok(output.includes("import type { Issue, User }"), `Missing imports, got:\n${output}`);
    assert.ok(output.includes('assignee?: User;'), `Missing User property, got:\n${output}`);
  });
});
