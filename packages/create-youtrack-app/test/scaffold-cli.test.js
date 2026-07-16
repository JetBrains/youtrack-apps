const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const PKG_DIR = path.join(__dirname, '..');
const CLI_PATH = path.join(PKG_DIR, 'index.js');
const SCAFFOLD_ROOT = path.join(PKG_DIR, 'tmp', 'scaffold-tests');

let seq = 0;

/**
 * Run the scaffold CLI in a fresh empty directory and return { success, output, dir }.
 * The `init` templates write to the cwd root (to: package.json), so each test gets
 * its own isolated directory.
 */
function runScaffold(args) {
  const dir = path.join(SCAFFOLD_ROOT, `app-${seq++}`);
  fs.mkdirSync(dir, { recursive: true });
  const cmd = `node "${CLI_PATH}" ${args} --cwd "${dir}"`;
  try {
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output, dir };
  } catch (error) {
    return { success: false, output: (error.stdout || '') + (error.stderr || ''), dir, error };
  }
}

function readJson(dir, rel) {
  return JSON.parse(fs.readFileSync(path.join(dir, rel), 'utf8'));
}

function exists(dir, rel) {
  return fs.existsSync(path.join(dir, rel));
}

function readFile(dir, rel) {
  return fs.readFileSync(path.join(dir, rel), 'utf8');
}

describe('Non-interactive scaffold gate (--name)', () => {
  before(() => {
    fs.rmSync(SCAFFOLD_ROOT, { recursive: true, force: true });
    fs.mkdirSync(SCAFFOLD_ROOT, { recursive: true });
  });

  after(() => {
    fs.rmSync(SCAFFOLD_ROOT, { recursive: true, force: true });
  });

  describe('Enhanced DX (ts / default)', () => {
    test('scaffolds an Enhanced DX app and skips install with --no-install', () => {
      const { success, dir } = runScaffold('--name my-app --type ts --no-install');

      assert.strictEqual(success, true, 'Command should succeed');
      assert.ok(exists(dir, 'package.json'), 'package.json created');
      assert.ok(exists(dir, 'manifest.json'), 'manifest.json created');
      assert.ok(exists(dir, 'src/widgets/enhanced-dx/app.tsx'), 'enhanced-dx widget scaffolded');
      assert.ok(exists(dir, 'src/workflows/notify-on-change.ts'), 'sample workflows scaffolded under src/workflows');
      assert.ok(!exists(dir, 'src/backend/workflows/notify-on-change.ts'), 'sample workflows should not be scaffolded under src/backend/workflows');

      const pkg = readJson(dir, 'package.json');
      assert.strictEqual(pkg.name, 'my-app', 'package name maps from --name');
      assert.strictEqual(pkg.enhancedDX, 'true', 'ts template is Enhanced DX');

      const backendConfig = readFile(dir, 'vite.config.backend.ts');
      assert.ok(backendConfig.includes("{ src: 'src/workflows' }"), 'backend build should bundle src/workflows');

      assert.ok(!exists(dir, 'node_modules'), '--no-install must skip dependency install');
    });

    test('defaults --type to ts when omitted', () => {
      const { success, dir } = runScaffold('--name default-type --no-install');

      assert.strictEqual(success, true);
      const pkg = readJson(dir, 'package.json');
      assert.strictEqual(pkg.enhancedDX, 'true', 'omitting --type defaults to Enhanced DX (ts)');
    });

    test('derives title from name and applies default description/vendor', () => {
      const { success, dir } = runScaffold('--name my-cool-app --no-install');

      assert.strictEqual(success, true);
      const manifest = readJson(dir, 'manifest.json');
      assert.strictEqual(manifest.title, 'My Cool App', 'title derived by title-casing hyphen segments');
      assert.strictEqual(manifest.description, 'A YouTrack app created with TypeScript');
      assert.strictEqual(manifest.vendor.name, 'VendorName');
      assert.strictEqual(manifest.vendor.url, 'https://vendor.com');
    });

    test('honors explicit --title, --description, --vendor, --vendor-url', () => {
      const { success, dir } = runScaffold(
        '--name flags-app --no-install --title "Custom Title" --description "Custom desc" --vendor "Acme" --vendor-url "https://acme.test"'
      );

      assert.strictEqual(success, true);
      const manifest = readJson(dir, 'manifest.json');
      assert.strictEqual(manifest.title, 'Custom Title');
      assert.strictEqual(manifest.description, 'Custom desc');
      assert.strictEqual(manifest.vendor.name, 'Acme');
      assert.strictEqual(manifest.vendor.url, 'https://acme.test');
    });
  });

  describe('JavaScript (js)', () => {
    test('scaffolds a vite-app when --type js', () => {
      const { success, dir } = runScaffold('--name js-app --type js --no-install');

      assert.strictEqual(success, true);
      assert.ok(exists(dir, 'package.json'), 'package.json created');
      assert.ok(exists(dir, 'manifest.json'), 'manifest.json created');

      const pkg = readJson(dir, 'package.json');
      assert.strictEqual(pkg.name, 'js-app');
      assert.notStrictEqual(pkg.enhancedDX, 'true', 'js template is not Enhanced DX');

      const manifest = readJson(dir, 'manifest.json');
      assert.strictEqual(manifest.description, 'A YouTrack app created with JavaScript');

      const pkgScripts = readJson(dir, 'package.json').scripts;
      assert.ok(pkgScripts['copy:dist'].includes('src/workflows/*.js'), 'copy:dist should copy workflow files');
      assert.ok(pkgScripts['copy:dist'].includes(' dist/'), 'copy:dist should copy workflows to dist root');

      const viteConfig = readFile(dir, 'vite.config.ts');
      assert.ok(viteConfig.includes("src: 'workflows/*.js'"), 'vite build should copy workflows from src/workflows');
    });
  });

  describe('Validation', () => {
    test('rejects an invalid app name', () => {
      const { success, output } = runScaffold('--name "Bad Name" --no-install');

      assert.strictEqual(success, false, 'Command should fail');
      assert.ok(output.includes('Invalid app name'), 'Should show invalid app name error');
    });

    test('rejects a name starting with a digit', () => {
      const { success, output } = runScaffold('--name 1app --no-install');

      assert.strictEqual(success, false);
      assert.ok(output.includes('Invalid app name'));
    });

    test('rejects an invalid --type', () => {
      const { success, output } = runScaffold('--name typed-app --type python --no-install');

      assert.strictEqual(success, false, 'Command should fail');
      assert.ok(output.includes('Invalid type'), 'Should show invalid type error');
    });
  });

  describe('Backward compatibility', () => {
    test('subcommands still take precedence over the --name gate', () => {
      // `widget --key ... --name ...` must scaffold a widget, never trigger the app gate.
      const indexContent = fs.readFileSync(CLI_PATH, 'utf8');
      const gateIdx = indexContent.indexOf('Non-interactive scaffold gate');
      const widgetIdx = indexContent.indexOf("const widgetIndex = normalizedArgv.findIndex");
      assert.ok(widgetIdx !== -1 && gateIdx !== -1);
      assert.ok(widgetIdx < gateIdx, 'widget handling must appear before the scaffold gate');
    });
  });
});
