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
  const cmd = `node "${CLI_PATH}" ${args} --cwd "${cwd}"`;
  
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
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
      const result = runCLI('handler global/health', { silent: true });
      
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
      const result = runCLI('handler project/users --method POST', { silent: true });
      
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
      const result = runCLI('handler issue/status --method PUT', { silent: true });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/issue/status/PUT.ts'), true);
      assert.strictEqual(
        fileContains('src/backend/router/issue/status/PUT.ts', 'CtxPut'),
        true
      );
    });

    test('should create DELETE handler', () => {
      const result = runCLI('handler global/cache --method DELETE', { silent: true });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/global/cache/DELETE.ts'), true);
      assert.strictEqual(
        fileContains('src/backend/router/global/cache/DELETE.ts', 'CtxDelete'),
        true
      );
    });

    test('should create handler with permissions', () => {
      const result = runCLI('handler issue/comments --method POST --permissions READ_ISSUE,UPDATE_ISSUE', { silent: true });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/issue/comments/POST.ts'), true);
      
      const content = readFile('src/backend/router/issue/comments/POST.ts');
      assert.strictEqual(content.includes('withPermissions'), true, 'Should use withPermissions');
      assert.strictEqual(content.includes('READ_ISSUE'), true, 'Should include READ_ISSUE permission');
      assert.strictEqual(content.includes('UPDATE_ISSUE'), true, 'Should include UPDATE_ISSUE permission');
    });

    test('should handle nested paths', () => {
      const result = runCLI('handler project/users/profile/settings', { silent: true });
      
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

    test('should work with short alias "h"', () => {
      const result = runCLI('h global/ping', { silent: true });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/global/ping/GET.ts'), true);
    });

    test('should handle multiple permissions', () => {
      const result = runCLI('handler project/admin --method POST --permissions READ_PROJECT,UPDATE_PROJECT,DELETE_PROJECT', { silent: true });
      
      assert.strictEqual(result.success, true);
      const content = readFile('src/backend/router/project/admin/POST.ts');
      assert.strictEqual(content.includes('READ_PROJECT'), true);
      assert.strictEqual(content.includes('UPDATE_PROJECT'), true);
      assert.strictEqual(content.includes('DELETE_PROJECT'), true);
    });
  });

  describe('Extension Properties', () => {
    test('should create string property by default', () => {
      const result = runCLI('property Issue.customStatus', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.ok(issueEntity, 'Issue entity should exist');
      assert.ok(issueEntity.properties.customStatus, 'customStatus property should exist');
      assert.strictEqual(issueEntity.properties.customStatus.type, 'string');
      assert.strictEqual(issueEntity.properties.customStatus.multi, false);
    });

    test('should create integer property', () => {
      const result = runCLI('property Comment.rating --type integer', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const commentEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Comment');
      
      assert.ok(commentEntity, 'Comment entity should exist');
      assert.strictEqual(commentEntity.properties.rating.type, 'integer');
    });

    test('should create boolean property', () => {
      const result = runCLI('property Issue.isArchived --type boolean', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.strictEqual(issueEntity.properties.isArchived.type, 'boolean');
    });

    test('should create Issue reference property', () => {
      const result = runCLI('property Issue.relatedIssue --type Issue', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.strictEqual(issueEntity.properties.relatedIssue.type, 'Issue');
    });

    test('should create multi-value property with --set flag', () => {
      const result = runCLI('property Issue.tags --type string --set', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.strictEqual(issueEntity.properties.tags.type, 'string');
      assert.strictEqual(issueEntity.properties.tags.multi, true);
    });

    test('should create property on User entity', () => {
      const result = runCLI('property User.department --type string', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const userEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'User');
      
      assert.ok(userEntity, 'User entity should exist');
      assert.ok(userEntity.properties.department);
    });

    test('should create property on AppGlobalStorage', () => {
      const result = runCLI('property AppGlobalStorage.config --type string', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const storageEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'AppGlobalStorage');
      
      assert.ok(storageEntity, 'AppGlobalStorage entity should exist');
      assert.ok(storageEntity.properties.config);
    });

    test('should work with short alias "p"', () => {
      const result = runCLI('p Issue.priority --type integer', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.ok(issueEntity.properties.priority);
    });

    test('should work with short alias "prop"', () => {
      const result = runCLI('prop Comment.version --type integer', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const commentEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Comment');
      
      assert.ok(commentEntity.properties.version);
    });

    test('should handle property names with underscores', () => {
      const result = runCLI('property Issue.custom_field_name --type string', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.ok(issueEntity.properties.custom_field_name);
    });
  });

  describe('Error Handling & Validation', () => {
    test('should reject invalid scope', () => {
      const result = runCLI('handler invalid/health', { silent: true });
      
      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(
        result.output.includes('Invalid scope'),
        'Should show invalid scope error'
      );
    });

    test('should reject invalid entity target', () => {
      const result = runCLI('property InvalidEntity.field', { silent: true });
      
      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(
        result.output.includes('Invalid target'),
        'Should show invalid target error'
      );
    });

    test('should reject invalid property type', () => {
      const result = runCLI('property Issue.field --type invalidtype', { silent: true });
      
      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(
        result.output.includes('Invalid type'),
        'Should show invalid type error'
      );
    });

    test('should reject invalid property name with spaces', () => {
      const result = runCLI('property "Issue.my field"', { silent: true });
      
      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(
        result.output.includes('Invalid property name'),
        'Should show invalid property name error'
      );
    });

    test('should reject property name starting with number', () => {
      const result = runCLI('property Issue.123field', { silent: true });
      
      assert.strictEqual(result.success, false, 'Command should fail');
    });

    test('should reject property name with hyphens', () => {
      const result = runCLI('property "Issue.field-name"', { silent: true });
      
      assert.strictEqual(result.success, false, 'Command should fail');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very deep nested paths', () => {
      const result = runCLI('handler project/api/v1/users/profile/settings/advanced', { silent: true });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(
        fileExists('src/backend/router/project/api/v1/users/profile/settings/advanced/GET.ts'),
        true
      );
    });

    test('should handle single character property name', () => {
      const result = runCLI('property Issue.x --type integer', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.ok(issueEntity.properties.x);
    });

    test('should handle very long property name', () => {
      const longName = 'thisIsAVeryLongPropertyNameThatIsStillValidButUnusuallyLong';
      const result = runCLI(`property Issue.${longName} --type string`, { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.ok(issueEntity.properties[longName]);
    });
  });

  describe('All Scopes', () => {
    test('should work with global scope', () => {
      const result = runCLI('handler global/test1', { silent: true });
      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/global/test1/GET.ts'), true);
    });

    test('should work with project scope', () => {
      const result = runCLI('handler project/test2', { silent: true });
      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/project/test2/GET.ts'), true);
    });

    test('should work with issue scope', () => {
      const result = runCLI('handler issue/test3', { silent: true });
      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/backend/router/issue/test3/GET.ts'), true);
    });
  });

  describe('All HTTP Methods', () => {
    ['GET', 'POST', 'PUT', 'DELETE'].forEach((method) => {
      test(`should create ${method} handler`, () => {
        const result = runCLI(`handler global/method-test-${method.toLowerCase()} --method ${method}`, { silent: true });
        assert.strictEqual(result.success, true);
        assert.strictEqual(
          fileExists(`src/backend/router/global/method-test-${method.toLowerCase()}/${method}.ts`),
          true
        );
      });
    });
  });

  describe('All Property Types', () => {
    ['string', 'integer', 'boolean', 'Issue'].forEach((type) => {
      test(`should create property with ${type} type`, () => {
        const result = runCLI(`property Issue.type_test_${type} --type ${type}`, { silent: true });
        assert.strictEqual(result.success, true);
        
        const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
        const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
        
        assert.strictEqual(issueEntity.properties[`type_test_${type}`].type, type);
      });
    });
  });

  describe('All Entity Types', () => {
    ['Issue', 'Comment', 'User', 'AppGlobalStorage'].forEach((entity) => {
      test(`should create property on ${entity} entity`, () => {
        const result = runCLI(`property ${entity}.entity_test --type string`, { silent: true });
        assert.strictEqual(result.success, true);
        
        const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
        const targetEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === entity);
        
        assert.ok(targetEntity, `${entity} entity should exist`);
        assert.ok(targetEntity.properties.entity_test);
      });
    });
  });
});
