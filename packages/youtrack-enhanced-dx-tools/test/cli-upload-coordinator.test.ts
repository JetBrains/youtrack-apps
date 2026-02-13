import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import fs from 'fs-extra';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.join(__dirname, '..');
const CLI_PATH = path.join(PKG_ROOT, 'dist', 'cli', 'upload-coordinator.js');

describe('youtrack-upload-coordinator CLI', () => {
  let testCwd: string;

  before(() => {
    testCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-cli-test-'));
  });

  after(() => {
    fs.removeSync(testCwd);
  });

  it('--help prints usage and exits 0', () => {
    const result = spawnSync('node', [CLI_PATH, '--help'], {
      encoding: 'utf8',
      cwd: testCwd
    });
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('Usage:'));
    assert.ok(result.stdout.includes('--watch'));
    assert.ok(result.stdout.includes('--debounce'));
  });

  it('-h prints usage and exits 0', () => {
    const result = spawnSync('node', [CLI_PATH, '-h'], {
      encoding: 'utf8',
      cwd: testCwd
    });
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('Usage:'));
  });

  it('starts with --watch and --debounce without consuming flags as values', () => {
    // Regression: --watch without value must not consume --debounce as the file path
    const statePath = path.join(testCwd, '.build-state.json');
    fs.writeJsonSync(statePath, {
      backend: { timestamp: Date.now(), hash: 'a' },
      frontend: { timestamp: Date.now(), hash: 'b' }
    });

    const result = spawnSync('node', [
      CLI_PATH,
      '--watch',
      '.build-state.json',
      '--debounce',
      '500'
    ], {
      encoding: 'utf8',
      cwd: testCwd,
      timeout: 1500
    });

    const output = (result.stdout || '') + (result.stderr || '');
    // Should have started and logged debounce 500ms (not 1000 default)
    assert.ok(output.includes('500'), 'Expected debounce 500 in output');
    // Timeout kills with SIGTERM, so status may be non-zero
    assert.ok(result.status === 0 || result.signal === 'SIGTERM');
  });
});
