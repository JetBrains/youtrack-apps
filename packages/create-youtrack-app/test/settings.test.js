const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const PKG_DIR = path.join(__dirname, '..');
const TEST_APP_DIR = path.join(PKG_DIR, 'tmp', 'test-settings-app');
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

function setupTestApp() {
  if (fs.existsSync(TEST_APP_DIR)) {
    fs.rmSync(TEST_APP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(TEST_APP_DIR, 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(TEST_APP_DIR, 'package.json'),
    JSON.stringify({ name: 'test-settings-app', version: '0.0.0', enhancedDX: 'true' }, null, 2)
  );
}

function cleanupTestApp() {
  if (fs.existsSync(TEST_APP_DIR)) {
    fs.rmSync(TEST_APP_DIR, { recursive: true, force: true });
  }
}

// ============================================================
// App Settings
// ============================================================

describe('App Settings', () => {
  before(() => {
    setupTestApp();
  });

  after(() => {
    cleanupTestApp();
  });

  // ── settings init ────────────────────────────────────────────────────────

  describe('settings init', () => {
    test('should create settings.json with title and description', () => {
      const result = runCLI('settings init --title "Test Settings" --description "Test description"', { silent: true });

      assert.strictEqual(result.success, true, 'Command should succeed');
      assert.strictEqual(fileExists('src/settings.json'), true, 'settings.json should be created');

      const schema = JSON.parse(readFile('src/settings.json'));
      assert.strictEqual(schema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(schema.type, 'object');
      assert.strictEqual(schema.title, 'Test Settings');
      assert.strictEqual(schema.description, 'Test description');
      assert.ok(typeof schema.properties === 'object');
      assert.ok(Array.isArray(schema.required));
    });

    test('should create empty properties and required arrays', () => {
      const schema = JSON.parse(readFile('src/settings.json'));

      assert.strictEqual(Object.keys(schema.properties).length, 0, 'properties should be empty initially');
      assert.strictEqual(schema.required.length, 0, 'required should be empty initially');
    });

    test('should fail if settings.json already exists', () => {
      const result = runCLI('settings init --title "Duplicate" --description "Should fail"', { silent: true });

      assert.strictEqual(result.success, false, 'Command should fail');
      assert.ok(result.output.includes('already exists'), 'Should show "already exists" error');
    });

    test('should work with "setting" alias', () => {
      const settingsPath = path.join(TEST_APP_DIR, 'src', 'settings.json');
      if (fs.existsSync(settingsPath)) fs.unlinkSync(settingsPath);

      const result = runCLI('setting init --title "Alias Test" --description "Testing alias"', { silent: true });

      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/settings.json'), true);
      assert.strictEqual(JSON.parse(readFile('src/settings.json')).title, 'Alias Test');
    });

    test('should work with "s" short alias', () => {
      const settingsPath = path.join(TEST_APP_DIR, 'src', 'settings.json');
      if (fs.existsSync(settingsPath)) fs.unlinkSync(settingsPath);

      const result = runCLI('s init --title "Short Alias" --description "Testing short"', { silent: true });

      assert.strictEqual(result.success, true);
      assert.strictEqual(fileExists('src/settings.json'), true);
      assert.strictEqual(JSON.parse(readFile('src/settings.json')).title, 'Short Alias');
    });

    test('should handle titles with special characters', () => {
      const settingsPath = path.join(TEST_APP_DIR, 'src', 'settings.json');
      if (fs.existsSync(settingsPath)) fs.unlinkSync(settingsPath);

      const result = runCLI("settings init --title \"My App's Settings\" --description \"Configuration for app\"", { silent: true });

      assert.strictEqual(result.success, true);
      assert.strictEqual(JSON.parse(readFile('src/settings.json')).title, "My App's Settings");
    });

    test('alias mapping should exist in source code', () => {
      const indexContent = fs.readFileSync(path.join(PKG_DIR, 'index.js'), 'utf8');

      assert.ok(indexContent.includes("'s': 'settings'"), 's alias should be mapped to settings');
      assert.ok(indexContent.includes("'setting': 'settings'"), 'setting alias should be mapped to settings');
    });
  });

  // ── settings add ─────────────────────────────────────────────────────────

  describe('settings add', () => {
    const SETTINGS_REL = 'src/settings.json';

    function readSettings() {
      return JSON.parse(readFile(SETTINGS_REL));
    }

    function resetSettings() {
      const p = path.join(TEST_APP_DIR, SETTINGS_REL);
      if (fs.existsSync(p)) fs.unlinkSync(p);
      runCLI('settings init --title "Add Tests" --description "for add tests"', { silent: true });
    }

    before(resetSettings);

    // ── Basic types ────────────────────────────────────────────────────────

    test('should add a minimal string property (only --name and --type)', () => {
      const result = runCLI('settings add --name apiKey --type string', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const schema = readSettings();
      assert.ok(schema.properties.apiKey, 'property should exist');
      assert.strictEqual(schema.properties.apiKey.type, 'string');
    });

    test('should add an integer property', () => {
      const result = runCLI('settings add --name retryCount --type integer', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.retryCount.type, 'integer');
    });

    test('should add a number property', () => {
      const result = runCLI('settings add --name threshold --type number', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.threshold.type, 'number');
    });

    test('should add a boolean property', () => {
      const result = runCLI('settings add --name enabled --type boolean', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.enabled.type, 'boolean');
    });

    test('should add an object property with --entity', () => {
      const result = runCLI('settings add --name linkedIssue --type object --entity Issue', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const prop = readSettings().properties.linkedIssue;
      assert.strictEqual(prop.type, 'object');
      assert.strictEqual(prop['x-entity'], 'Issue');
    });

    test('should add an array property with --entity stored under items', () => {
      const result = runCLI('settings add --name reviewers --type array --entity User', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const prop = readSettings().properties.reviewers;
      assert.strictEqual(prop.type, 'array');
      assert.ok(prop.items, 'items should be set');
      assert.strictEqual(prop.items['x-entity'], 'User');
    });

    test('should add an object property without --entity (x-entity omitted)', () => {
      const result = runCLI('settings add --name rawConfig --type object', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const prop = readSettings().properties.rawConfig;
      assert.strictEqual(prop.type, 'object');
      assert.strictEqual(prop['x-entity'], undefined, 'x-entity should not be set when --entity is omitted');
    });

    // ── Metadata ───────────────────────────────────────────────────────────

    test('should set title on the property', () => {
      const result = runCLI('settings add --name serverUrl --type string --title "Server URL"', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.serverUrl.title, 'Server URL');
    });

    test('should set description on the property', () => {
      const result = runCLI('settings add --name timeout --type integer --description "Request timeout in ms"', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.timeout.description, 'Request timeout in ms');
    });

    // ── Scope ──────────────────────────────────────────────────────────────

    test('should set x-scope: global with --scope global', () => {
      const result = runCLI('settings add --name globalToken --type string --scope global', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.globalToken['x-scope'], 'global');
    });

    test('should set x-scope: project with --scope project', () => {
      const result = runCLI('settings add --name projectLabel --type string --scope project', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.projectLabel['x-scope'], 'project');
    });

    test('should omit x-scope when --scope none', () => {
      const result = runCLI('settings add --name noScopeProp --type string --scope none', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.noScopeProp['x-scope'], undefined, 'x-scope should not be set');
    });

    test('should omit x-scope when --scope is not provided', () => {
      const result = runCLI('settings add --name unscoped --type boolean', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.unscoped['x-scope'], undefined, 'x-scope should not be set by default');
    });

    // ── Required ───────────────────────────────────────────────────────────

    test('should add property name to required[] with --required', () => {
      const result = runCLI('settings add --name mandatoryField --type string --required', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const schema = readSettings();
      assert.ok(schema.properties.mandatoryField, 'property should exist');
      assert.ok(Array.isArray(schema.required));
      assert.ok(schema.required.includes('mandatoryField'), 'property name should be in required[]');
    });

    test('should not add to required[] without --required', () => {
      const result = runCLI('settings add --name optionalField --type string', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.ok(!readSettings().required.includes('optionalField'), 'property name should NOT be in required[]');
    });

    // ── String constraints ─────────────────────────────────────────────────

    test('should set minLength on string property', () => {
      const result = runCLI('settings add --name token --type string --min-length 10', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.token.minLength, 10);
    });

    test('should set maxLength on string property', () => {
      const result = runCLI('settings add --name shortCode --type string --max-length 8', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.shortCode.maxLength, 8);
    });

    test('should set format on string property', () => {
      const result = runCLI('settings add --name email --type string --format email', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.email.format, 'email');
    });

    test('should set enum values on string property as an array', () => {
      const result = runCLI('settings add --name status --type string --enum "active,inactive,pending"', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.deepStrictEqual(readSettings().properties.status.enum, ['active', 'inactive', 'pending']);
    });

    test('should handle enum values with spaces after commas', () => {
      const result = runCLI('settings add --name level --type string --enum "low, medium, high"', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.deepStrictEqual(readSettings().properties.level.enum, ['low', 'medium', 'high']);
    });

    // ── Numeric constraints ────────────────────────────────────────────────

    test('should set minimum and maximum on integer property', () => {
      const result = runCLI('settings add --name port --type integer --min 1 --max 65535', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const prop = readSettings().properties.port;
      assert.strictEqual(prop.minimum, 1);
      assert.strictEqual(prop.maximum, 65535);
    });

    test('should set minimum and maximum on number property', () => {
      const result = runCLI('settings add --name ratio --type number --min 0 --max 1', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const prop = readSettings().properties.ratio;
      assert.strictEqual(prop.minimum, 0);
      assert.strictEqual(prop.maximum, 1);
    });

    test('should set exclusiveMinimum with --exclusive-min', () => {
      const result = runCLI('settings add --name positiveCount --type integer --exclusive-min 0', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const prop = readSettings().properties.positiveCount;
      assert.strictEqual(prop.exclusiveMinimum, 0);
      assert.strictEqual(prop.minimum, undefined, 'minimum should not be set when exclusive');
    });

    test('should set exclusiveMaximum with --exclusive-max', () => {
      const result = runCLI('settings add --name strictMax --type integer --exclusive-max 100', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const prop = readSettings().properties.strictMax;
      assert.strictEqual(prop.exclusiveMaximum, 100);
      assert.strictEqual(prop.maximum, undefined, 'maximum should not be set when exclusive');
    });

    test('should set exclusiveMaximum when the value is 0 (falsy)', () => {
      const result = runCLI('settings add --name belowZero --type integer --exclusive-max 0', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const prop = readSettings().properties.belowZero;
      assert.strictEqual(prop.exclusiveMaximum, 0, 'exclusiveMaximum 0 must not be dropped as falsy');
      assert.strictEqual(prop.maximum, undefined);
    });

    test('should set multipleOf on number property', () => {
      const result = runCLI('settings add --name step --type number --multiple-of 0.5', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.step.multipleOf, 0.5);
    });

    // ── Boolean flags ──────────────────────────────────────────────────────

    test('should set readOnly: true with --readonly', () => {
      const result = runCLI('settings add --name appVersion --type string --readonly', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.appVersion.readOnly, true);
    });

    test('should set const value (string) with --readonly --const', () => {
      const result = runCLI('settings add --name buildEnv --type string --readonly --const production', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const prop = readSettings().properties.buildEnv;
      assert.strictEqual(prop.readOnly, true);
      assert.strictEqual(prop.const, 'production');
    });

    test('should set const value (number) with --readonly --const on integer', () => {
      const result = runCLI('settings add --name maxConnections --type integer --readonly --const 10', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const prop = readSettings().properties.maxConnections;
      assert.strictEqual(prop.readOnly, true);
      assert.strictEqual(prop.const, 10);
    });

    test('should set writeOnly: true with --write-only', () => {
      const result = runCLI('settings add --name secretKey --type string --write-only', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.strictEqual(readSettings().properties.secretKey.writeOnly, true);
    });

    // ── Compound scenarios ─────────────────────────────────────────────────

    test('should combine scope, required, title, and description', () => {
      const result = runCLI(
        'settings add --name baseUrl --type string --title "Base URL" --description "API base" --scope global --required',
        { silent: true }
      );
      assert.strictEqual(result.success, true, result.output);

      const schema = readSettings();
      const prop = schema.properties.baseUrl;
      assert.strictEqual(prop.type, 'string');
      assert.strictEqual(prop.title, 'Base URL');
      assert.strictEqual(prop.description, 'API base');
      assert.strictEqual(prop['x-scope'], 'global');
      assert.ok(schema.required.includes('baseUrl'));
    });

    test('should combine string constraints with scope and required', () => {
      const result = runCLI(
        'settings add --name slug --type string --min-length 3 --max-length 50 --format slug --scope project --required',
        { silent: true }
      );
      assert.strictEqual(result.success, true, result.output);

      const schema = readSettings();
      const prop = schema.properties.slug;
      assert.strictEqual(prop.minLength, 3);
      assert.strictEqual(prop.maxLength, 50);
      assert.strictEqual(prop.format, 'slug');
      assert.strictEqual(prop['x-scope'], 'project');
      assert.ok(schema.required.includes('slug'));
    });

    test('should preserve existing properties when adding a new one', () => {
      const existingKeys = Object.keys(readSettings().properties);

      const result = runCLI('settings add --name newPropCheck --type boolean', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const schemaAfter = readSettings();
      for (const key of existingKeys) {
        assert.ok(schemaAfter.properties[key], `existing property "${key}" should still be present`);
      }
    });

    // ── All valid types ────────────────────────────────────────────────────

    for (const type of ['string', 'integer', 'number', 'boolean', 'object', 'array']) {
      test(`should accept type "${type}"`, () => {
        const result = runCLI(`settings add --name typeTest_${type} --type ${type}`, { silent: true });
        assert.strictEqual(result.success, true, result.output);

        assert.strictEqual(readSettings().properties[`typeTest_${type}`].type, type);
      });
    }

    // ── All valid entity values ────────────────────────────────────────────

    for (const entity of ['Issue', 'User', 'Project', 'UserGroup', 'Article']) {
      test(`should accept --entity ${entity} on object type`, () => {
        const result = runCLI(`settings add --name entityTest_${entity} --type object --entity ${entity}`, { silent: true });
        assert.strictEqual(result.success, true, result.output);

        assert.strictEqual(readSettings().properties[`entityTest_${entity}`]['x-entity'], entity);
      });
    }

    // ── All valid scopes ───────────────────────────────────────────────────

    for (const scope of ['global', 'project', 'none']) {
      test(`should accept --scope ${scope}`, () => {
        const result = runCLI(`settings add --name scopeTest_${scope} --type string --scope ${scope}`, { silent: true });
        assert.strictEqual(result.success, true, result.output);

        const prop = readSettings().properties[`scopeTest_${scope}`];
        if (scope === 'none') {
          assert.strictEqual(prop['x-scope'], undefined);
        } else {
          assert.strictEqual(prop['x-scope'], scope);
        }
      });
    }

    // ── Aliases ────────────────────────────────────────────────────────────

    test('should work with "setting add" alias', () => {
      const result = runCLI('setting add --name aliasSettingProp --type string', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.ok(readSettings().properties.aliasSettingProp);
    });

    test('should work with "s add" short alias', () => {
      const result = runCLI('s add --name aliasShortProp --type integer', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      assert.ok(readSettings().properties.aliasShortProp);
    });

    // ── Error cases ────────────────────────────────────────────────────────

    test('should fail when --name is missing', () => {
      const result = runCLI('settings add --type string', { silent: true });
      assert.strictEqual(result.success, false, 'Command should fail without --name');
      assert.ok(result.output.includes('--name'), 'Error should mention --name');
    });

    test('should fail when --type is missing', () => {
      const result = runCLI('settings add --name noType', { silent: true });
      assert.strictEqual(result.success, false, 'Command should fail without --type');
      assert.ok(result.output.includes('--type'), 'Error should mention --type');
    });

    test('should fail with an invalid --type value', () => {
      const result = runCLI('settings add --name badType --type uuid', { silent: true });
      assert.strictEqual(result.success, false, 'Command should fail with invalid type');
      assert.ok(
        result.output.includes('Invalid type') || result.output.includes('--type'),
        'Error should describe the problem'
      );
    });

    test('should fail with an invalid --entity value', () => {
      const result = runCLI('settings add --name badEntity --type object --entity FakeEntity', { silent: true });
      assert.strictEqual(result.success, false, 'Command should fail with unrecognised entity');
      assert.ok(
        result.output.includes('Invalid entity') || result.output.includes('--entity'),
        'Error should describe the problem'
      );
    });

    test('should fail when --entity is used with a non-object/array type', () => {
      const result = runCLI('settings add --name stringWithEntity --type string --entity Issue', { silent: true });
      assert.strictEqual(result.success, false, '--entity on a non-object/array type should be rejected');
    });

    test('should fail with an invalid --scope value', () => {
      const result = runCLI('settings add --name badScope --type string --scope universe', { silent: true });
      assert.strictEqual(result.success, false, 'Command should fail with invalid scope');
      assert.ok(
        result.output.includes('Invalid scope') || result.output.includes('--scope'),
        'Error should describe the problem'
      );
    });

    test('should fail when settings.json does not exist', () => {
      const p = path.join(TEST_APP_DIR, SETTINGS_REL);
      const backup = fs.readFileSync(p, 'utf8');

      try {
        fs.unlinkSync(p);
        const result = runCLI('settings add --name orphan --type string', { silent: true });
        assert.strictEqual(result.success, false, 'Command should fail when settings.json is absent');
        assert.ok(
          result.output.includes('settings.json') || result.output.includes('not found') || result.output.includes('does not exist'),
          'Error should mention settings.json'
        );
      } finally {
        fs.writeFileSync(p, backup, 'utf8');
      }
    });

    test('should fail when property name already exists', () => {
      runCLI('settings add --name duplicate --type string', { silent: true });
      const result = runCLI('settings add --name duplicate --type integer', { silent: true });

      assert.strictEqual(result.success, false, 'Second add with same name should fail');
      assert.ok(
        result.output.includes('already exists') || result.output.includes('duplicate'),
        'Error should indicate the conflict'
      );
    });

    test('should accept property names starting with a digit (valid JSON key)', () => {
      const result = runCLI('settings add --name 1badName --type string', { silent: true });
      assert.strictEqual(result.success, true, 'Names starting with digits are valid JSON keys and should be accepted');
      assert.ok(readSettings().properties['1badName']);
    });

    test('should fail with invalid property name (contains spaces)', () => {
      const result = runCLI('settings add --name "bad name" --type string', { silent: true });
      assert.strictEqual(result.success, false, 'Names with spaces should be rejected');
    });

    test('should accept kebab-case property names', () => {
      const result = runCLI('settings add --name api-token --type string', { silent: true });
      assert.strictEqual(result.success, true, 'Kebab-case names are valid JSON keys and should be accepted');
      assert.ok(readSettings().properties['api-token']);
    });

    test('should accept dot-notation property names', () => {
      const result = runCLI('settings add --name oauth.clientId --type string', { silent: true });
      assert.strictEqual(result.success, true, 'Dot-notation names are valid JSON keys and should be accepted');
      assert.ok(readSettings().properties['oauth.clientId']);
    });

    test('should set const value (boolean false) with --readonly --const false', () => {
      const result = runCLI('settings add --name featureFlag --type boolean --readonly --const false', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const prop = readSettings().properties.featureFlag;
      assert.strictEqual(prop.readOnly, true);
      assert.strictEqual(prop.const, false, 'boolean false must not be stored as the string "false"');
    });

    test('should set const value (boolean true) with --readonly --const true', () => {
      const result = runCLI('settings add --name featureEnabled --type boolean --readonly --const true', { silent: true });
      assert.strictEqual(result.success, true, result.output);

      const prop = readSettings().properties.featureEnabled;
      assert.strictEqual(prop.readOnly, true);
      assert.strictEqual(prop.const, true, 'boolean true must not be stored as the string "true"');
    });
  });
});
