import { describe, it } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  getTypeScriptType,
  generateExtensionPropertiesType,
  generateExtendedEntities,
} from '../plugins/vite-plugin-youtrack-extension-properties.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const APPS_TOOLS_ROOT = path.join(__dirname, '..', '..', '..');
const WORKFLOW_TYPES_ROOT = path.join(APPS_TOOLS_ROOT, '..', 'youtrack-workflow-types');
const TSC_PATH = require.resolve('typescript/bin/tsc');

const writeJson = (filePath: string, value: unknown) => {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const linkWorkflowTypesPackage = (fixtureRoot: string) => {
  const scopeDir = path.join(fixtureRoot, 'node_modules', '@jetbrains');
  fs.mkdirSync(scopeDir, { recursive: true });
  fs.symlinkSync(WORKFLOW_TYPES_ROOT, path.join(scopeDir, 'youtrack-workflow-types'), 'dir');
};

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

    assert.ok(output.includes("export type IssueExtensionProperties = {"), `Missing IssueExtensionProperties, got:\n${output}`);
    assert.ok(output.includes("export type ExtendedIssue = Omit<Issue, 'extensionProperties'> & {"), `Missing ExtendedIssue, got:\n${output}`);
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

  it('registers app-local extension properties for search queries', () => {
    const output = generateExtendedEntities({
      entityTypeExtensions: [
        {
          entityType: 'Issue',
          properties: {
            customNote: { type: 'string' },
            tags: { type: 'string', multi: true },
          },
        },
      ],
    });

    assert.ok(
      output.includes("declare module '@jetbrains/youtrack-workflow-types/workflowTypeScriptStubs'"),
      `Missing workflow type augmentation, got:\n${output}`,
    );
    assert.ok(
      output.includes('Issue: IssueExtensionProperties;'),
      `Missing issue extension registry entry, got:\n${output}`,
    );
  });

  it('type-checks app-local extension property search queries', () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'youtrack-extension-search-'));
    const srcRoot = path.join(fixtureRoot, 'src');
    const apiRoot = path.join(srcRoot, 'api');
    const extensions = {
      entityTypeExtensions: [
        {
          entityType: 'Issue',
          properties: {
            customNote: { type: 'string' },
            customScore: { type: 'integer' },
            owner: { type: 'User' },
            tags: { type: 'string', multi: true },
          },
        },
      ],
    };

    try {
      fs.mkdirSync(apiRoot, { recursive: true });
      writeJson(path.join(fixtureRoot, 'package.json'), {
        name: 'youtrack-extension-search-consumer',
        private: true,
        type: 'module',
      });
      writeJson(path.join(fixtureRoot, 'tsconfig.json'), {
        compilerOptions: {
          target: 'ES2022',
          lib: ['ES2022'],
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          esModuleInterop: true,
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*'],
          },
          types: ['@jetbrains/youtrack-workflow-types/scripting-api'],
        },
        include: ['src/**/*.ts'],
      });
      fs.writeFileSync(path.join(apiRoot, 'extended-entities.d.ts'), generateExtendedEntities(extensions));
      fs.writeFileSync(path.join(srcRoot, 'consumer.ts'), `
import { Issue, User } from '@jetbrains/youtrack-scripting-api/entities';
import { search } from '@jetbrains/youtrack-scripting-api/search';

const owner = User.findByLogin('root');

Issue.findByExtensionProperties({
  customNote: 'hello',
  customScore: 42,
  owner,
});

Issue.findByExtensionProperties({ customNote: 'hello' });

search({
  query: '',
  extensionPropertiesQuery: {
    customNote: null,
    customScore: 1,
    owner,
  },
});

search({
  query: '',
  extensionPropertiesQuery: {
    customNote: 'hello',
  },
});

// @ts-expect-error unknown extension property names are rejected
Issue.findByExtensionProperties({ missing: 'hello' });

// @ts-expect-error declared extension property values keep their app-local type
Issue.findByExtensionProperties({ customNote: 42 });

// @ts-expect-error multi-value extension properties are not searchable
Issue.findByExtensionProperties({ tags: new Set(['frontend']) });
`);
      linkWorkflowTypesPackage(fixtureRoot);

      const result = spawnSync(process.execPath, [TSC_PATH, '--noEmit', '-p', 'tsconfig.json', '--pretty', 'false'], {
        cwd: fixtureRoot,
        encoding: 'utf8',
      });

      assert.strictEqual(
        result.status,
        0,
        [result.stdout, result.stderr].filter(Boolean).join('\n')
      );
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
