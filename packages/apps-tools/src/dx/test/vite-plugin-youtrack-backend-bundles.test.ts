import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  discoverBundleEntries,
  checkForCollisions,
  createBundleDirWatcher,
} from '../plugins/vite-plugin-youtrack-backend-bundles.js';

describe('discoverBundleEntries', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backend-bundles-test-'));
    fs.mkdirSync(path.join(tmpDir, 'src/backend/workflows'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'src/backend/workflows/notify.ts'), '');
    fs.writeFileSync(path.join(tmpDir, 'src/backend/workflows/sla-breach.ts'), '');
    fs.mkdirSync(path.join(tmpDir, 'src/backend/ai-tools'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'src/backend/ai-tools/summarize.ts'), '');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('emits one entry per .ts file; baseName is the leaf filename stem', () => {
    const entries = discoverBundleEntries(
      [{ src: 'src/backend/workflows' }, { src: 'src/backend/ai-tools' }],
      tmpDir
    );
    const baseNames = entries.map(e => e.baseName).sort();
    assert.deepEqual(baseNames, ['notify', 'sla-breach', 'summarize']);
  });

  it('id is the absolute path to the .ts source file', () => {
    const entries = discoverBundleEntries([{ src: 'src/backend/workflows' }], tmpDir);
    const ids = entries.map(e => e.id).sort();
    assert.deepEqual(ids, [
      path.join(tmpDir, 'src/backend/workflows/notify.ts'),
      path.join(tmpDir, 'src/backend/workflows/sla-breach.ts'),
    ]);
  });

  it('silently skips a directory that does not exist', () => {
    const entries = discoverBundleEntries([{ src: 'src/backend/nonexistent' }], tmpDir);
    assert.equal(entries.length, 0);
  });

  it('baseName for a nested file is the leaf filename stem only', () => {
    fs.mkdirSync(path.join(tmpDir, 'src/backend/workflows/issue'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'src/backend/workflows/issue/triage.ts'), '');
    const entries = discoverBundleEntries([{ src: 'src/backend/workflows' }], tmpDir);
    const baseNames = entries.map(e => e.baseName).sort();
    assert.deepEqual(baseNames, ['notify', 'sla-breach', 'triage']);
  });

  it('ignores .d.ts files', () => {
    fs.writeFileSync(path.join(tmpDir, 'src/backend/workflows/types.d.ts'), '');
    const entries = discoverBundleEntries([{ src: 'src/backend/workflows' }], tmpDir);
    assert.ok(!entries.some(e => e.baseName === 'types'), 'should not include .d.ts files');
    assert.ok(!entries.some(e => e.id.endsWith('.d.ts')), 'id should not point to .d.ts files');
  });
});

