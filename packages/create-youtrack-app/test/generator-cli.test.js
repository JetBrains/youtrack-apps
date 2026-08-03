const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const PKG_DIR = path.join(__dirname, '..');
const TEST_APP_DIR = path.join(PKG_DIR, 'tmp', 'test-generator-app');
const CLI_PATH = path.join(PKG_DIR, 'index.js');

/**
 * Helper to run the CLI command
 */
function runCLI(args, options = {}) {
  const cwd = options.cwd || TEST_APP_DIR;
  const { cwdBefore, ...execOptions } = options;
  const cmd = cwdBefore
    ? `node "${CLI_PATH}" --cwd "${cwd}" ${args}`
    : `node "${CLI_PATH}" ${args} --cwd "${cwd}"`;

  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      stdio: execOptions.silent ? 'pipe' : 'inherit',
      ...execOptions
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.stdout || error.stderr || '', error };
  }
}

/**
 * Helper to check if file exists
 */
function fileExists(relativePath) {
  return fs.existsSync(path.join(TEST_APP_DIR, relativePath));
}

/**
 * Helper to read file contents
 */
function readFile(relativePath) {
  return fs.readFileSync(path.join(TEST_APP_DIR, relativePath), 'utf8');
}

function createLintFixScript(argsPath) {
  const scriptPath = path.join(TEST_APP_DIR, 'record-lint-fix.cjs');
  const packageJsonPath = path.join(TEST_APP_DIR, 'package.json');
  const originalPackageJson = fs.readFileSync(packageJsonPath, 'utf8');

  fs.writeFileSync(
    scriptPath,
    `#!/usr/bin/env node\nrequire('node:fs').writeFileSync(${JSON.stringify(argsPath)}, JSON.stringify(process.argv.slice(2)));\n`
  );
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  pkg.scripts = {
    ...(pkg.scripts || {}),
    'lint:fix': 'node record-lint-fix.cjs',
  };
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

  return () => {
    fs.writeFileSync(packageJsonPath, originalPackageJson);
    fs.rmSync(scriptPath, { force: true });
    fs.rmSync(argsPath, { force: true });
  };
}

/**
 * Helper to check if file contains text
 */
function fileContains(relativePath, text) {
  try {
    const content = readFile(relativePath);
    return content.includes(text);
  } catch {
    return false;
  }
}

/**
 * Setup test environment
 */
function setupTestApp() {
  // Clean up if exists
  if (fs.existsSync(TEST_APP_DIR)) {
    fs.rmSync(TEST_APP_DIR, { recursive: true, force: true });
  }
  
  // Create directory structure
  fs.mkdirSync(TEST_APP_DIR, { recursive: true });
  fs.mkdirSync(path.join(TEST_APP_DIR, 'src', 'backend', 'router', 'global'), { recursive: true });
  fs.mkdirSync(path.join(TEST_APP_DIR, 'src', 'backend', 'router', 'project'), { recursive: true });
  fs.mkdirSync(path.join(TEST_APP_DIR, 'src', 'backend', 'router', 'issue'), { recursive: true });
  
  // Create package.json
  fs.writeFileSync(
    path.join(TEST_APP_DIR, 'package.json'),
    JSON.stringify({ name: 'test-app', version: '0.0.0', enhancedDX: 'true' }, null, 2)
  );
  
  // Create entity-extensions.json
  fs.writeFileSync(
    path.join(TEST_APP_DIR, 'src', 'entity-extensions.json'),
    JSON.stringify({ entityTypeExtensions: [] }, null, 2)
  );
}

/**
 * Cleanup test environment
 */
function cleanupTestApp() {
  if (fs.existsSync(TEST_APP_DIR)) {
    fs.rmSync(TEST_APP_DIR, { recursive: true, force: true });
  }
}

// ========================================
// TEST SUITES
// ========================================

