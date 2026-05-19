import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Project } from 'ts-morph';
import {
  isValidIdentifier,
  isHandlerFile,
  toPascalCase,
  formatApiStructure,
  processRouteFile,
} from '../plugins/vite-plugin-youtrack-api-generator.js';

describe('isValidIdentifier', () => {
  it('accepts simple identifiers', () => {
    assert.strictEqual(isValidIdentifier('foo'), true);
    assert.strictEqual(isValidIdentifier('FooBar'), true);
    assert.strictEqual(isValidIdentifier('_private'), true);
    assert.strictEqual(isValidIdentifier('$dollar'), true);
  });

  it('rejects identifiers with hyphens', () => {
    assert.strictEqual(isValidIdentifier('get-user'), false);
  });

  it('rejects empty string', () => {
    assert.strictEqual(isValidIdentifier(''), false);
  });
});

describe('toPascalCase', () => {
  it('converts hyphenated strings', () => {
    assert.strictEqual(toPascalCase('get-user'), 'GetUser');
    assert.strictEqual(toPascalCase('my-cool-component'), 'MyCoolComponent');
  });

  it('converts underscore-separated strings', () => {
    assert.strictEqual(toPascalCase('get_user'), 'GetUser');
  });

  it('handles single word', () => {
    assert.strictEqual(toPascalCase('demo'), 'Demo');
  });

  it('handles empty string', () => {
    assert.strictEqual(toPascalCase(''), '');
  });
});

