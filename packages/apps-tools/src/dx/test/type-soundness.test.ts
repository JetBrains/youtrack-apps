import { describe, it } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const APPS_TOOLS_ROOT = path.join(__dirname, '..', '..', '..');
const WORKFLOW_TYPES_ROOT = path.join(APPS_TOOLS_ROOT, '..', 'youtrack-workflow-types');
const TSC_PATH = require.resolve('typescript/bin/tsc');

const writeJson = (filePath: string, value: unknown) => {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const linkPackage = (fixtureRoot: string, packageName: string, packageRoot: string) => {
  const scopeDir = path.join(fixtureRoot, 'node_modules', '@jetbrains');
  fs.mkdirSync(scopeDir, { recursive: true });
  fs.symlinkSync(packageRoot, path.join(scopeDir, packageName), 'dir');
};

const createFixture = () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'youtrack-types-e2e-'));
  fs.mkdirSync(path.join(fixtureRoot, 'src'), { recursive: true });

  writeJson(path.join(fixtureRoot, 'package.json'), {
    name: 'youtrack-types-e2e-consumer',
    private: true,
    type: 'module',
    dependencies: {
      '@jetbrains/youtrack-apps-tools': 'file:../youtrack-apps-tools',
      '@jetbrains/youtrack-workflow-types': 'file:../youtrack-workflow-types',
    },
  });

  writeJson(path.join(fixtureRoot, 'tsconfig.json'), {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      esModuleInterop: true,
      types: ['@jetbrains/youtrack-workflow-types/scripting-api'],
    },
    include: ['src/**/*.ts'],
  });

  fs.writeFileSync(path.join(fixtureRoot, 'src', 'consumer.ts'), `
import { validate } from '@jetbrains/youtrack-apps-tools';
import youtrackApiGenerator from '@jetbrains/youtrack-apps-tools/dx/plugins/api-generator';
import youtrackAppSettings from '@jetbrains/youtrack-apps-tools/dx/plugins/app-settings';
import { withPermissions, set } from '@jetbrains/youtrack-apps-tools/dx/runtime';
import type { CtxGetIssue, PermissionKey } from '@jetbrains/youtrack-apps-tools/dx/runtime';
import type { AITool } from '@jetbrains/youtrack-workflow-types/ai-tools';
import type { AppManifest, AppTypeRegistry, HttpScope } from '@jetbrains/youtrack-workflow-types/apps';
import type { Period } from '@jetbrains/youtrack-workflow-types/date-time';
import type { Connection, Response } from '@jetbrains/youtrack-workflow-types/http';
import type { LicenseInfo } from '@jetbrains/youtrack-workflow-types/license';
import type { SearchQuery } from '@jetbrains/youtrack-workflow-types/search';
import type { JSONSchema } from '@jetbrains/youtrack-workflow-types/utility-types';
import type { Issue, Project, State, User } from '@jetbrains/youtrack-workflow-types/workflowTypeScriptStubs';
import type { Issue as IssueViaShim } from '@jetbrains/youtrack-scripting-api/entities';
import type { HttpScope as HttpScopeViaShim } from '@jetbrains/youtrack-scripting-api/apps';
import '@jetbrains/youtrack-workflow-types/packages';

type Probe = [
  AITool,
  AppManifest,
  AppTypeRegistry,
  HttpScope,
  Period,
  Connection,
  Response,
  LicenseInfo,
  SearchQuery,
  JSONSchema,
  Issue,
  Project,
  State,
  User,
  IssueViaShim,
  HttpScopeViaShim,
];

declare const probe: Probe;
declare const issue: Issue;
declare const handlerCtx: CtxGetIssue;
const permissions = ['READ_ISSUE'] satisfies PermissionKey[];

const handler = withPermissions((ctx: CtxGetIssue) => {
  ctx.response.json({ id: ctx.issue.id });
}, permissions);

set(issue, 'TypeScriptE2EProbe', 'ok');

void validate;
void handlerCtx;
void handler;
void probe;
void youtrackApiGenerator();
void youtrackAppSettings();
`);

  linkPackage(fixtureRoot, 'youtrack-apps-tools', APPS_TOOLS_ROOT);
  linkPackage(fixtureRoot, 'youtrack-workflow-types', WORKFLOW_TYPES_ROOT);

  return fixtureRoot;
};

describe('published package type surface', () => {
  it('type-checks a linked consumer fixture', () => {
    const fixtureRoot = createFixture();

    try {
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