describe('createBundleDirWatcher', () => {
  let tmpDir: string;
  let sentinel: string;

  // Resolves when sentinel content changes, rejects after timeoutMs.
  function waitForBump(timeoutMs = 5000): Promise<void> {
    const before = fs.readFileSync(sentinel, 'utf-8');
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeoutMs;
      const poll = () => {
        if (fs.readFileSync(sentinel, 'utf-8') !== before) return resolve();
        if (Date.now() >= deadline) return reject(new Error('sentinel not bumped within timeout'));
        setTimeout(poll, 50);
      };
      setTimeout(poll, 50);
    });
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-watcher-test-'));
    sentinel = path.join(tmpDir, 'sentinel');
    fs.writeFileSync(sentinel, '0');
    // Simulate a fresh scaffold: src/backend/ exists, configured subdirs do not
    fs.mkdirSync(path.join(tmpDir, 'src/backend'), { recursive: true });
  });

  afterEach(async () => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('bumps sentinel when a .ts file is created in a pre-existing configured dir', async () => {
    fs.mkdirSync(path.join(tmpDir, 'src/backend/workflows'));
    const watcher = createBundleDirWatcher(
      [{ src: 'src/backend/workflows' }], tmpDir, () => fs.writeFileSync(sentinel, String(Date.now()))
    );
    assert.ok(watcher, 'watcher should be created');
    await new Promise(r => watcher!.once('ready', r));
    await new Promise(r => setTimeout(r, 200));

    fs.writeFileSync(path.join(tmpDir, 'src/backend/workflows/notify.ts'), '');
    await waitForBump();
    await watcher!.close();
  });

  it('bumps sentinel when a .ts file is created in a dir that did not exist at startup', async () => {
    const watcher = createBundleDirWatcher(
      [{ src: 'src/backend/ai-tools' }], tmpDir, () => fs.writeFileSync(sentinel, String(Date.now()))
    );
    assert.ok(watcher, 'watcher should be created');
    await new Promise(r => watcher!.once('ready', r));
    await new Promise(r => setTimeout(r, 200));

    fs.mkdirSync(path.join(tmpDir, 'src/backend/ai-tools'));
    fs.writeFileSync(path.join(tmpDir, 'src/backend/ai-tools/summarize.ts'), '');
    await waitForBump();
    await watcher!.close();
  });

  it('bumps sentinel when a .ts file is deleted from a configured dir', async () => {
    fs.mkdirSync(path.join(tmpDir, 'src/backend/workflows'));
    fs.writeFileSync(path.join(tmpDir, 'src/backend/workflows/notify.ts'), '');
    const watcher = createBundleDirWatcher(
      [{ src: 'src/backend/workflows' }], tmpDir, () => fs.writeFileSync(sentinel, String(Date.now()))
    );
    assert.ok(watcher, 'watcher should be created');
    await new Promise(r => watcher!.once('ready', r));
    await new Promise(r => setTimeout(r, 200));

    fs.rmSync(path.join(tmpDir, 'src/backend/workflows/notify.ts'));
    await waitForBump();
    await watcher!.close();
  });

  it('bumps sentinel when a new configured dir is created (addDir)', async () => {
    const watcher = createBundleDirWatcher(
      [{ src: 'src/backend/imports' }], tmpDir, () => fs.writeFileSync(sentinel, String(Date.now()))
    );
    assert.ok(watcher, 'watcher should be created');
    await new Promise(r => watcher!.once('ready', r));
    await new Promise(r => setTimeout(r, 200));

    fs.mkdirSync(path.join(tmpDir, 'src/backend/imports'));
    await waitForBump();
    await watcher!.close();
  });

  it('does not bump sentinel for non-.ts files', async () => {
    fs.mkdirSync(path.join(tmpDir, 'src/backend/workflows'));
    const bumped = { value: false };
    const watcher = createBundleDirWatcher(
      [{ src: 'src/backend/workflows' }], tmpDir, () => { bumped.value = true; }
    );
    assert.ok(watcher, 'watcher should be created');
    await new Promise(r => watcher!.once('ready', r));

    fs.writeFileSync(path.join(tmpDir, 'src/backend/workflows/README.md'), '');
    await new Promise(r => setTimeout(r, 500));
    assert.equal(bumped.value, false, 'should not bump for non-.ts files');
    await watcher!.close();
  });

  it('does not bump sentinel for .d.ts files', async () => {
    fs.mkdirSync(path.join(tmpDir, 'src/backend/workflows'));
    const bumped = { value: false };
    const watcher = createBundleDirWatcher(
      [{ src: 'src/backend/workflows' }], tmpDir, () => { bumped.value = true; }
    );
    assert.ok(watcher, 'watcher should be created');
    await new Promise(r => watcher!.once('ready', r));

    const dtsFile = path.join(tmpDir, 'src/backend/workflows/types.d.ts');
    fs.writeFileSync(dtsFile, '');
    await new Promise(r => setTimeout(r, 500));
    assert.equal(bumped.value, false, 'should not bump on .d.ts add');

    fs.rmSync(dtsFile);
    await new Promise(r => setTimeout(r, 500));
    assert.equal(bumped.value, false, 'should not bump on .d.ts unlink');

    await watcher!.close();
  });

  it('returns null when no configured dirs have any existing ancestor below cwd', () => {
    const watcher = createBundleDirWatcher(
      [{ src: 'src/backend/workflows' }],
      path.join(tmpDir, 'src/backend/workflows'),
      () => {}
    );
    assert.equal(watcher, null);
  });
});

describe('checkForCollisions', () => {
  it('does not throw when all baseNames are unique', () => {
    assert.doesNotThrow(() =>
      checkForCollisions([
        { id: '/abs/workflows/notify.ts', baseName: 'notify' },
        { id: '/abs/ai-tools/summarize.ts', baseName: 'summarize' },
      ])
    );
  });

  it('throws a clear error on basename collision across dirs', () => {
    assert.throws(
      () =>
        checkForCollisions([
          { id: '/abs/workflows/notify.ts', baseName: 'notify' },
          { id: '/abs/ai-tools/notify.ts', baseName: 'notify' },
        ]),
      (err: Error) => {
        assert.ok(err.message.includes("basename collision: 'notify'"));
        assert.ok(err.message.includes('/abs/workflows/notify.ts'));
        assert.ok(err.message.includes('/abs/ai-tools/notify.ts'));
        return true;
      }
    );
  });

  it('throws on collision within the same configured dir (different subdirs)', () => {
    assert.throws(
      () =>
        checkForCollisions([
          { id: '/abs/workflows/triage.ts', baseName: 'triage' },
          { id: '/abs/workflows/issue/triage.ts', baseName: 'triage' },
        ]),
      (err: Error) => {
        assert.ok(err.message.includes("basename collision: 'triage'"));
        return true;
      }
    );
  });
});
