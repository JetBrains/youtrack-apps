const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const PKG_DIR = path.join(__dirname, '..');
const TEST_APP_DIR = path.join(PKG_DIR, 'tmp', 'test-widget-app');
const CLI_PATH = path.join(PKG_DIR, 'index.js');

function runCLI(args, options = {}) {
  const cwd = options.cwd || TEST_APP_DIR;
  const cmd = `node "${CLI_PATH}" ${args} --cwd "${cwd}"`;

  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.stdout || error.stderr || '', error };
  }
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(TEST_APP_DIR, relativePath));
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(TEST_APP_DIR, relativePath), 'utf8');
}

function fileContains(relativePath, text) {
  try {
    return readFile(relativePath).includes(text);
  } catch {
    return false;
  }
}

function readManifest() {
  return JSON.parse(readFile('manifest.json'));
}

function setupTestApp() {
  if (fs.existsSync(TEST_APP_DIR)) {
    fs.rmSync(TEST_APP_DIR, { recursive: true, force: true });
  }

  fs.mkdirSync(path.join(TEST_APP_DIR, 'src', 'widgets'), { recursive: true });

  fs.writeFileSync(
    path.join(TEST_APP_DIR, 'package.json'),
    JSON.stringify({ name: 'test-widget-app', version: '0.0.0', enhancedDX: 'true' }, null, 2)
  );

  fs.writeFileSync(
    path.join(TEST_APP_DIR, 'manifest.json'),
    JSON.stringify({ name: 'test-widget-app', widgets: [] }, null, 2)
  );

  // Minimal vite.config.ts — the injection template searches for this exact comment
  fs.writeFileSync(
    path.join(TEST_APP_DIR, 'vite.config.ts'),
    [
      "import { resolve } from 'path';",
      '',
      'export default {',
      '  build: {',
      '    rollupOptions: {',
      '      input: {',
      '        // List every widget entry point here',
      '      }',
      '    }',
      '  }',
      '};',
      '',
    ].join('\n')
  );
}

function cleanupTestApp() {
  if (fs.existsSync(TEST_APP_DIR)) {
    fs.rmSync(TEST_APP_DIR, { recursive: true, force: true });
  }
}

// All 15 valid extension points (sourced from _templates/widget/add/index.js)
const EXTENSION_POINTS = [
  'ADMINISTRATION_MENU_ITEM',
  'ARTICLE_ABOVE_ACTIVITY_STREAM',
  'ARTICLE_OPTIONS_MENU_ITEM',
  'DASHBOARD_WIDGET',
  'HELPDESK_CHANNEL',
  'ISSUE_ABOVE_ACTIVITY_STREAM',
  'ISSUE_BELOW_SUMMARY',
  'ISSUE_FIELD_PANEL_FIRST',
  'ISSUE_FIELD_PANEL_LAST',
  'ISSUE_OPTIONS_MENU_ITEM',
  'MAIN_MENU_ITEM',
  'MARKDOWN',
  'PROJECT_SETTINGS',
  'USER_CARD',
  'USER_PROFILE_SETTINGS',
];

// ============================================================
// Widget Generator
// ============================================================