describe('NestJS-Style Code Generation', () => {
  before(() => {
    console.log('Setting up test environment...');
    setupTestApp();
  });

  after(() => {
    console.log('Cleaning up test environment...');
    cleanupTestApp();
  });

  describe('HTTP Handlers', () => {
    test('should create simple GET handler by default', () => {
      const result = runCLI('http-handler add --scope global --path health', { silent: true });
      
      assert.strictEqual(result.success, true, 'Command should succeed');
      assert.strictEqual(
        fileExists('src/backend/router/global/health/GET.ts'),
        true,
        'GET.ts file should be created'
      );
      assert.strictEqual(
        fileContains('src/backend/router/global/health/GET.ts', 'GlobalHealthGETReq'),
        true,
        'Should contain GlobalHealthGETReq type'
      );
      assert.strictEqual(
        fileContains('src/backend/router/global/health/GET.ts', 'CtxGet'),
        true,
        'Should use CtxGet'
      );
    });

    test('should create POST handler with --method flag', () => {
      const result = runCLI('http-handler add --scope project --path users --method POST', { silent: true });
      
      assert.strictEqual(result.success, true, 'Command should succeed');
      assert.strictEqual(
        fileExists('src/backend/router/project/users/POST.ts'),
        true,
        'POST.ts file should be created'
      );
      assert.strictEqual(
        fileContains('src/backend/router/project/users/POST.ts', 'ProjectUsersPOSTReq'),
        true,
        'Should contain POST types'
      );
      assert.strictEqual(
        fileContains('src/backend/router/project/users/POST.ts', 'CtxPost'),
        true,
        'Should use CtxPost'
      );
    });

    test('should create PUT handler', () => {
      const result = runCLI('http-handler add --scope issue --path status --method PUT', { silent: true });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/issue/status/PUT.ts'), true);
      assert.strictEqual(
        fileContains('src/backend/router/issue/status/PUT.ts', 'CtxPut'),
        true
      );
    });

    test('should create DELETE handler', () => {
      const result = runCLI('http-handler add --scope global --path cache --method DELETE', { silent: true });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/global/cache/DELETE.ts'), true);
      assert.strictEqual(
        fileContains('src/backend/router/global/cache/DELETE.ts', 'CtxDelete'),
        true
      );
    });

    test('should create handler with permissions', () => {
      const result = runCLI('http-handler add --scope issue --path comments --method POST --permissions READ_ISSUE,UPDATE_ISSUE', { silent: true });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/issue/comments/POST.ts'), true);
      
      const content = readFile('src/backend/router/issue/comments/POST.ts');
      assert.strictEqual(content.includes('withPermissions'), true, 'Should use withPermissions');
      assert.strictEqual(content.includes('READ_ISSUE'), true, 'Should include READ_ISSUE permission');
      assert.strictEqual(content.includes('UPDATE_ISSUE'), true, 'Should include UPDATE_ISSUE permission');
    });

    test('should run npm lint:fix for generated handler when the app defines it', () => {
      const argsPath = path.join(TEST_APP_DIR, 'lint-fix-args.json');
      const cleanupLintFixScript = createLintFixScript(argsPath);

      try {
        const result = runCLI('http-handler add --scope global --path lint-hook', { silent: true });

        assert.strictEqual(result.success, true, 'Command should succeed');
        assert.deepStrictEqual(JSON.parse(fs.readFileSync(argsPath, 'utf8')), [
          'src/backend/router/global/lint-hook/GET.ts'
        ]);
      } finally {
        cleanupLintFixScript();
      }
    });

    test('should handle nested paths', () => {
      const result = runCLI('http-handler add --scope project --path users/profile/settings', { silent: true });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(
        fileExists('src/backend/router/project/users/profile/settings/GET.ts'),
        true
      );
      assert.strictEqual(
        fileContains('src/backend/router/project/users/profile/settings/GET.ts', 'ProjectUsersProfileSettingsGETReq'),
        true
      );
    });

    test('should reject the removed short alias "h"', () => {
      const result = runCLI('h global/ping', { silent: true });
      
      assert.strictEqual(result.success, false);
      assert.match(result.output, /Unknown command/);
    });

    test('http-handler interception should use normalized argv', () => {
      const indexPath = path.join(PKG_DIR, 'index.js');
      const indexContent = fs.readFileSync(indexPath, 'utf8');

      // Regression guard: public commands translated to Hygen's internal argv
      // must be detected via normalizedArgv, not raw argv.
      assert.ok(
        indexContent.includes("const isHttpHandlerCmd = new Set(normalizedArgv).has('http-handler')"),
        'HTTP handler interception should use normalizedArgv'
      );
    });

    test('should handle multiple permissions', () => {
      const result = runCLI('http-handler add --scope project --path admin --method POST --permissions READ_PROJECT,UPDATE_PROJECT,DELETE_PROJECT', { silent: true });
      
      assert.strictEqual(result.success, true);
      const content = readFile('src/backend/router/project/admin/POST.ts');
      assert.strictEqual(content.includes('READ_PROJECT'), true);
      assert.strictEqual(content.includes('UPDATE_PROJECT'), true);
      assert.strictEqual(content.includes('DELETE_PROJECT'), true);
    });
  });

  describe('Typed Endpoints', () => {
    test('supports non-interactive flags while retaining the endpoint generator', () => {
      const result = runCLI(
        'endpoint add --scope global --path cli-health --method GET --request-type never --response-type never',
        {silent: true}
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/global/cli-health/GET.ts'), true);
    });

    test('rejects a controller reference when its module does not exist', () => {
      const result = runCLI(
        'endpoint add --scope global --path missing-controller --method GET --controller rand',
        {silent: true}
      );

      assert.strictEqual(result.success, false);
      assert.match(result.output, /Controller module not found/);
      assert.match(result.output, /src\/backend\/controllers\/global\.missing-controller\.controller\.ts/);
      assert.strictEqual(fileExists('src/backend/router/global/missing-controller/GET.ts'), false);
    });

    test('accepts a controller reference when its module exists', () => {
      const controllerPath = path.join(
        TEST_APP_DIR,
        'src',
        'backend',
        'controllers',
        'global.existing-controller.controller.ts'
      );
      fs.mkdirSync(path.dirname(controllerPath), { recursive: true });
      fs.writeFileSync(controllerPath, 'export function rand(ctx) {}\n');

      const result = runCLI(
        'endpoint add --scope global --path existing-controller --method GET --controller rand',
        {silent: true}
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/global/existing-controller/GET.ts'), true);
    });
  });

  describe('Extension Properties', () => {
    test('honors --cwd when it appears before the command', () => {
      const result = runCLI('extension-property add --entity Issue --name cwdBefore', {silent: true, cwdBefore: true});

      assert.strictEqual(result.success, true);

      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      assert.ok(issueEntity.properties.cwdBefore, 'cwdBefore property should exist');
    });

    test('should create string property by default', () => {
      const result = runCLI('extension-property add --entity Issue --name customStatus', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.ok(issueEntity, 'Issue entity should exist');
      assert.ok(issueEntity.properties.customStatus, 'customStatus property should exist');
      assert.strictEqual(issueEntity.properties.customStatus.type, 'string');
      assert.strictEqual(issueEntity.properties.customStatus.multi, false);
    });

    test('does not treat a flag value of skill as the skill command', () => {
      const result = runCLI('extension-property add --entity Issue --name skill', { silent: true });

      assert.strictEqual(result.success, true);
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      assert.ok(issueEntity.properties.skill);
    });

    test('should create integer property', () => {
      const result = runCLI('extension-property add --entity Project --name rating --type integer', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const projectEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Project');
      
      assert.ok(projectEntity, 'Project entity should exist');
      assert.strictEqual(projectEntity.properties.rating.type, 'integer');
    });

    test('should create boolean property', () => {
      const result = runCLI('extension-property add --entity Issue --name isArchived --type boolean', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.strictEqual(issueEntity.properties.isArchived.type, 'boolean');
    });

    test('should create Issue reference property', () => {
      const result = runCLI('extension-property add --entity Issue --name relatedIssue --type Issue', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.strictEqual(issueEntity.properties.relatedIssue.type, 'Issue');
    });

    test('should create multi-value property with --set flag', () => {
      const result = runCLI('extension-property add --entity Issue --name tags --type string --set', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.strictEqual(issueEntity.properties.tags.type, 'string');
      assert.strictEqual(issueEntity.properties.tags.multi, true);
    });

    test('should reject removed --multi alias', () => {
      const result = runCLI('extension-property add --entity Issue --name labels --type string --multi true', { silent: true });

      assert.strictEqual(result.success, false);
      assert.match(result.output, /Unknown option "--multi"/);
    });

    test('should store multi as boolean not string', () => {
      const result = runCLI('extension-property add --entity Issue --name score --type integer --set', { silent: true });

      assert.strictEqual(result.success, true);

      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');

      assert.strictEqual(typeof issueEntity.properties.score.multi, 'boolean', 'multi must be a boolean, not a string');
    });

    test('should create property on User entity', () => {
      const result = runCLI('extension-property add --entity User --name department --type string', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const userEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'User');
      
      assert.ok(userEntity, 'User entity should exist');
      assert.ok(userEntity.properties.department);
    });

    test('should create property on Article', () => {
      const result = runCLI('extension-property add --entity Article --name config --type string', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const articleEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Article');
      
      assert.ok(articleEntity, 'Article entity should exist');
      assert.ok(articleEntity.properties.config);
    });

    test('should reject the removed short alias "p"', () => {
      const result = runCLI('p Issue.priority --type integer', { silent: true });
      
      assert.strictEqual(result.success, false);
      assert.match(result.output, /Unknown command/);
    });

    test('should reject the removed alias "prop"', () => {
      const result = runCLI('prop Article.version --type integer', { silent: true });
      
      assert.strictEqual(result.success, false);
      assert.match(result.output, /Unknown command/);
    });

    test('should handle property names with underscores', () => {
      const result = runCLI('extension-property add --entity Issue --name custom_field_name --type string', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.ok(issueEntity.properties.custom_field_name);
    });
  });

  describe('Workflow Rules', () => {
    test('should create workflow rules in src/workflows', () => {
      const result = runCLI('rule add --type onChange --name notify-cli-rule', { silent: true });

      assert.strictEqual(result.success, true, 'Command should succeed');
      assert.strictEqual(fileExists('src/workflows/notify-cli-rule.ts'), true);
      assert.strictEqual(fileExists('src/workflows/notify-cli-rule.js'), false);
      assert.strictEqual(fileExists('src/backend/workflows/notify-cli-rule.ts'), false);
    });

    test('does not treat a rule name of skill as the skill command', () => {
      const result = runCLI('rule add --type onChange --name skill', { silent: true });

      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/workflows/skill.ts'), true);
    });
  });

  describe('Error Handling & Validation', () => {
    test('should reject invalid scope', () => {
      const result = runCLI('http-handler add --scope invalid --path health', { silent: true });
      
      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(
        result.output.includes('Invalid scope'),
        'Should show invalid scope error'
      );
    });

    test('should reject invalid entity target', () => {
      const result = runCLI('extension-property add --entity InvalidEntity --name field', { silent: true });
      
      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(
        result.output.includes('Invalid target'),
        'Should show invalid target error'
      );
    });

    test('should reject invalid property type', () => {
      const result = runCLI('extension-property add --entity Issue --name field --type invalidtype', { silent: true });
      
      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(
        result.output.includes('Invalid type'),
        'Should show invalid type error'
      );
    });

    test('should reject invalid property name with spaces', () => {
      const result = runCLI('extension-property add --entity Issue --name "my field"', { silent: true });
      
      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(
        result.output.includes('Invalid property name'),
        'Should show invalid property name error'
      );
    });

    test('should reject property name starting with number', () => {
      const result = runCLI('extension-property add --entity Issue --name 123field', { silent: true });
      
      assert.strictEqual(result.success, false, 'Command should fail');
    });

    test('should reject property name with hyphens', () => {
      const result = runCLI('extension-property add --entity Issue --name field-name', { silent: true });
      
      assert.strictEqual(result.success, false, 'Command should fail');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very deep nested paths', () => {
      const result = runCLI('http-handler add --scope project --path api/v1/users/profile/settings/advanced', { silent: true });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(
        fileExists('src/backend/router/project/api/v1/users/profile/settings/advanced/GET.ts'),
        true
      );
    });

    test('should handle single character property name', () => {
      const result = runCLI('extension-property add --entity Issue --name x --type integer', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.ok(issueEntity.properties.x);
    });

    test('should handle very long property name', () => {
      const longName = 'thisIsAVeryLongPropertyNameThatIsStillValidButUnusuallyLong';
      const result = runCLI(`extension-property add --entity Issue --name ${longName} --type string`, { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.ok(issueEntity.properties[longName]);
    });

    test('should fail with clear error when entity-extensions.json has invalid JSON', () => {
      const entityExtPath = path.join(TEST_APP_DIR, 'src', 'entity-extensions.json');
      const backup = fs.readFileSync(entityExtPath, 'utf8');
      try {
        fs.writeFileSync(entityExtPath, '{ invalid json }', 'utf8');
        const result = runCLI('extension-property add --entity Issue --name invalidJsonTest --type string', { silent: true });

        assert.strictEqual(result.success, false);
        assert.ok(result.output.includes('invalid JSON') || result.output.includes('entity-extensions'));
      } finally {
        fs.writeFileSync(entityExtPath, backup, 'utf8');
      }
    });
  });

  describe('All Scopes', () => {
    test('should work with global scope', () => {
      const result = runCLI('http-handler add --scope global --path test1', { silent: true });
      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/global/test1/GET.ts'), true);
    });

    test('should work with project scope', () => {
      const result = runCLI('http-handler add --scope project --path test2', { silent: true });
      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/project/test2/GET.ts'), true);
    });

    test('should work with issue scope', () => {
      const result = runCLI('http-handler add --scope issue --path test3', { silent: true });
      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/issue/test3/GET.ts'), true);
    });
  });

  describe('All HTTP Methods', () => {
    ['GET', 'POST', 'PUT', 'DELETE'].forEach((method) => {
      test(`should create ${method} handler`, () => {
        const result = runCLI(`http-handler add --scope global --path method-test-${method.toLowerCase()} --method ${method}`, { silent: true });
        assert.strictEqual(result.success, true);
        assert.strictEqual(
          fileExists(`src/backend/router/global/method-test-${method.toLowerCase()}/${method}.ts`),
          true
        );
      });
    });
  });

  describe('All Property Types', () => {
    ['string', 'integer', 'float', 'boolean', 'Issue', 'User', 'Project', 'Article'].forEach((type) => {
      test(`should create property with ${type} type`, () => {
        const result = runCLI(`extension-property add --entity Issue --name type_test_${type} --type ${type}`, { silent: true });
        assert.strictEqual(result.success, true);
        
        const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
        const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
        
        assert.strictEqual(issueEntity.properties[`type_test_${type}`].type, type);
      });
    });
  });

  describe('All Entity Types', () => {
    ['Issue', 'User', 'Project', 'Article'].forEach((entity) => {
      test(`should create property on ${entity} entity`, () => {
        const result = runCLI(`extension-property add --entity ${entity} --name entity_test --type string`, { silent: true });
        assert.strictEqual(result.success, true);
        
        const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
        const targetEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === entity);
        
        assert.ok(targetEntity, `${entity} entity should exist`);
        assert.ok(targetEntity.properties.entity_test);
      });
    });
  });

});
