import { describe, it, expect, vi, beforeEach } from 'vitest';
// @jetbrains/youtrack-scripting-api/http is stubbed by setup.js via
// Module._resolveFilename so workflow-http.js loads without YouTrack runtime.
import {
  getWebhookTargets,
  resolveTriggerSecret,
  sendWebhooks,
  logAndPostNext,
  asyncFunctions,
  MAX_WEBHOOK_URLS_PER_EVENT,
} from '../workflow-http.js';
import { createCtx } from './helpers/ctx.js';
// Reach into the CJS stub to inspect Connection instances.
import httpStub from './mocks/youtrack-http.cjs';

const { instances: httpInstances, reset: resetHttp } = httpStub;

const TOKEN = 'test-token';
const HEADER = 'X-Token';
const PAYLOAD = { event: 'test' };

// Build a triggers row. secret defaults to TOKEN. Pass secret:null to omit.
function trigger(url, event = 'issueCreated', secret = TOKEN) {
  const row = { event, url };
  if (secret !== null) {
    row.secret = secret;
  }
  return row;
}

// ── getWebhookTargets (URL list only) ─────────────────────────────────────────

describe('getWebhookTargets', () => {
  it('returns [] when triggers is absent', () => {
    expect(getWebhookTargets(createCtx({ settings: {} }), 'issueCreated')).toEqual([]);
  });

  it('returns [] when triggers is not an array', () => {
    expect(getWebhookTargets(createCtx({ settings: { triggers: 'nope' } }), 'issueCreated')).toEqual([]);
  });

  it('returns only URLs of rows matching the event type', () => {
    const ctx = createCtx({
      settings: { triggers: [trigger('https://a.com/', 'issueCreated'), trigger('https://b.com/', 'issueUpdated')] },
    });
    expect(getWebhookTargets(ctx, 'issueCreated')).toEqual(['https://a.com/']);
  });

  it('includes "allEvents" rows for any event type', () => {
    const ctx = createCtx({
      settings: { triggers: [trigger('https://a.com/', 'issueCreated'), trigger('https://all.com/', 'allEvents')] },
    });
    expect(getWebhookTargets(ctx, 'issueCreated')).toEqual(['https://a.com/', 'https://all.com/']);
  });

  it('deduplicates by URL', () => {
    const ctx = createCtx({
      settings: { triggers: [trigger('https://a.com/', 'issueCreated'), trigger('https://a.com/', 'allEvents')] },
    });
    expect(getWebhookTargets(ctx, 'issueCreated')).toEqual(['https://a.com/']);
  });

  it('trims URLs and skips blank / malformed rows', () => {
    const ctx = createCtx({
      settings: {
        triggers: [trigger('  https://a.com/  ', 'issueCreated'), trigger('', 'issueCreated'), null, { event: 'issueCreated' }],
      },
    });
    expect(getWebhookTargets(ctx, 'issueCreated')).toEqual(['https://a.com/']);
  });

  it('reads an array-LIKE settings value (index + length, not a real JS Array)', () => {
    const arrayLike = {
      0: trigger('https://a.com/', 'issueCreated'),
      1: trigger('https://b.com/', 'issueUpdated'),
      length: 2,
    };
    expect(Array.isArray(arrayLike)).toBe(false);
    const ctx = createCtx({ settings: { triggers: arrayLike } });
    expect(getWebhookTargets(ctx, 'issueCreated')).toEqual(['https://a.com/']);
  });

  it('reads a wrapper that only exposes forEach', () => {
    const rows = [trigger('https://a.com/', 'issueCreated'), trigger('https://b.com/', 'issueUpdated')];
    const wrapper = { forEach: (fn) => rows.forEach(fn) };
    const ctx = createCtx({ settings: { triggers: wrapper } });
    expect(getWebhookTargets(ctx, 'issueCreated')).toEqual(['https://a.com/']);
  });

  it('never throws when the wrapper members are inaccessible (fail closed to empty)', () => {
    const hostile = {
      get forEach() { throw new Error('Unknown identifier: forEach'); },
      get size() { throw new Error('Unknown identifier: size'); },
      get length() { throw new Error('Unknown identifier: length'); },
      [Symbol.iterator]() { throw new Error('Unknown identifier: iterator'); },
    };
    const ctx = createCtx({ settings: { triggers: hostile } });
    expect(() => getWebhookTargets(ctx, 'issueCreated')).not.toThrow();
    expect(getWebhookTargets(ctx, 'issueCreated')).toEqual([]);
  });
});