describe('api.d.ts generation with hyphenated handler paths', () => {
  let tmpDir: string;
  let routerRoot: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-gen-test-'));
    routerRoot = path.join(tmpDir, 'src', 'backend', 'router');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const createHandlerFile = (scope: string, routePath: string, method: string) => {
    const dir = path.join(routerRoot, scope, routePath);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${method}.ts`);
    fs.writeFileSync(filePath, `
export type Req = { message?: string };
export type Res = { ok: boolean };
function handle(ctx: any): void { ctx.response.json({ ok: true }); }
export default handle;
export type Handle = typeof handle;
`);
    return filePath;
  };

  const generateApiDts = async (handlerFiles: string[]) => {
    const project = new Project();
    project.addSourceFilesAtPaths(handlerFiles);

    const allTypes = new Map<string, { namespaceImports: Set<string>; namedImports: Set<string> }>();
    const apiStructure = {};

    await Promise.all(
      project.getSourceFiles().map((sf) =>
        processRouteFile(sf, routerRoot, apiStructure, allTypes)
      )
    );

    const apiDtsFile = project.createSourceFile(
      path.join(tmpDir, 'api.d.ts'), '', { overwrite: true }
    );

    apiDtsFile.addImportDeclaration({
      moduleSpecifier: '../backend/types/utility',
      namedImports: ['ExtractRPCFromHandler']
    });

    for (const [moduleSpecifier, typeInfo] of allTypes.entries()) {
      if (typeInfo.namespaceImports.size > 0) {
        for (const namespaceName of typeInfo.namespaceImports) {
          apiDtsFile.addImportDeclaration({
            moduleSpecifier,
            namespaceImport: namespaceName
          });
        }
      }
    }

    apiDtsFile.addTypeAlias({
      name: 'ApiRouter',
      isExported: true,
      type: formatApiStructure(apiStructure)
    });

    return apiDtsFile.getFullText();
  };

  it('generates valid api.d.ts for simple handler paths', async () => {
    const f = createHandlerFile('global', 'demo', 'GET');
    const output = await generateApiDts([f]);

    assert.ok(output.includes('import * as globalDemoGETHandler from'), 'should have valid namespace import');
    assert.ok(output.includes('globalDemoGETHandler.Handle'), 'should reference handler type');
    assert.ok(output.includes('demo:'), 'simple key should not be quoted');
  });

  it('generates valid api.d.ts for hyphenated handler paths', async () => {
    const f = createHandlerFile('user', 'get-user', 'GET');
    const output = await generateApiDts([f]);

    assert.ok(
      output.includes('import * as userGetUserGETHandler from'),
      `Expected PascalCased namespace import, got:\n${output}`
    );
    assert.ok(
      !output.includes('userget-user'),
      `Expected NO raw hyphen in identifier, got:\n${output}`
    );
    assert.ok(
      output.includes("'get-user'"),
      `Expected quoted key for hyphenated path, got:\n${output}`
    );
    assert.ok(
      output.includes('userGetUserGETHandler.Handle'),
      `Expected valid type reference, got:\n${output}`
    );

    // Verify the import statement is well-formed (single line, not split)
    const importLine = output.split('\n').find(l => l.includes('userGetUserGETHandler'));
    assert.ok(importLine, 'should find import line');
    assert.ok(
      importLine!.includes('from') && importLine!.includes('import'),
      `Import should be on a single line, got: "${importLine}"`
    );
  });

  it('generates valid api.d.ts for deeply nested hyphenated paths', async () => {
    const f = createHandlerFile('global', 'api-v2/get-all-users', 'POST');
    const output = await generateApiDts([f]);

    assert.ok(
      output.includes('import * as globalApiV2GetAllUsersPOSTHandler from'),
      `Expected deeply nested PascalCase name, got:\n${output}`
    );
    assert.ok(
      output.includes("'api-v2'"),
      `Expected quoted key for api-v2, got:\n${output}`
    );
    assert.ok(
      output.includes("'get-all-users'"),
      `Expected quoted key for get-all-users, got:\n${output}`
    );
  });

  it('handles mix of hyphenated and non-hyphenated paths', async () => {
    const files = [
      createHandlerFile('global', 'demo', 'GET'),
      createHandlerFile('user', 'get-user', 'GET'),
      createHandlerFile('user', 'postuser', 'POST'),
    ];
    const output = await generateApiDts(files);

    assert.ok(output.includes('import * as globalDemoGETHandler from'), 'simple path import');
    assert.ok(output.includes('import * as userGetUserGETHandler from'), 'hyphenated path import');
    assert.ok(output.includes('import * as userPostuserPOSTHandler from'), 'non-hyphenated path import');

    assert.ok(output.includes("'get-user':"), 'hyphenated key is quoted');
    assert.ok(!output.includes("'demo':"), 'simple key is NOT quoted');
    assert.ok(!output.includes("'postuser':"), 'simple key is NOT quoted');

    // No raw hyphens in any identifiers
    const identifierPattern = /import \* as ([^ ]+) from/g;
    let match;
    while ((match = identifierPattern.exec(output)) !== null) {
      assert.ok(
        isValidIdentifier(match[1]),
        `Namespace import "${match[1]}" must be a valid identifier`
      );
    }
  });
});

describe('isHandlerFile', () => {
  it('matches GET handler', () => {
    assert.strictEqual(isHandlerFile('/project/src/backend/router/global/demo/GET.ts'), true);
  });
  it('matches POST handler', () => {
    assert.strictEqual(isHandlerFile('/project/src/backend/router/issue/note/POST.ts'), true);
  });
  it('matches PUT handler', () => {
    assert.strictEqual(isHandlerFile('/project/src/backend/router/issue/note/PUT.ts'), true);
  });
  it('matches DELETE handler', () => {
    assert.strictEqual(isHandlerFile('/project/src/backend/router/issue/note/DELETE.ts'), true);
  });
  it('rejects a non-handler .ts file', () => {
    assert.strictEqual(isHandlerFile('/project/src/backend/router/global/demo/utils.ts'), false);
  });
  it('rejects a handler-named file not ending in .ts', () => {
    assert.strictEqual(isHandlerFile('/project/src/backend/router/global/demo/GET.js'), false);
  });
  it('rejects an empty string', () => {
    assert.strictEqual(isHandlerFile(''), false);
  });
});
