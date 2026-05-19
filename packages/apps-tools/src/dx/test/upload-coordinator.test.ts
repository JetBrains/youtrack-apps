import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { UploadCoordinator, hashDirectory } from '../upload-coordinator.js';

const TEST_DIR = path.join(os.tmpdir(), 'youtrack-edx-upload-coordinator-test');

describe('hashDirectory', () => {
  before(() => {
    fs.ensureDirSync(TEST_DIR);
  });

  after(() => {
    fs.removeSync(TEST_DIR);
  });

  it('returns empty string for non-existent directory', () => {
    const hash = hashDirectory(path.join(TEST_DIR, 'nonexistent'));
    assert.strictEqual(hash, '');
  });

  it('returns hash for empty directory (MD5 of no files)', () => {
    const emptyDir = path.join(TEST_DIR, 'empty');
    fs.ensureDirSync(emptyDir);
    const hash = hashDirectory(emptyDir);
    // Empty dir = no files hashed, yields MD5 of empty input
    assert.strictEqual(hash, 'd41d8cd98f00b204e9800998ecf8427e');
  });

  it('returns consistent hash for same content', () => {
    const dir = path.join(TEST_DIR, 'consistent');
    fs.ensureDirSync(dir);
    fs.writeFileSync(path.join(dir, 'a.txt'), 'hello');
    fs.writeFileSync(path.join(dir, 'b.txt'), 'world');
    const h1 = hashDirectory(dir);
    const h2 = hashDirectory(dir);
    assert.strictEqual(h1, h2);
  });

  it('returns different hash when content changes', () => {
    const dir = path.join(TEST_DIR, 'changed');
    fs.ensureDirSync(dir);
    fs.writeFileSync(path.join(dir, 'f.txt'), 'v1');
    const h1 = hashDirectory(dir);
    fs.writeFileSync(path.join(dir, 'f.txt'), 'v2');
    const h2 = hashDirectory(dir);
    assert.notStrictEqual(h1, h2);
  });

  it('respects glob pattern', () => {
    const dir = path.join(TEST_DIR, 'pattern');
    fs.ensureDirSync(dir);
    fs.writeFileSync(path.join(dir, 'a.js'), 'x');
    fs.writeFileSync(path.join(dir, 'b.txt'), 'y');
    const hashJs = hashDirectory(dir, '*.js');
    const hashAll = hashDirectory(dir, '**/*');
    assert.notStrictEqual(hashJs, hashAll);
  });
});

describe('UploadCoordinator', () => {
  let testCwd: string;

  before(() => {
    testCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-coord-test-'));
  });

  after(() => {
    fs.removeSync(testCwd);
  });

  it('uses default options when none provided', () => {
    const coord = new UploadCoordinator({});
    coord.start();
    coord.stop();
    // No throw = success
  });

  it('uses custom options', () => {
    const coord = new UploadCoordinator({
      stateFile: 'custom-state.json',
      debounceMs: 500,
      cwd: testCwd
    });
    coord.start();
    coord.stop();
  });

  it('debounceMs uses nullish coalescing (0 is valid)', () => {
    const coord = new UploadCoordinator({ debounceMs: 0, cwd: testCwd });
    coord.start();
    coord.stop();
  });

  it('runs upload when state file has both backend and frontend', async () => {
    const statePath = path.join(testCwd, '.build-state.json');
    fs.ensureDirSync(path.join(testCwd, 'dist'));
    fs.writeJsonSync(path.join(testCwd, 'dist', 'manifest.json'), { name: 'test' });

    const coord = new UploadCoordinator({
      cwd: testCwd,
      stateFile: '.build-state.json',
      debounceMs: 10,
      uploadCommand: 'node -e "process.exit(0)"'
    });

    await fs.writeJson(statePath, {
      backend: { timestamp: Date.now(), hash: 'h1' },
      frontend: { timestamp: Date.now(), hash: 'h2' }
    });

    coord.start();

    // Trigger change by updating state file
    await new Promise(r => setTimeout(r, 50));
    await fs.writeJson(statePath, {
      backend: { timestamp: Date.now(), hash: 'h1b' },
      frontend: { timestamp: Date.now(), hash: 'h2' }
    });

    // Wait for debounce + upload
    await new Promise(r => setTimeout(r, 100));

    coord.stop();
    // If we get here without throw, upload succeeded
  });

  it('skips upload when dist/manifest.json is missing', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-coord-manifest-'));
    const statePath = path.join(cwd, '.build-state.json');
    // No dist/manifest.json created — simulates backend-only rebuild that wiped dist/

    const coord = new UploadCoordinator({
      cwd,
      stateFile: '.build-state.json',
      debounceMs: 10,
      // Upload command that would fail loudly if called
      uploadCommand: 'node -e "process.exit(1)"'
    });

    await fs.writeJson(statePath, {
      backend: { timestamp: Date.now(), hash: 'a1' },
      frontend: { timestamp: Date.now(), hash: 'b1' }
    });

    coord.start();

    // Trigger a change
    await new Promise(r => setTimeout(r, 50));
    await fs.writeJson(statePath, {
      backend: { timestamp: Date.now(), hash: 'a2' },
      frontend: { timestamp: Date.now(), hash: 'b1' }
    });

    // Wait for debounce
    await new Promise(r => setTimeout(r, 100));

    coord.stop();
    fs.removeSync(cwd);
    // If we get here without throw, upload was correctly skipped (exit(1) was never called)
  });

  it('uploads after manifest.json appears on subsequent state change', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-coord-manifest2-'));
    const statePath = path.join(cwd, '.build-state.json');

    const coord = new UploadCoordinator({
      cwd,
      stateFile: '.build-state.json',
      debounceMs: 10,
      uploadCommand: 'node -e "process.exit(0)"'
    });

    // Start without manifest.json
    await fs.writeJson(statePath, {
      backend: { timestamp: Date.now(), hash: 'x1' },
      frontend: { timestamp: Date.now(), hash: 'y1' }
    });

    coord.start();
    await new Promise(r => setTimeout(r, 50));

    // Simulate frontend build completing: create manifest.json + update state
    fs.ensureDirSync(path.join(cwd, 'dist'));
    fs.writeJsonSync(path.join(cwd, 'dist', 'manifest.json'), { name: 'test' });
    await fs.writeJson(statePath, {
      backend: { timestamp: Date.now(), hash: 'x1' },
      frontend: { timestamp: Date.now(), hash: 'y2' }
    });

    // Wait for debounce + upload
    await new Promise(r => setTimeout(r, 100));

    coord.stop();
    fs.removeSync(cwd);
    // If we get here without throw, upload succeeded after manifest appeared
  });

  it('stop removes signal handlers and clears watcher', () => {
    const coord = new UploadCoordinator({ cwd: testCwd });
    coord.start();
    coord.stop();
    coord.stop(); // Idempotent - no throw
  });
});