// ── resolveTriggerSecret (live secret object) ─────────────────────────────────

describe('resolveTriggerSecret', () => {
  it('returns the live secret value for a matching event + url (never stringified)', () => {
    const secretObj = { isSecret: true, toString: () => '<***>' };
    const ctx = createCtx({
      settings: { triggers: [{ event: 'issueCreated', url: 'https://a.com/', secret: secretObj }] },
    });
    // Returns the SAME object reference — http.js gets the live secret, not a string.
    expect(resolveTriggerSecret(ctx, 'issueCreated', 'https://a.com/')).toBe(secretObj);
  });

  // Precedence is list order, not specificity: the first matching row wins, so an allEvents row
  // placed above this one would be the one resolved.
  it('resolves the first matching row for the same url', () => {
    const ctx = createCtx({
      settings: {
        triggers: [
          trigger('https://a.com/', 'issueCreated', 'specific'),
          trigger('https://a.com/', 'allEvents', 'catchall'),
        ],
      },
    });
    expect(resolveTriggerSecret(ctx, 'issueCreated', 'https://a.com/')).toBe('specific');
  });

  it('matches "allEvents" rows', () => {
    const ctx = createCtx({ settings: { triggers: [trigger('https://a.com/', 'allEvents', 'catchall')] } });
    expect(resolveTriggerSecret(ctx, 'issueCreated', 'https://a.com/')).toBe('catchall');
  });

  it('returns null when the matching row has no secret', () => {
    const ctx = createCtx({ settings: { triggers: [trigger('https://a.com/', 'issueCreated', null)] } });
    expect(resolveTriggerSecret(ctx, 'issueCreated', 'https://a.com/')).toBeNull();
  });

  it('returns null when no row matches the url', () => {
    const ctx = createCtx({ settings: { triggers: [trigger('https://a.com/', 'issueCreated')] } });
    expect(resolveTriggerSecret(ctx, 'issueCreated', 'https://x.com/')).toBeNull();
  });
});

// ── sendWebhooks: sync action dispatches URL #1 with its live token ───────────

