const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const PKG_DIR = path.join(__dirname, '..');
const CLI_PATH = path.join(PKG_DIR, 'index.js');
const TEST_HOME = path.join(PKG_DIR, 'tmp', 'test-skill-home');

function runCLI(args) {
  try {
    const output = execFileSync('node', [CLI_PATH, ...args], {
      cwd: PKG_DIR,
      encoding: 'utf8',
      env: {
        ...process.env,
        YOUTRACK_SKILL_HOME: TEST_HOME,
        NO_COLOR: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return { success: true, output };
  } catch (error) {
    return {
      success: false,
      output: `${error.stdout || ''}${error.stderr || ''}`,
      error,
    };
  }
}

function targetDir(agent) {
  const parent = agent === 'codex' ? '.agents' : '.claude';
  return path.join(TEST_HOME, parent, 'skills', 'youtrack-app-builder');
}

function metadata(agent) {
  return JSON.parse(
    fs.readFileSync(path.join(targetDir(agent), '.youtrack-skill-install.json'), 'utf8')
  );
}

describe('Agent skill CLI', () => {
  beforeEach(() => {
    fs.rmSync(TEST_HOME, { recursive: true, force: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_HOME, { recursive: true, force: true });
  });

  test('skill install --agent codex copies the skill into the Codex target', () => {
    const result = runCLI(['skill', 'install', '--agent', 'codex']);

    assert.strictEqual(result.success, true, result.output);
    assert.strictEqual(fs.existsSync(path.join(targetDir('codex'), 'SKILL.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetDir('claude'), 'SKILL.md')), false);
    assert.strictEqual(metadata('codex').targetAgent, 'codex');
    assert.strictEqual(metadata('codex').sourcePackage, '@jetbrains/create-youtrack-app');
  });

  test('skill install --agent claude copies the skill into the Claude target', () => {
    const result = runCLI(['skill', 'install', '--agent', 'claude']);

    assert.strictEqual(result.success, true, result.output);
    assert.strictEqual(fs.existsSync(path.join(targetDir('claude'), 'SKILL.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetDir('codex'), 'SKILL.md')), false);
    assert.strictEqual(metadata('claude').targetAgent, 'claude');
  });

  test('skill install --agent both writes both targets', () => {
    const result = runCLI(['skill', 'install', '--agent', 'both']);

    assert.strictEqual(result.success, true, result.output);
    assert.strictEqual(fs.existsSync(path.join(targetDir('codex'), 'SKILL.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetDir('claude'), 'SKILL.md')), true);
    assert.strictEqual(metadata('codex').targetAgent, 'codex');
    assert.strictEqual(metadata('claude').targetAgent, 'claude');
  });

  test('skill install defaults to both agents', () => {
    const result = runCLI(['skill', 'install']);

    assert.strictEqual(result.success, true, result.output);
    assert.strictEqual(fs.existsSync(path.join(targetDir('codex'), 'SKILL.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetDir('claude'), 'SKILL.md')), true);
  });

  test('skill status reports installed and not installed based on metadata', () => {
    const installResult = runCLI(['skill', 'install', '--agent', 'codex']);
    assert.strictEqual(installResult.success, true, installResult.output);

    const statusResult = runCLI(['skill', 'status']);

    assert.strictEqual(statusResult.success, true, statusResult.output);
    assert.match(statusResult.output, /Codex: installed/);
    assert.match(statusResult.output, /Claude: not installed/);
  });

  test('invalid --agent fails with a clear error', () => {
    const result = runCLI(['skill', 'install', '--agent', 'cursor']);

    assert.strictEqual(result.success, false, 'Command should fail');
    assert.match(result.output, /Invalid agent: "cursor"/);
    assert.match(result.output, /codex, claude, both/);
  });
});
