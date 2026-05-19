import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { discoverWidgetEntries } from '../plugins/vite-plugin-youtrack-widget-entries.js';
import youtrackWidgetEntries from '../plugins/vite-plugin-youtrack-widget-entries.js';

type WidgetEntriesTestPlugin = {
  configResolved: (config: { root: string }) => void;
  options: (options: Record<string, unknown>) => { input?: Record<string, string> };
};

describe('discoverWidgetEntries', () => {
  let tmpDir: string;
  let widgetsDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'widget-entries-test-'));
    widgetsDir = path.join(tmpDir, 'src', 'widgets');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const createWidget = (name: string) => {
    const dir = path.join(widgetsDir, name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), '<html></html>');
    return dir;
  };

  it('returns empty object when widgets directory does not exist', () => {
    const entries = discoverWidgetEntries(widgetsDir);
    assert.deepStrictEqual(entries, {});
  });

  it('returns empty object when widgets directory is empty', () => {
    fs.mkdirSync(widgetsDir, { recursive: true });
    const entries = discoverWidgetEntries(widgetsDir);
    assert.deepStrictEqual(entries, {});
  });

  it('discovers a single widget', () => {
    createWidget('dashboard');
    const entries = discoverWidgetEntries(widgetsDir);

    assert.strictEqual(Object.keys(entries).length, 1);
    assert.ok(entries['dashboard']);
    assert.ok(entries['dashboard'].endsWith(path.join('widgets', 'dashboard', 'index.html')));
  });

  it('discovers multiple widgets', () => {
    createWidget('enhanced-dx');
    createWidget('my-panel');
    createWidget('settings-page');

    const entries = discoverWidgetEntries(widgetsDir);
    assert.strictEqual(Object.keys(entries).length, 3);
    assert.ok(entries['enhanced-dx']);
    assert.ok(entries['my-panel']);
    assert.ok(entries['settings-page']);
  });

  it('ignores directories without index.html', () => {
    createWidget('valid-widget');
    const noHtmlDir = path.join(widgetsDir, 'no-html');
    fs.mkdirSync(noHtmlDir, { recursive: true });
    fs.writeFileSync(path.join(noHtmlDir, 'app.tsx'), 'export default () => null;');

    const entries = discoverWidgetEntries(widgetsDir);
    assert.strictEqual(Object.keys(entries).length, 1);
    assert.ok(entries['valid-widget']);
    assert.ok(!entries['no-html']);
  });

  it('ignores regular files in widgets directory', () => {
    createWidget('real-widget');
    fs.writeFileSync(path.join(widgetsDir, 'README.md'), '# Widgets');

    const entries = discoverWidgetEntries(widgetsDir);
    assert.strictEqual(Object.keys(entries).length, 1);
    assert.ok(entries['real-widget']);
  });

  it('returns absolute paths', () => {
    createWidget('test-widget');
    const entries = discoverWidgetEntries(widgetsDir);
    assert.ok(path.isAbsolute(entries['test-widget']));
  });

  it('picks up newly added widgets', () => {
    createWidget('first');
    let entries = discoverWidgetEntries(widgetsDir);
    assert.strictEqual(Object.keys(entries).length, 1);

    createWidget('second');
    entries = discoverWidgetEntries(widgetsDir);
    assert.strictEqual(Object.keys(entries).length, 2);
    assert.ok(entries['second']);
  });
});

describe('youtrackWidgetEntries plugin default directory', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'widget-plugin-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('resolves default widgetsDir to <vite-root>/widgets', () => {
    // The generated vite.config sets root:'./src', so the vite root is <project>/src.
    // The default 'widgets' resolves to <project>/src/widgets — no double-src prefix.
    const viteRoot = path.join(tmpDir, 'src');
    const expectedDir = path.join(viteRoot, 'widgets');
    fs.mkdirSync(path.join(expectedDir, 'test-widget'), { recursive: true });
    fs.writeFileSync(path.join(expectedDir, 'test-widget', 'index.html'), '<html></html>');

    const plugin = youtrackWidgetEntries() as unknown as WidgetEntriesTestPlugin;
    plugin.configResolved({ root: viteRoot });
    const result = plugin.options({});

    assert.ok(
      result.input && result.input['test-widget'],
      'plugin must discover widgets under <vite-root>/widgets by default'
    );
  });

  it('respects an explicit widgetsDir option over the default', () => {
    const customDir = path.join(tmpDir, 'custom', 'widgets');
    fs.mkdirSync(path.join(customDir, 'my-widget'), { recursive: true });
    fs.writeFileSync(path.join(customDir, 'my-widget', 'index.html'), '<html></html>');

    const plugin = youtrackWidgetEntries({ widgetsDir: customDir }) as unknown as WidgetEntriesTestPlugin;
    plugin.configResolved({ root: tmpDir });
    const result = plugin.options({});

    assert.ok(
      result.input && result.input['my-widget'],
      'plugin must use the caller-supplied widgetsDir when provided'
    );
  });
});