describe('sendWebhooks scheduling', () => {
  beforeEach(() => {
    resetHttp();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('dispatches URL #1 via postAsync and attaches its live token', () => {
    const ctx = createCtx({
      settings: { headerName: HEADER, triggers: [trigger('https://a.com/'), trigger('https://b.com/')] },
      asyncFunctions,
    });
    sendWebhooks(ctx, 'issueCreated', PAYLOAD, 'IssueCreated');

    expect(httpInstances).toHaveLength(1);
    const conn = httpInstances[0];
    expect(conn.url).toBe('https://a.com/');
    expect(conn.calls[0].method).toBe('postAsync');
    expect(conn.calls[0].handlerName).toBe('logAndPostNext');
    expect(conn.calls[0].payload).toBe(JSON.stringify(PAYLOAD));
    // Token resolved live from settings and passed to addHeader.
    expect(conn.headers[HEADER]).toBe(TOKEN);
  });

  it('stores only the URL queue + event type (never the secret) for the async chain', () => {
    const ctx = createCtx({
      settings: { headerName: HEADER, triggers: [trigger('https://a.com/'), trigger('https://b.com/')] },
      asyncFunctions,
    });
    sendWebhooks(ctx, 'issueCreated', PAYLOAD, 'IssueCreated');

    expect(JSON.parse(ctx._storeMap.get('webhookUrls'))).toEqual(['https://b.com/']);
    expect(ctx._storeMap.get('webhookCurrentUrl')).toBe('https://a.com/');
    expect(ctx._storeMap.get('webhookEventType')).toBe('issueCreated');
    expect(JSON.parse(ctx._storeMap.get('webhookPayload'))).toEqual(PAYLOAD);
    // The store never contains a secret in any form.
    const dump = JSON.stringify([...ctx._storeMap.entries()]);
    expect(dump).not.toContain(TOKEN);
  });

  it('does not dispatch when no triggers match the event', () => {
    const ctx = createCtx({
      settings: { headerName: HEADER, triggers: [trigger('https://a.com/', 'issueUpdated')] },
      asyncFunctions,
    });
    sendWebhooks(ctx, 'issueCreated', PAYLOAD, 'IssueCreated');
    expect(httpInstances).toHaveLength(0);
  });

  it('does not dispatch when header name is missing', () => {
    const ctx = createCtx({ settings: { triggers: [trigger('https://a.com/')] }, asyncFunctions });
    sendWebhooks(ctx, 'issueCreated', PAYLOAD, 'IssueCreated');
    expect(httpInstances).toHaveLength(0);
  });

  it('skips a matching trigger with no token (fail closed) and dispatches the next', () => {
    const ctx = createCtx({
      settings: {
        headerName: HEADER,
        triggers: [trigger('https://a.com/', 'issueCreated', null), trigger('https://b.com/')],
      },
      asyncFunctions,
    });
    sendWebhooks(ctx, 'issueCreated', PAYLOAD, 'IssueCreated');

    expect(httpInstances).toHaveLength(1);
    expect(httpInstances[0].url).toBe('https://b.com/');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('has no token configured'));
  });

  it('caps URL list at MAX_WEBHOOK_URLS_PER_EVENT and warns', () => {
    const triggers = [];
    for (let i = 0; i < MAX_WEBHOOK_URLS_PER_EVENT + 3; i++) {
      triggers.push(trigger('https://host' + i + '.example.com/'));
    }
    const ctx = createCtx({ settings: { headerName: HEADER, triggers }, asyncFunctions });
    sendWebhooks(ctx, 'issueCreated', PAYLOAD, 'IssueCreated');

    const stored = JSON.parse(ctx._storeMap.get('webhookUrls'));
    expect(stored).toHaveLength(MAX_WEBHOOK_URLS_PER_EVENT - 1);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('max is ' + MAX_WEBHOOK_URLS_PER_EVENT));
  });

  it('skips an invalid first URL synchronously and dispatches the next valid one', () => {
    const ctx = createCtx({
      settings: { headerName: HEADER, triggers: [trigger('http://10.0.0.1/'), trigger('https://b.com/')] },
      asyncFunctions,
    });
    sendWebhooks(ctx, 'issueCreated', PAYLOAD, 'IssueCreated');

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Blocked webhook to http://10.0.0.1/'));
    expect(httpInstances).toHaveLength(1);
    expect(httpInstances[0].url).toBe('https://b.com/');
  });

  it('returns silently if all URLs are invalid', () => {
    const ctx = createCtx({
      settings: { headerName: HEADER, triggers: [trigger('http://10.0.0.1/'), trigger('file:///etc/passwd')] },
      asyncFunctions,
    });
    sendWebhooks(ctx, 'issueCreated', PAYLOAD, 'IssueCreated');
    expect(httpInstances).toHaveLength(0);
  });
});

// ── logAndPostNext: response handler that logs + chains ──────────────────────

describe('logAndPostNext', () => {
  // Seeds a mid-chain ctx: settings hold the live triggers; the store holds the
  // remaining URL queue + event type (no secrets).
  function seedCtx(remainingUrls, triggers, currentUrl = 'https://a.com/') {
    const ctx = createCtx({ settings: { headerName: HEADER, triggers }, asyncFunctions });
    ctx.store('webhookUrls', JSON.stringify(remainingUrls));
    ctx.store('webhookEventType', 'issueCreated');
    ctx.store('webhookCurrentUrl', currentUrl);
    ctx.store('webhookPayload', JSON.stringify(PAYLOAD));
    ctx.store('webhookEvent', 'IssueCreated');
    return ctx;
  }

  beforeEach(() => {
    resetHttp();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('logs the successful response and dispatches the next URL with its live token', () => {
    const ctx = seedCtx(['https://b.com/'], [trigger('https://a.com/'), trigger('https://b.com/')]);
    ctx.response = { code: 200 };
    logAndPostNext(ctx);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Webhook sent successfully to https://a.com/'));
    expect(httpInstances).toHaveLength(1);
    expect(httpInstances[0].url).toBe('https://b.com/');
    expect(httpInstances[0].headers[HEADER]).toBe(TOKEN);
  });

  it('does not dispatch when the URL queue is empty', () => {
    const ctx = seedCtx([], [trigger('https://a.com/')]);
    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(httpInstances).toHaveLength(0);
  });

  it('logs an error on ctx.response.exception and still dispatches the next URL', () => {
    const ctx = seedCtx(['https://b.com/'], [trigger('https://a.com/'), trigger('https://b.com/')]);
    ctx.response = { exception: 'timeout' };
    logAndPostNext(ctx);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Webhook to https://a.com/ failed: timeout'));
    expect(httpInstances).toHaveLength(1);
    expect(httpInstances[0].url).toBe('https://b.com/');
  });

  it('warns on no-status-code response (likely timeout)', () => {
    const ctx = seedCtx([], [trigger('https://a.com/')]);
    ctx.response = { code: undefined };
    logAndPostNext(ctx);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('completed but returned no status code'));
  });

  it('shifts the dispatched URL out of the stored queue and records currentUrl', () => {
    const ctx = seedCtx(
      ['https://b.com/', 'https://c.com/'],
      [trigger('https://b.com/'), trigger('https://c.com/')],
    );
    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(JSON.parse(ctx._storeMap.get('webhookUrls'))).toEqual(['https://c.com/']);
    expect(ctx._storeMap.get('webhookCurrentUrl')).toBe('https://b.com/');
  });

  it.each([
    ['10.x RFC-1918', 'http://10.0.0.1/'],
    ['169.254.x link-local', 'http://169.254.169.254/latest/meta-data/'],
    ['file:// scheme', 'file:///etc/passwd'],
  ])('blocks %s (%s) when it is the next URL', (_label, url) => {
    const ctx = seedCtx([url], [trigger(url)]);
    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(httpInstances).toHaveLength(0);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[webhooks] Blocked webhook to'));
  });

  it('warns when an HTTP (non-HTTPS) URL is used but still dispatches it', () => {
    const ctx = seedCtx(['http://example.com/webhook'], [trigger('http://example.com/webhook')]);
    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('webhook URL uses HTTP (not HTTPS)'));
    expect(httpInstances).toHaveLength(1);
  });
});

