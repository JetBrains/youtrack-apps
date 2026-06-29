const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const PKG_DIR = path.join(__dirname, '..');
const TEST_APP_DIR = path.join(PKG_DIR, 'tmp', 'test-generator-app');
const MINIMAL_APP_DIR = path.join(PKG_DIR, 'tmp', 'test-rule-minimal-app');
const EMPTY_RULE_DIR = path.join(PKG_DIR, 'tmp', 'test-rule-empty-dir');
const WORKFLOW_BUILD_DIR = path.join(PKG_DIR, 'tmp', 'test-workflow-build-app');
const JS_APP_MENU_DIR = path.join(PKG_DIR, 'tmp', 'test-js-app-menu');
const NON_INTERACTIVE_CREATE_DIR = path.join(PKG_DIR, 'tmp', 'test-non-interactive-create');
const NON_INTERACTIVE_INVALID_DIR = path.join(PKG_DIR, 'tmp', 'test-non-interactive-invalid');
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

function readPackageFile(relativePath) {
  return fs.readFileSync(path.join(PKG_DIR, relativePath), 'utf8');
}

function stripTemplateFrontmatter(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n/, '');
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
  if (fs.existsSync(MINIMAL_APP_DIR)) {
    fs.rmSync(MINIMAL_APP_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(EMPTY_RULE_DIR)) {
    fs.rmSync(EMPTY_RULE_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(WORKFLOW_BUILD_DIR)) {
    fs.rmSync(WORKFLOW_BUILD_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(JS_APP_MENU_DIR)) {
    fs.rmSync(JS_APP_MENU_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(NON_INTERACTIVE_CREATE_DIR)) {
    fs.rmSync(NON_INTERACTIVE_CREATE_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(NON_INTERACTIVE_INVALID_DIR)) {
    fs.rmSync(NON_INTERACTIVE_INVALID_DIR, { recursive: true, force: true });
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

    test('should run npm lint:fix for generated handler when the app defines it', () => {
      const argsPath = path.join(TEST_APP_DIR, 'lint-fix-args.json');
      const cleanupLintFixScript = createLintFixScript(argsPath);

      try {
        const result = runCLI('handler global/lint-hook', { silent: true });

        assert.strictEqual(result.success, true, 'Command should succeed');
        assert.deepStrictEqual(JSON.parse(fs.readFileSync(argsPath, 'utf8')), [
          'src/backend/router/global/lint-hook/GET.ts'
        ]);
      } finally {
        cleanupLintFixScript();
      }
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

    test('should create root scoped handler when route path is empty', () => {
      const result = runCLI('handler global/ --method GET', { silent: true });

      assert.strictEqual(result.success, true, result.output);
      assert.strictEqual(fileExists('src/backend/router/global/GET.ts'), true);
      assert.strictEqual(
        fileContains('src/backend/router/global/GET.ts', 'GlobalGETReq'),
        true
      );
    });

    test('http-handler interception should use normalized aliases', () => {
      const indexPath = path.join(PKG_DIR, 'index.js');
      const indexContent = fs.readFileSync(indexPath, 'utf8');

      // Regression guard: alias commands like `handler add` / `h add`
      // must be routed through normalized Hygen args, not raw argv.
      assert.ok(
        indexContent.includes("const { normalizedArgv, positionalArgs } = normalizeCommandArgs(argv, args._)"),
        'HTTP handler interception should use normalizedArgv for alias handling'
      );
      assert.ok(
        indexContent.includes('return runHygen(hygenArgs)'),
        'Hygen should receive normalized command args'
      );
    });

    test('legacy http-handler action should not include enhanced-dx subtemplates', () => {
      assert.strictEqual(
        fs.existsSync(path.join(PKG_DIR, '_templates', 'http-handler', 'add', 'enhanced-dx', 'handler.ts.t')),
        false
      );
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

  describe('Classic Workflow Rules', () => {
    const ruleCases = [
      ['onChange', 'notify-on-change', 'entities.Issue.onChange'],
      ['onSchedule', 'weekly-digest', 'entities.Issue.onSchedule'],
      ['action', 'apply-template', 'entities.Issue.action'],
      ['stateMachine', 'issue-state', 'entities.Issue.stateMachine'],
      ['sla', 'first-reply-sla', 'entities.Issue.sla'],
    ];

    ruleCases.forEach(([type, name, expectedCall]) => {
      test(`should create ${type} rule`, () => {
        const result = runCLI(`rule add ${type} ${name}`, { silent: true });

        assert.strictEqual(result.success, true, 'Command should succeed');
        assert.strictEqual(
          fileExists(`src/backend/workflows/${name}.js`),
          true,
          'Workflow rule file should be created'
        );
        assert.strictEqual(
          fileContains(`src/backend/workflows/${name}.js`, expectedCall),
          true,
          'Should contain the expected Issue rule call'
        );
      });
    });

    test('should keep legacy rule syntax as an alias', () => {
      const result = runCLI('rule onChange legacy-rule', { silent: true });

      assert.strictEqual(result.success, true, 'Command should succeed');
      assert.strictEqual(fileExists('src/backend/workflows/legacy-rule.js'), true);
      assert.strictEqual(fileContains('src/backend/workflows/legacy-rule.js', 'entities.Issue.onChange'), true);
    });

    test('should generate placeholder templates without sample business values', () => {
      const checks = [
        ['src/backend/workflows/notify-on-change.js', ['title: \'\', // TODO', 'requirements: { /* TODO: add requirements */ }'], ['Notify on change']],
        ['src/backend/workflows/weekly-digest.js', ['search: \'\', // TODO', 'cron: \'\', // TODO'], ['Weekly digest', 'State: {In Progress}', '0 0 9 ? * MON']],
        ['src/backend/workflows/apply-template.js', ['command: \'\', // TODO'], ['Apply template', 'command: \'apply-template\'']],
        ['src/backend/workflows/issue-state.js', ['fieldName: \'\', // TODO', 'states: { /* TODO: define states and transitions */ }'], ['Issue state machine', 'fieldName: \'State\'']],
        ['src/backend/workflows/first-reply-sla.js', ['title: \'\', // TODO', 'requirements: { /* TODO: add requirements */ }'], ['Response time SLA']],
      ];

      checks.forEach(([relativePath, expectedSnippets, rejectedSnippets]) => {
        const content = readFile(relativePath);

        expectedSnippets.forEach((snippet) => {
          assert.ok(content.includes(snippet), `${relativePath} should include ${snippet}`);
        });

        rejectedSnippets.forEach((snippet) => {
          assert.strictEqual(content.includes(snippet), false, `${relativePath} should not include ${snippet}`);
        });
      });
    });

    test('stateMachine should use only the basic fieldName and states template', () => {
      const content = readFile('src/backend/workflows/issue-state.js');

      assert.ok(content.includes('fieldName: \'\', // TODO: add field name'));
      assert.ok(content.includes('states: { /* TODO: define states and transitions */ }'));
      assert.strictEqual(content.includes('stateFieldName'), false);
      assert.strictEqual(content.includes('defaultMachine'), false);
      assert.strictEqual(content.includes('typeFieldName'), false);
      assert.strictEqual(content.includes('alternativeMachines'), false);
    });

    test('sla should include the lifecycle handlers', () => {
      const content = readFile('src/backend/workflows/first-reply-sla.js');

      assert.ok(content.includes('guard: (ctx) => {'));
      assert.ok(content.includes('onEnter: (ctx) => {'));
      assert.ok(content.includes('action: (ctx) => {'));
      assert.ok(content.includes('onBreach: (ctx) => {'));
    });

    test('should reject invalid rule type clearly', () => {
      const result = runCLI('rule add invalid notify-invalid', { silent: true });

      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(result.output.includes('Invalid rule type'));
      assert.ok(result.output.includes('onChange, onSchedule, action, stateMachine, sla'));
    });

    test('should reject kebab-case rule type aliases', () => {
      const onChangeResult = runCLI('rule add on-change notify-alias', { silent: true });
      const stateMachineResult = runCLI('rule add state-machine state-alias', { silent: true });

      assert.strictEqual(onChangeResult.success, false, 'on-change alias should fail');
      assert.strictEqual(stateMachineResult.success, false, 'state-machine alias should fail');
      assert.ok(onChangeResult.output.includes('Invalid rule type'));
      assert.ok(stateMachineResult.output.includes('Invalid rule type'));
    });

    test('should reject nested rule names', () => {
      const result = runCLI('rule add onChange nested/name', { silent: true });

      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(result.output.includes('Nested paths are not supported'));
      assert.strictEqual(fileExists('src/backend/workflows/nested/name.js'), false);
    });

    test('should reject rule names with file extensions', () => {
      const result = runCLI('rule add onChange notify-extension.js', { silent: true });

      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(result.output.includes('Do not include a file extension'));
    });

    test('should reject rule names with empty dashed segments', () => {
      const result = runCLI('rule add onChange bad--rule', { silent: true });

      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(result.output.includes('single hyphens'));
    });

    test('should fail when the target file already exists without overwriting it', () => {
      const relativePath = 'src/backend/workflows/existing-rule.js';
      const absolutePath = path.join(TEST_APP_DIR, relativePath);
      const originalContent = 'const existing = true;\n';
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, originalContent);

      const result = runCLI('rule add onChange existing-rule', { silent: true });

      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(result.output.includes('already exists'));
      assert.strictEqual(readFile(relativePath), originalContent);
    });

    test('should work in a minimal app directory without enhancedDX and leave manifest unchanged', () => {
      fs.rmSync(MINIMAL_APP_DIR, { recursive: true, force: true });
      fs.mkdirSync(MINIMAL_APP_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(MINIMAL_APP_DIR, 'package.json'),
        JSON.stringify({ name: 'minimal-rule-app', version: '0.0.0' }, null, 2)
      );

      const result = runCLI('rule add onChange minimal-rule', { cwd: MINIMAL_APP_DIR, silent: true });

      assert.strictEqual(result.success, true, 'Command should succeed');
      assert.strictEqual(
        fs.existsSync(path.join(MINIMAL_APP_DIR, 'src', 'backend', 'workflows', 'minimal-rule.js')),
        true
      );
      assert.strictEqual(fs.existsSync(path.join(MINIMAL_APP_DIR, 'manifest.json')), false);
    });

    test('should create only the rule scaffold in an empty directory', () => {
      fs.rmSync(EMPTY_RULE_DIR, { recursive: true, force: true });
      fs.mkdirSync(EMPTY_RULE_DIR, { recursive: true });

      const result = runCLI('rule add onChange standalone-rule', { cwd: EMPTY_RULE_DIR, silent: true });

      assert.strictEqual(result.success, true, result.output);
      assert.strictEqual(
        fs.existsSync(path.join(EMPTY_RULE_DIR, 'src', 'backend', 'workflows', 'standalone-rule.js')),
        true
      );
      assert.strictEqual(fs.existsSync(path.join(EMPTY_RULE_DIR, 'manifest.json')), false);
      assert.strictEqual(fs.existsSync(path.join(EMPTY_RULE_DIR, 'package.json')), false);
      assert.strictEqual(result.output.includes('This will generate the scaffolding for a new YouTrack app'), false);
    });

    test('initial JavaScript app template should not include feature samples', () => {
      const viteManifest = readPackageFile('_templates/init/vite-app/manifest.json.t');
      const packageJsonTemplate = readPackageFile('_templates/init/vite-app/package.json.t');
      const viteConfigTemplate = readPackageFile('_templates/init/vite-app/vite.config.ts.t');

      assert.strictEqual(viteManifest.includes('"widgets"'), false);
      assert.strictEqual(fs.existsSync(path.join(PKG_DIR, '_templates', 'init', 'vite-app', 'src', 'backend.js.t')), false);
      assert.strictEqual(fs.existsSync(path.join(PKG_DIR, '_templates', 'init', 'vite-app', 'scripts', 'build.cjs.t')), true);
      assert.strictEqual(fs.existsSync(path.join(PKG_DIR, '_templates', 'widget', 'add', 'vite.config.ts.t')), false);
      assert.ok(packageJsonTemplate.includes('"build": "node scripts/build.cjs && youtrack-app validate dist"'));
      assert.ok(viteConfigTemplate.includes('getWidgetInputs()'));
      assert.ok(viteConfigTemplate.includes('manifest.widgets'));
      assert.ok(viteConfigTemplate.includes('getStaticCopyTargets()'));
      assert.ok(viteConfigTemplate.includes('hasTopLevelFiles(resolve(__dirname, \'src\'))'));
    });

    test('no-widget build script should copy backend files and omit widgets from dist manifest', () => {
      fs.rmSync(WORKFLOW_BUILD_DIR, { recursive: true, force: true });
      fs.mkdirSync(path.join(WORKFLOW_BUILD_DIR, 'public'), { recursive: true });
      fs.mkdirSync(path.join(WORKFLOW_BUILD_DIR, 'src', 'backend', 'workflows'), { recursive: true });
      fs.mkdirSync(path.join(WORKFLOW_BUILD_DIR, 'scripts'), { recursive: true });

      fs.writeFileSync(
        path.join(WORKFLOW_BUILD_DIR, 'package.json'),
        JSON.stringify({ name: 'workflow-build-app', version: '0.0.0' }, null, 2)
      );
      fs.writeFileSync(
        path.join(WORKFLOW_BUILD_DIR, 'manifest.json'),
        JSON.stringify({
          name: 'workflow-build-app',
          icon: 'icon.svg',
        }, null, 2)
      );
      fs.writeFileSync(path.join(WORKFLOW_BUILD_DIR, 'public', 'icon.svg'), '<svg />\n');
      fs.writeFileSync(path.join(WORKFLOW_BUILD_DIR, 'src', 'backend.js'), 'exports.httpHandler = {};\n');
      fs.writeFileSync(path.join(WORKFLOW_BUILD_DIR, 'src', 'custom-handler.js'), 'exports.httpHandler = {};\n');
      fs.writeFileSync(path.join(WORKFLOW_BUILD_DIR, 'src', 'settings.json'), '{}\n');
      fs.writeFileSync(path.join(WORKFLOW_BUILD_DIR, 'src', 'entity-extensions.json'), '{"entityTypeExtensions":[]}\n');
      fs.writeFileSync(path.join(WORKFLOW_BUILD_DIR, 'src', 'backend', 'workflows', 'notify.js'), 'exports.rule = {};\n');

      const scriptTemplate = readPackageFile('_templates/init/vite-app/scripts/build.cjs.t');
      fs.writeFileSync(
        path.join(WORKFLOW_BUILD_DIR, 'scripts', 'build.cjs'),
        stripTemplateFrontmatter(scriptTemplate)
      );

      execSync('node scripts/build.cjs', { cwd: WORKFLOW_BUILD_DIR, encoding: 'utf8' });

      const distManifest = JSON.parse(fs.readFileSync(path.join(WORKFLOW_BUILD_DIR, 'dist', 'manifest.json'), 'utf8'));
      assert.strictEqual(Object.hasOwn(distManifest, 'widgets'), false);
      assert.strictEqual(fs.existsSync(path.join(WORKFLOW_BUILD_DIR, 'dist', 'notify.js')), true);
      assert.strictEqual(fs.existsSync(path.join(WORKFLOW_BUILD_DIR, 'dist', 'icon.svg')), true);
      assert.strictEqual(fs.existsSync(path.join(WORKFLOW_BUILD_DIR, 'dist', 'backend.js')), true);
      assert.strictEqual(fs.existsSync(path.join(WORKFLOW_BUILD_DIR, 'dist', 'custom-handler.js')), true);
      assert.strictEqual(fs.existsSync(path.join(WORKFLOW_BUILD_DIR, 'dist', 'settings.json')), true);
      assert.strictEqual(fs.existsSync(path.join(WORKFLOW_BUILD_DIR, 'dist', 'entity-extensions.json')), true);
    });

    test('bare command in a JavaScript app should show add-feature commands instead of scaffolding a new app', () => {
      fs.rmSync(JS_APP_MENU_DIR, { recursive: true, force: true });
      fs.mkdirSync(JS_APP_MENU_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(JS_APP_MENU_DIR, 'package.json'),
        JSON.stringify({ name: 'js-app-menu', version: '0.0.0' }, null, 2)
      );
      fs.writeFileSync(
        path.join(JS_APP_MENU_DIR, 'manifest.json'),
        JSON.stringify({ name: 'js-app-menu', title: 'JS App Menu' }, null, 2)
      );

      const result = runCLI('', { cwd: JS_APP_MENU_DIR, silent: true });

      assert.strictEqual(result.success, true, result.output);
      assert.ok(result.output.includes('existing YouTrack app'));
      assert.ok(result.output.includes('create-youtrack-app widget add'));
      assert.strictEqual(result.output.includes('This will generate the scaffolding for a new YouTrack app'), false);
    });

    test('solo command should create a JavaScript app non-interactively from flags', () => {
      fs.rmSync(NON_INTERACTIVE_CREATE_DIR, { recursive: true, force: true });
      fs.mkdirSync(NON_INTERACTIVE_CREATE_DIR, { recursive: true });

      const result = runCLI(
        '--app-name ci-js-app --title "CI JS App" --description "Created from flags" --vendor Acme --vendor-url https://example.com',
        {
          cwd: NON_INTERACTIVE_CREATE_DIR,
          silent: true,
          env: {
            ...process.env,
            NO_COLOR: '1',
            YOUTRACK_CREATE_APP_TEST_SKIP_INSTALL: '1',
          },
        }
      );

      assert.strictEqual(result.success, true, result.output);
      assert.ok(result.output.includes('Dependencies are being installed'));

      const pkg = JSON.parse(fs.readFileSync(path.join(NON_INTERACTIVE_CREATE_DIR, 'package.json'), 'utf8'));
      const manifest = JSON.parse(fs.readFileSync(path.join(NON_INTERACTIVE_CREATE_DIR, 'manifest.json'), 'utf8'));

      assert.strictEqual(pkg.name, 'ci-js-app');
      assert.strictEqual(pkg.enhancedDX, undefined);
      assert.strictEqual(manifest.name, 'ci-js-app');
      assert.strictEqual(manifest.title, 'CI JS App');
      assert.strictEqual(manifest.description, 'Created from flags');
      assert.deepStrictEqual(manifest.vendor, {
        name: 'Acme',
        url: 'https://example.com',
      });
    });

    test('solo command should reject non-interactive flags without app name unless yes is used', () => {
      fs.rmSync(NON_INTERACTIVE_INVALID_DIR, { recursive: true, force: true });
      fs.mkdirSync(NON_INTERACTIVE_INVALID_DIR, { recursive: true });

      const result = runCLI('--template js', {
        cwd: NON_INTERACTIVE_INVALID_DIR,
        silent: true,
        env: {
          ...process.env,
          NO_COLOR: '1',
          YOUTRACK_CREATE_APP_TEST_SKIP_INSTALL: '1',
        },
      });

      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(result.output.includes('--app-name is required'));
      assert.strictEqual(fs.existsSync(path.join(NON_INTERACTIVE_INVALID_DIR, 'package.json')), false);
    });

    test('unknown commands should fail instead of falling through to app scaffolding', () => {
      fs.rmSync(EMPTY_RULE_DIR, { recursive: true, force: true });
      fs.mkdirSync(EMPTY_RULE_DIR, { recursive: true });

      const result = runCLI('unknown-command', { cwd: EMPTY_RULE_DIR, silent: true });

      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(result.output.includes('Unknown command'));
      assert.strictEqual(result.output.includes('This will generate the scaffolding for a new YouTrack app'), false);
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
      const result = runCLI('property Project.rating --type integer', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const projectEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Project');
      
      assert.ok(projectEntity, 'Project entity should exist');
      assert.strictEqual(projectEntity.properties.rating.type, 'integer');
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

    test('should create multi-value property with --multi true flag', () => {
      const result = runCLI('property Issue.labels --type string --multi true', { silent: true });

      assert.strictEqual(result.success, true);

      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');

      assert.strictEqual(issueEntity.properties.labels.type, 'string');
      assert.strictEqual(issueEntity.properties.labels.multi, true, '--multi true should set multi to boolean true');
    });

    test('should store multi as boolean not string', () => {
      const result = runCLI('property Issue.score --type integer --set', { silent: true });

      assert.strictEqual(result.success, true);

      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');

      assert.strictEqual(typeof issueEntity.properties.score.multi, 'boolean', 'multi must be a boolean, not a string');
    });

    test('should create property on User entity', () => {
      const result = runCLI('property User.department --type string', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const userEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'User');
      
      assert.ok(userEntity, 'User entity should exist');
      assert.ok(userEntity.properties.department);
    });

    test('should create property on Article', () => {
      const result = runCLI('property Article.config --type string', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const articleEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Article');
      
      assert.ok(articleEntity, 'Article entity should exist');
      assert.ok(articleEntity.properties.config);
    });

    test('should work with short alias "p"', () => {
      const result = runCLI('p Issue.priority --type integer', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const issueEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Issue');
      
      assert.ok(issueEntity.properties.priority);
    });

    test('should work with short alias "prop"', () => {
      const result = runCLI('prop Article.version --type integer', { silent: true });
      
      assert.strictEqual(result.success, true);
      
      const entityExtensions = JSON.parse(readFile('src/entity-extensions.json'));
      const articleEntity = entityExtensions.entityTypeExtensions.find(e => e.entityType === 'Article');
      
      assert.ok(articleEntity.properties.version);
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

    test('should fail with clear error when entity-extensions.json has invalid JSON', () => {
      const entityExtPath = path.join(TEST_APP_DIR, 'src', 'entity-extensions.json');
      const backup = fs.readFileSync(entityExtPath, 'utf8');
      try {
        fs.writeFileSync(entityExtPath, '{ invalid json }', 'utf8');
        const result = runCLI('property Issue.invalidJsonTest --type string', { silent: true });

        assert.strictEqual(result.success, false);
        assert.ok(result.output.includes('invalid JSON') || result.output.includes('entity-extensions'));
      } finally {
        fs.writeFileSync(entityExtPath, backup, 'utf8');
      }
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
    ['string', 'integer', 'float', 'boolean', 'Issue', 'User', 'Project', 'Article'].forEach((type) => {
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
    ['Issue', 'User', 'Project', 'Article'].forEach((entity) => {
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
