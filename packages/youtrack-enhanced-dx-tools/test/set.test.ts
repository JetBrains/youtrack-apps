import { describe, it } from 'node:test';
import assert from 'node:assert';
import { set } from '../src/utility/set.js';
import type { Issue, State, User, Project } from '../src/types/youtrack-types.js';

// ─── Simulated extension-property types ──────────────────────────────
// These mirror what vite-plugin-youtrack-extension-properties generates
// from entity-extensions.json at build time.

interface ExtendedIssue extends Issue {
  readonly State?: State;
  readonly Assignee?: User;
  readonly Priority?: number;
  readonly Verified?: boolean;
  readonly RelatedIssues?: Set<Issue>;
}

interface ExtendedProject extends Project {
  readonly Lead?: User;
  readonly Budget?: number;
}

// ─── Runtime behaviour ───────────────────────────────────────────────

describe('set — runtime', () => {
  it('assigns a base entity field (summary)', () => {
    const issue = { summary: 'old' } as unknown as ExtendedIssue;
    set(issue, 'summary', 'new');
    assert.strictEqual((issue as Record<string, unknown>).summary, 'new');
  });

  it('assigns an extension property field (State)', () => {
    const stateValue = { name: 'In Progress', isResolved: false } as unknown as State;
    const issue = {} as unknown as ExtendedIssue;
    set(issue, 'State', stateValue);
    assert.strictEqual((issue as Record<string, unknown>).State, stateValue);
  });

  it('assigns a numeric extension property (Priority)', () => {
    const issue = { Priority: 1 } as unknown as ExtendedIssue;
    set(issue, 'Priority', 3);
    assert.strictEqual((issue as Record<string, unknown>).Priority, 3);
  });

  it('assigns a boolean extension property (Verified)', () => {
    const issue = { Verified: false } as unknown as ExtendedIssue;
    set(issue, 'Verified', true);
    assert.strictEqual((issue as Record<string, unknown>).Verified, true);
  });

  it('assigns an entity-typed extension property (Assignee)', () => {
    const user = { login: 'dev' } as unknown as User;
    const issue = {} as unknown as ExtendedIssue;
    set(issue, 'Assignee', user);
    assert.strictEqual((issue as Record<string, unknown>).Assignee, user);
  });

  it('assigns a Set extension property (RelatedIssues)', () => {
    const related = new Set<Issue>();
    const issue = {} as unknown as ExtendedIssue;
    set(issue, 'RelatedIssues', related);
    assert.strictEqual((issue as Record<string, unknown>).RelatedIssues, related);
  });

  it('assigns null to a nullable field', () => {
    const issue = { description: 'text' } as unknown as ExtendedIssue;
    set(issue, 'description', null);
    assert.strictEqual((issue as Record<string, unknown>).description, null);
  });

  it('assigns an unknown dynamic field via the extension overload', () => {
    const issue = {} as unknown as ExtendedIssue;
    set(issue, 'SomeCustomField', 'value');
    assert.strictEqual((issue as Record<string, unknown>).SomeCustomField, 'value');
  });

  it('mutates the original entity in place', () => {
    const issue = { summary: 'before' } as unknown as ExtendedIssue;
    const ref = issue;
    set(issue, 'summary', 'after');
    assert.strictEqual(ref, issue);
    assert.strictEqual((ref as Record<string, unknown>).summary, 'after');
  });

  it('does not affect unrelated fields', () => {
    const issue = { summary: 'keep', description: 'keep' } as unknown as ExtendedIssue;
    set(issue, 'summary', 'changed');
    assert.strictEqual((issue as Record<string, unknown>).description, 'keep');
  });

  it('works with a different entity type (Project)', () => {
    const user = { login: 'lead' } as unknown as User;
    const project = {} as unknown as ExtendedProject;
    set(project, 'Lead', user);
    set(project, 'Budget', 50000);
    assert.strictEqual((project as Record<string, unknown>).Lead, user);
    assert.strictEqual((project as Record<string, unknown>).Budget, 50000);
  });
});

// ─── Compile-time type safety ────────────────────────────────────────
// These tests verify that the TypeScript compiler rejects invalid usage.
// Each @ts-expect-error must sit directly above a line that WOULD fail
// without it — if the line compiles cleanly, the test itself errors.

describe('set — type constraints (compile-time)', () => {
  it('rejects wrong type for a known base field', () => {
    const issue = {} as ExtendedIssue;
    // @ts-expect-error — summary is string, not number
    set(issue, 'summary', 42);
  });

  it('rejects wrong type for a numeric extension field', () => {
    const issue = {} as ExtendedIssue;
    // @ts-expect-error — Priority is number, not boolean
    set(issue, 'Priority', true);
  });

  it('rejects wrong type for a boolean extension field', () => {
    const issue = {} as ExtendedIssue;
    // @ts-expect-error — Verified is boolean, not number
    set(issue, 'Verified', 42);
  });

  it('rejects wrong entity type for an extension field', () => {
    const issue = {} as ExtendedIssue;
    const project = {} as Project;
    // @ts-expect-error — Assignee is User, not Project
    set(issue, 'Assignee', project);
  });

  it('rejects wrong type for a Set extension field', () => {
    const issue = {} as ExtendedIssue;
    // @ts-expect-error — RelatedIssues is Set<Issue>, not string
    set(issue, 'RelatedIssues', 'not a set');
  });

  it('accepts correct types without error', () => {
    const issue = {} as ExtendedIssue;
    const state = {} as State;
    const user = {} as User;

    // All of these must compile cleanly
    set(issue, 'summary', 'valid string');
    set(issue, 'State', state);
    set(issue, 'Assignee', user);
    set(issue, 'Priority', 1);
    set(issue, 'Verified', true);
    set(issue, 'RelatedIssues', new Set<Issue>());
  });
});