// ── End-to-end chain progression ──────────────────────────────────────────────

describe('chain progression (sendWebhooks + logAndPostNext)', () => {
  beforeEach(() => {
    resetHttp();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('walks a 3-URL chain end-to-end, one hop per URL', () => {
    const ctx = createCtx({
      settings: {
        headerName: HEADER,
        triggers: [trigger('https://a.com/'), trigger('https://b.com/'), trigger('https://c.com/')],
      },
      asyncFunctions,
    });

    sendWebhooks(ctx, 'issueCreated', PAYLOAD, 'IssueCreated');
    expect(httpInstances).toHaveLength(1);
    expect(httpInstances[0].url).toBe('https://a.com/');

    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(httpInstances).toHaveLength(2);
    expect(httpInstances[1].url).toBe('https://b.com/');

    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(httpInstances).toHaveLength(3);
    expect(httpInstances[2].url).toBe('https://c.com/');

    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(httpInstances).toHaveLength(3);
  });

  it('attaches each URL its own live token across hops', () => {
    const ctx = createCtx({
      settings: {
        headerName: HEADER,
        triggers: [
          trigger('https://a.com/', 'issueCreated', 'token-a'),
          trigger('https://b.com/', 'issueCreated', 'token-b'),
        ],
      },
      asyncFunctions,
    });

    sendWebhooks(ctx, 'issueCreated', PAYLOAD, 'IssueCreated');
    expect(httpInstances[0].headers[HEADER]).toBe('token-a');

    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(httpInstances[1].headers[HEADER]).toBe('token-b');
  });
});

// ── Fail-closed guard when header cleared mid-chain ──────────────────────────

describe('settings-disappear-mid-chain guard', () => {
  beforeEach(() => {
    resetHttp();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it.each([
    ['empty-string header', ''],
    ['null header', null],
  ])('aborts the chain when the header becomes %s mid-chain', (_label, headerValue) => {
    const ctx = createCtx({
      settings: { headerName: HEADER, triggers: [trigger('https://a.com/'), trigger('https://b.com/')] },
      asyncFunctions,
    });

    sendWebhooks(ctx, 'issueCreated', PAYLOAD, 'IssueCreated');
    expect(httpInstances).toHaveLength(1);

    ctx.settings.headerName = headerValue;
    ctx.response = { code: 200 };
    logAndPostNext(ctx);

    expect(httpInstances).toHaveLength(1);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Header name was cleared during chain execution'));
  });
});

// ── asyncFunctions export ─────────────────────────────────────────────────────

describe('asyncFunctions export', () => {
  it('exposes logAndPostNext', () => {
    expect(typeof asyncFunctions.logAndPostNext).toBe('function');
    expect(asyncFunctions.logAndPostNext).toBe(logAndPostNext);
  });
});
