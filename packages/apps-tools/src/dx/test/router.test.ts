import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractPermissions, findHandlerStart, extractPreambleBlocks } from '../plugins/vite-plugin-youtrack-router.js';

describe('extractPermissions', () => {
  it('extracts permissions from a bare identifier call', () => {
    const src = `
import { withPermissions } from '@jetbrains/youtrack-apps-tools/dx/runtime';
function handle(ctx) { ctx.response.json({ ok: true }); }
export default withPermissions(handle, ['CREATE_USER']);
`;
    assert.deepStrictEqual(extractPermissions(src), ['CREATE_USER']);
  });

  it('extracts permissions from an arrow function call', () => {
    const src = `export default withPermissions((ctx) => { ctx.response.json({}); }, ['READ_ISSUE', 'UPDATE_ISSUE']);`;
    assert.deepStrictEqual(extractPermissions(src), ['READ_ISSUE', 'UPDATE_ISSUE']);
  });

  it('extracts permissions from an inline function call', () => {
    const src = `export default withPermissions(function handle(ctx) { ctx.response.json({}); }, ['DELETE_ISSUE']);`;
    assert.deepStrictEqual(extractPermissions(src), ['DELETE_ISSUE']);
  });

  it('handles double-quoted permission strings', () => {
    const src = `export default withPermissions(handle, ["CREATE_USER", "READ_ISSUE"]);`;
    assert.deepStrictEqual(extractPermissions(src), ['CREATE_USER', 'READ_ISSUE']);
  });

  it('returns empty array when no withPermissions call is present', () => {
    const src = `
export default function handle(ctx) {
  ctx.response.json({ ok: true });
}
`;
    assert.deepStrictEqual(extractPermissions(src), []);
  });

  it('returns empty array for withPermissions with empty permissions list', () => {
    const src = `export default withPermissions(handle, []);`;
    assert.deepStrictEqual(extractPermissions(src), []);
  });

  it('handles extra whitespace and newlines in the permissions array', () => {
    const src = `
export default withPermissions(handle, [
  'CREATE_USER',
  'READ_ISSUE',
]);
`;
    assert.deepStrictEqual(extractPermissions(src), ['CREATE_USER', 'READ_ISSUE']);
  });

  it('handles backtick-quoted permission strings', () => {
    const src = 'export default withPermissions(handle, [`CREATE_USER`, `READ_ISSUE`]);';
    assert.deepStrictEqual(extractPermissions(src), ['CREATE_USER', 'READ_ISSUE']);
  });
});

describe('findHandlerStart', () => {
  it('finds a plain handler function', () => {
    const lines = [
      'function handle(ctx) {',
      '  ctx.response.json({ ok: true });',
      '}',
    ];
    assert.strictEqual(findHandlerStart(lines), 0);
  });

  it('skips withPermissions and finds handle when both are present', () => {
    // Simulates Rollup inlining withPermissions before the actual handler
    const lines = [
      'function withPermissions(fn, permissions) {',
      '  fn.permissions = permissions;',
      '  return fn;',
      '}',
      'function handle(ctx) {',
      '  ctx.response.json({ ok: true });',
      '}',
    ];
    assert.strictEqual(findHandlerStart(lines), 4);
  });

  it('falls back to first non-withPermissions function when no handle is found', () => {
    const lines = [
      'function withPermissions(fn, permissions) {',
      '  return fn;',
      '}',
      'function myCustomHandler(ctx) {',
      '  ctx.response.json({});',
      '}',
    ];
    assert.strictEqual(findHandlerStart(lines), 3);
  });

  it('returns -1 when no suitable function exists', () => {
    const lines = [
      'function withPermissions(fn, permissions) {',
      '  return fn;',
      '}',
    ];
    assert.strictEqual(findHandlerStart(lines), -1);
  });

  it('returns -1 for empty input', () => {
    assert.strictEqual(findHandlerStart([]), -1);
  });

  it('ignores indented functions (non-top-level) and finds top-level handle', () => {
    const lines = [
      'function withPermissions(fn, permissions) {',
      '  function inner() {}',
      '  return fn;',
      '}',
      'function handle(ctx) {',
      '  ctx.response.json({});',
      '}',
    ];
    // inner() is indented — must not be picked up; handle() at line 4 should win
    assert.strictEqual(findHandlerStart(lines), 4);
  });

  it('skips all known utility functions (set)', () => {
    const lines = [
      'function set(entity, key, value) {',
      '  entity[key] = value;',
      '}',
      'function myHandler(ctx) {',
      '  ctx.response.json({});',
      '}',
    ];
    assert.strictEqual(findHandlerStart(lines), 3);
  });
});

describe('extractPreambleBlocks', () => {
  it('returns empty array for empty input', () => {
    assert.deepStrictEqual(extractPreambleBlocks([]), []);
  });

  it('strips Rollup boilerplate lines', () => {
    const lines = [
      '"use strict";',
      'Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });',
      'var __defProp = Object.defineProperty;',
      'const __esModule = true;',
    ];
    assert.deepStrictEqual(extractPreambleBlocks(lines), []);
  });

  it('captures a require() statement as a single-line block', () => {
    const lines = [
      '"use strict";',
      'const requirements = require("./requirements.js");',
    ];
    const blocks = extractPreambleBlocks(lines);
    assert.strictEqual(blocks.length, 1);
    assert.ok(blocks[0].includes('require("./requirements.js")'));
  });

  it('captures an inlined single-line function as one block', () => {
    const lines = [
      'function mutable(entity) { return entity; }',
    ];
    const blocks = extractPreambleBlocks(lines);
    assert.strictEqual(blocks.length, 1);
    assert.ok(blocks[0].startsWith('function mutable'));
  });

  it('captures a multi-line inlined function as one atomic block', () => {
    const lines = [
      'function mutable(entity) {',
      '    return entity;',
      '}',
    ];
    const blocks = extractPreambleBlocks(lines);
    assert.strictEqual(blocks.length, 1);
    assert.ok(blocks[0].includes('return entity'));
    // Must be stored as one string, not three separate lines
    assert.ok(blocks[0].includes('\n'));
  });

  it('captures both require() and inlined function, in order', () => {
    const lines = [
      '"use strict";',
      'const x = require("./shared.js");',
      'function mutable(entity) {',
      '    return entity;',
      '}',
    ];
    const blocks = extractPreambleBlocks(lines);
    assert.strictEqual(blocks.length, 2);
    assert.ok(blocks[0].includes('require'));
    assert.ok(blocks[1].includes('function mutable'));
  });

  it('deduplicates identical inlined functions via Set', () => {
    // Simulates two handler chunks both inlining the same mutable utility
    const lines = [
      'function mutable(entity) {',
      '    return entity;',
      '}',
    ];
    const blocksA = extractPreambleBlocks(lines);
    const blocksB = extractPreambleBlocks(lines);
    const combined = new Set([...blocksA, ...blocksB]);
    assert.strictEqual(combined.size, 1);
  });

  it('handles a multi-line function with nested braces', () => {
    const lines = [
      'function withPermissions(fn, permissions) {',
      '  try {',
      '    Object.defineProperty(fn, "permissions", { value: permissions });',
      '  } catch (e) {',
      '    fn.permissions = permissions;',
      '  }',
      '  return fn;',
      '}',
    ];
    const blocks = extractPreambleBlocks(lines);
    assert.strictEqual(blocks.length, 1);
    assert.ok(blocks[0].includes('withPermissions'));
    assert.ok(blocks[0].includes('return fn'));
  });
});