describe('Widget Generator', () => {
  before(() => {
    console.log('Setting up widget test environment...');
    setupTestApp();
  });

  after(() => {
    console.log('Cleaning up widget test environment...');
    cleanupTestApp();
  });

  // ── Basic file creation ────────────────────────────────────────────────────

  describe('Basic Widget Creation', () => {
    test('should create all expected widget files', () => {
      const result = runCLI('widget --key basic-widget --extension-point DASHBOARD_WIDGET', { silent: true });

      assert.strictEqual(result.success, true, `Command should succeed. Output: ${result.output}`);
      assert.strictEqual(fileExists('src/widgets/basic-widget/index.html'), true, 'index.html should be created');
      assert.strictEqual(fileExists('src/widgets/basic-widget/index.tsx'), true, 'index.tsx should be created');
      assert.strictEqual(fileExists('src/widgets/basic-widget/widget-icon.svg'), true, 'widget-icon.svg should be created');
    });

    test('should inject widget entry into manifest.json', () => {
      const manifest = readManifest();
      const widget = manifest.widgets.find(w => w.key === 'basic-widget');

      assert.ok(widget, 'Widget should be present in manifest.json');
      assert.strictEqual(widget.extensionPoint, 'DASHBOARD_WIDGET');
      assert.strictEqual(widget.indexPath, 'basic-widget/index.html');
      assert.strictEqual(widget.iconPath, 'basic-widget/widget-icon.svg');
    });

    test('should inject widget entry point into vite.config.ts', () => {
      assert.strictEqual(
        fileContains('vite.config.ts', 'basicWidget:'),
        true,
        'vite.config.ts should contain camelCase widget entry key'
      );
      assert.strictEqual(
        fileContains('vite.config.ts', 'src/widgets/basic-widget/index.html'),
        true,
        'vite.config.ts should contain the widget index path'
      );
    });
  });

  // ── Widget naming ──────────────────────────────────────────────────────────

  describe('Widget Naming', () => {
    test('should default name to titleized key when --name is omitted', () => {
      const result = runCLI('widget --key auto-named-widget --extension-point MAIN_MENU_ITEM', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const widget = readManifest().widgets.find(w => w.key === 'auto-named-widget');
      assert.ok(widget, 'Widget should be in manifest');
      assert.strictEqual(widget.name, 'Auto Named Widget');
    });

    test('should use explicit --name when provided', () => {
      const result = runCLI('widget --key named-widget --name "My Custom Name" --extension-point DASHBOARD_WIDGET', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const widget = readManifest().widgets.find(w => w.key === 'named-widget');
      assert.ok(widget, 'Widget should be in manifest');
      assert.strictEqual(widget.name, 'My Custom Name');
    });
  });

  // ── Description ────────────────────────────────────────────────────────────

  describe('Widget Description', () => {
    test('should set description in manifest when --description is provided', () => {
      const result = runCLI(
        'widget --key described-widget --extension-point ISSUE_BELOW_SUMMARY --description "Shows issue metrics"',
        { silent: true }
      );
      assert.strictEqual(result.success, true, result.output);

      const widget = readManifest().widgets.find(w => w.key === 'described-widget');
      assert.ok(widget, 'Widget should be in manifest');
      assert.strictEqual(widget.description, 'Shows issue metrics');
    });
  });

  // ── Permissions ────────────────────────────────────────────────────────────

  describe('Widget Permissions', () => {
    test('should set permissions array in manifest when --permissions is provided', () => {
      const result = runCLI(
        'widget --key perms-widget --extension-point DASHBOARD_WIDGET --permissions READ_ISSUE,UPDATE_ISSUE',
        { silent: true }
      );
      assert.strictEqual(result.success, true, result.output);

      const widget = readManifest().widgets.find(w => w.key === 'perms-widget');
      assert.ok(widget, 'Widget should be in manifest');
      assert.ok(Array.isArray(widget.permissions), 'permissions should be an array');
      assert.ok(widget.permissions.includes('READ_ISSUE'), 'Should include READ_ISSUE');
      assert.ok(widget.permissions.includes('UPDATE_ISSUE'), 'Should include UPDATE_ISSUE');
    });

    test('should not set permissions property when --permissions is not provided', () => {
      // basic-widget was created without permissions
      const widget = readManifest().widgets.find(w => w.key === 'basic-widget');
      assert.ok(widget, 'Widget should be in manifest');
      assert.strictEqual(widget.permissions, undefined, 'permissions should be absent when not provided');
    });
  });

  // ── Dimensions ─────────────────────────────────────────────────────────────

  describe('Widget Dimensions', () => {
    test('should set expectedDimensions in manifest when --width and --height are provided', () => {
      const result = runCLI(
        'widget --key dims-widget --extension-point DASHBOARD_WIDGET --width 800 --height 600',
        { silent: true }
      );
      assert.strictEqual(result.success, true, result.output);

      const widget = readManifest().widgets.find(w => w.key === 'dims-widget');
      assert.ok(widget, 'Widget should be in manifest');
      assert.ok(widget.expectedDimensions, 'expectedDimensions should be set');
      assert.strictEqual(widget.expectedDimensions.width, 800);
      assert.strictEqual(widget.expectedDimensions.height, 600);
    });

    test('should not set expectedDimensions when --width and --height are not provided', () => {
      const widget = readManifest().widgets.find(w => w.key === 'basic-widget');
      assert.ok(widget, 'Widget should be in manifest');
      assert.strictEqual(widget.expectedDimensions, undefined, 'expectedDimensions should be absent when not provided');
    });
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  describe('Error Handling', () => {
    test('should fail when --extension-point is missing', () => {
      const result = runCLI('widget --key no-ep-widget', { silent: true });
      assert.strictEqual(result.success, false, 'Command should fail without --extension-point');
      assert.ok(
        result.output.includes('extension-point') || result.output.includes('extensionPoint'),
        `Error should mention extension-point. Output: ${result.output}`
      );
    });

    test('should fail with invalid extension point', () => {
      const result = runCLI('widget --key invalid-ep-widget --extension-point INVALID_POINT', { silent: true });
      assert.strictEqual(result.success, false, 'Command should fail with invalid extension point');
      assert.ok(
        result.output.includes('Invalid extension point') || result.output.includes('INVALID_POINT'),
        `Error should describe the problem. Output: ${result.output}`
      );
    });

    test('should fail with invalid key format (contains spaces)', () => {
      const result = runCLI('widget --key "bad key" --extension-point DASHBOARD_WIDGET', { silent: true });
      assert.strictEqual(result.success, false, 'Command should fail with key containing spaces');
    });

    test('should fail with key starting with a digit', () => {
      const result = runCLI('widget --key 1bad-key --extension-point DASHBOARD_WIDGET', { silent: true });
      assert.strictEqual(result.success, false, 'Command should fail with key starting with a digit');
    });

    test('should fail with key containing uppercase letters', () => {
      const result = runCLI('widget --key MyWidget --extension-point DASHBOARD_WIDGET', { silent: true });
      assert.strictEqual(result.success, false, 'Command should fail with key containing uppercase');
    });
  });

  // ── Regression guards ──────────────────────────────────────────────────────

  describe('Regression Guards', () => {
    test('widget interception should use normalizedArgv', () => {
      const indexContent = fs.readFileSync(path.join(PKG_DIR, 'index.js'), 'utf8');
      assert.ok(
        indexContent.includes("normalizedArgv.findIndex(a => a === 'widget')"),
        'Widget interception should search normalizedArgv for alias-safety'
      );
    });
  });

  // ── All valid extension points ─────────────────────────────────────────────

  describe('All Extension Points', () => {
    EXTENSION_POINTS.forEach((ep, i) => {
      test(`should accept extension point ${ep}`, () => {
        const key = `ep-test-${i}`;
        const result = runCLI(`widget --key ${key} --extension-point ${ep}`, { silent: true });

        assert.strictEqual(result.success, true, `Should succeed for ${ep}. Output: ${result.output}`);

        const widget = readManifest().widgets.find(w => w.key === key);
        assert.ok(widget, `Widget "${key}" should be in manifest`);
        assert.strictEqual(widget.extensionPoint, ep);
      });
    });
  });
});
