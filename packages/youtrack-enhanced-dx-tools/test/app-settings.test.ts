import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  safeKey,
  jsonSchemaToTS,
  generateObjectType,
  generateExtensionPropertiesType,
} from '../src/plugins/vite-plugin-youtrack-app-settings.js';

describe('safeKey', () => {
  it('returns plain identifiers unchanged', () => {
    assert.strictEqual(safeKey('myProp'), 'myProp');
    assert.strictEqual(safeKey('_private'), '_private');
    assert.strictEqual(safeKey('$value'), '$value');
    assert.strictEqual(safeKey('camelCase'), 'camelCase');
  });

  it('quotes kebab-case keys', () => {
    assert.strictEqual(safeKey('api-token'), "'api-token'");
    assert.strictEqual(safeKey('oauth-client-id'), "'oauth-client-id'");
  });

  it('quotes dot-notation keys', () => {
    assert.strictEqual(safeKey('oauth.clientId'), "'oauth.clientId'");
  });

  it('quotes keys starting with a digit', () => {
    assert.strictEqual(safeKey('1badName'), "'1badName'");
    assert.strictEqual(safeKey('42'), "'42'");
  });

  it('escapes single quotes inside the key', () => {
    assert.strictEqual(safeKey("it's"), "'it\\'s'");
  });
});

describe('jsonSchemaToTS', () => {
  it('returns string for string type', () => {
    assert.strictEqual(jsonSchemaToTS({ type: 'string' }), 'string');
  });

  it('returns union for string enum', () => {
    assert.strictEqual(
      jsonSchemaToTS({ type: 'string', enum: ['a', 'b'] }),
      "'a' | 'b'"
    );
  });

  it('returns number for integer and number types', () => {
    assert.strictEqual(jsonSchemaToTS({ type: 'integer' }), 'number');
    assert.strictEqual(jsonSchemaToTS({ type: 'number' }), 'number');
  });

  it('returns boolean for boolean type', () => {
    assert.strictEqual(jsonSchemaToTS({ type: 'boolean' }), 'boolean');
  });

  it('returns array type for array with items', () => {
    assert.strictEqual(jsonSchemaToTS({ type: 'array', items: { type: 'string' } }), 'string[]');
  });

  it('returns entity name for object with x-entity', () => {
    assert.strictEqual(jsonSchemaToTS({ type: 'object', 'x-entity': 'Issue' }), 'Issue');
  });

  it('returns unknown for missing type', () => {
    assert.strictEqual(jsonSchemaToTS({}), 'unknown');
  });
});

describe('generateObjectType — key quoting', () => {
  it('emits plain identifiers as bare keys', () => {
    const result = generateObjectType({ apiKey: { type: 'string' } });
    assert.ok(result.includes('apiKey?: string;'), `Got:\n${result}`);
  });

  it('quotes kebab-case keys', () => {
    const result = generateObjectType({ 'api-token': { type: 'string' } });
    assert.ok(result.includes("'api-token'?: string;"), `Got:\n${result}`);
    assert.ok(!result.includes('\napi-token'), `Unquoted key must not appear, got:\n${result}`);
  });

  it('quotes dot-notation keys', () => {
    const result = generateObjectType({ 'oauth.clientId': { type: 'string' } });
    assert.ok(result.includes("'oauth.clientId'?: string;"), `Got:\n${result}`);
  });

  it('quotes keys starting with a digit', () => {
    const result = generateObjectType({ '1version': { type: 'integer' } });
    assert.ok(result.includes("'1version'?: number;"), `Got:\n${result}`);
  });

  it('marks required keys as non-optional', () => {
    const result = generateObjectType(
      { 'api-token': { type: 'string' } },
      ['api-token']
    );
    assert.ok(result.includes("'api-token': string;"), `Got:\n${result}`);
    assert.ok(!result.includes("'api-token'?:"), `Should be required, got:\n${result}`);
  });

  it('mixes identifier and non-identifier keys correctly', () => {
    const result = generateObjectType({
      normalKey: { type: 'boolean' },
      'kebab-key': { type: 'string' },
    });
    assert.ok(result.includes('normalKey?: boolean;'), `Got:\n${result}`);
    assert.ok(result.includes("'kebab-key'?: string;"), `Got:\n${result}`);
  });
});

describe('generateExtensionPropertiesType — key quoting', () => {
  it('emits plain identifiers as bare keys', () => {
    const result = generateExtensionPropertiesType({ myProp: { type: 'string' } });
    assert.ok(result.includes('myProp?: string;'), `Got:\n${result}`);
  });

  it('quotes kebab-case extension property keys', () => {
    const result = generateExtensionPropertiesType({ 'custom-field': { type: 'string' } });
    assert.ok(result.includes("'custom-field'?: string;"), `Got:\n${result}`);
  });
});