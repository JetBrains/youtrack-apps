import { describe, it, expect, vi, beforeEach } from 'vitest';
// @jetbrains/youtrack-scripting-api/http is stubbed by setup.js via
// Module._resolveFilename so workflow-http.js loads without YouTrack runtime.
import {
  parseWebhookUrls,
  sendWebhooks,
  logAndPostNext,
  asyncFunctions,
  MAX_WEBHOOK_URLS_PER_EVENT,
} from '../workflow-http.js';
import { createCtx } from './helpers/ctx.js';
// Reach into the CJS stub to inspect Connection instances.
import httpStub from './mocks/youtrack-http.cjs';

const { instances: httpInstances, reset: resetHttp } = httpStub;

// ── parseWebhookUrls ──────────────────────────────────────────────────────────

describe('parseWebhookUrls', () => {
  it('returns [] for empty string', () => {
    expect(parseWebhookUrls('')).toEqual([]);
  });

  it('returns [] for null', () => {
    expect(parseWebhookUrls(null)).toEqual([]);
  });

  it('returns [] for undefined', () => {
    expect(parseWebhookUrls(undefined)).toEqual([]);
  });

  it('returns [] for a non-string', () => {
    expect(parseWebhookUrls(42)).toEqual([]);
  });

  it('parses a single URL', () => {
    expect(parseWebhookUrls('https://example.com/hook')).toEqual([
      'https://example.com/hook',
    ]);
  });

  it('splits on commas', () => {
    expect(parseWebhookUrls('https://a.com/,https://b.com/')).toEqual([
      'https://a.com/',
      'https://b.com/',
    ]);
  });

  it('splits on newlines', () => {
    expect(parseWebhookUrls('https://a.com/\nhttps://b.com/')).toEqual([
      'https://a.com/',
      'https://b.com/',
    ]);
  });

  it('trims whitespace from each URL', () => {
    expect(parseWebhookUrls('  https://a.com/  ,  https://b.com/  ')).toEqual([
      'https://a.com/',
      'https://b.com/',
    ]);
  });

  it('filters out blank entries', () => {
    expect(parseWebhookUrls('https://a.com/,,\n\nhttps://b.com/')).toEqual([
      'https://a.com/',
      'https://b.com/',
    ]);
  });
});

// ── sendWebhooks: sync action dispatches URL #1 directly via postAsync ───────

describe('sendWebhooks scheduling', () => {
  const TOKEN = 'test-token';
  const HEADER = 'X-Token';
  const PAYLOAD = { event: 'test' };

  beforeEach(() => {
    resetHttp();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('dispatches URL #1 via postAsync with logAndPostNext as response handler', () => {
    const ctx = createCtx({
      settings: {
        webhookToken: TOKEN,
        headerName: HEADER,
        webhooksOnIssueCreated: 'https://a.com/,https://b.com/',
      },
      asyncFunctions,
    });
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'IssueCreated');

    expect(httpInstances).toHaveLength(1);
    const conn = httpInstances[0];
    expect(conn.url).toBe('https://a.com/');
    expect(conn.calls).toHaveLength(1);
    expect(conn.calls[0].method).toBe('postAsync');
    expect(conn.calls[0].handlerName).toBe('logAndPostNext');
    expect(conn.calls[0].payload).toBe(JSON.stringify(PAYLOAD));
  });

  it('stores remaining URL list, payload, and current URL for the async chain', () => {
    const ctx = createCtx({
      settings: {
        webhookToken: TOKEN,
        headerName: HEADER,
        webhooksOnIssueCreated: 'https://a.com/,https://b.com/',
      },
      asyncFunctions,
    });
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'IssueCreated');

    // URL #1 dispatched; URL #2 remains in store.
    expect(JSON.parse(ctx._storeMap.get('webhookUrls'))).toEqual([
      'https://b.com/',
    ]);
    expect(ctx._storeMap.get('webhookCurrentUrl')).toBe('https://a.com/');
    expect(JSON.parse(ctx._storeMap.get('webhookPayload'))).toEqual(PAYLOAD);
    expect(ctx._storeMap.get('webhookEvent')).toBe('IssueCreated');
    // Token and headerName are intentionally NOT in ctx.store — they're
    // read from ctx.settings on each hop to avoid SecretAttributeValue
    // toString() coercion. See workflow-http.js comment above STORE_URLS.
    expect(ctx._storeMap.has('webhookToken')).toBe(false);
    expect(ctx._storeMap.has('webhookHeader')).toBe(false);
  });

  it('does not dispatch when no URLs are configured', () => {
    const ctx = createCtx({
      settings: { webhookToken: TOKEN, headerName: HEADER },
      asyncFunctions,
    });
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'IssueCreated');
    expect(httpInstances).toHaveLength(0);
  });

  it('does not dispatch when token is missing', () => {
    const ctx = createCtx({
      settings: {
        headerName: HEADER,
        webhooksOnIssueCreated: 'https://a.com/',
      },
      asyncFunctions,
    });
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'IssueCreated');
    expect(httpInstances).toHaveLength(0);
  });

  it('does not dispatch when header name is missing', () => {
    const ctx = createCtx({
      settings: {
        webhookToken: TOKEN,
        webhooksOnIssueCreated: 'https://a.com/',
      },
      asyncFunctions,
    });
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'IssueCreated');
    expect(httpInstances).toHaveLength(0);
  });

  it('caps URL list at MAX_WEBHOOK_URLS_PER_EVENT and warns', () => {
    const urls = [];
    for (let i = 0; i < MAX_WEBHOOK_URLS_PER_EVENT + 3; i++) {
      urls.push('https://host' + i + '.example.com/');
    }
    const ctx = createCtx({
      settings: {
        webhookToken: TOKEN,
        headerName: HEADER,
        webhooksOnIssueCreated: urls.join(','),
      },
      asyncFunctions,
    });
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'IssueCreated');

    // URL #1 dispatched, URLs #2..MAX remain in store, URLs beyond MAX dropped.
    const stored = JSON.parse(ctx._storeMap.get('webhookUrls'));
    expect(stored).toHaveLength(MAX_WEBHOOK_URLS_PER_EVENT - 1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('max is ' + MAX_WEBHOOK_URLS_PER_EVENT),
    );
  });

  it('skips an invalid first URL synchronously and dispatches the next valid one (no async hop consumed)', () => {
    const ctx = createCtx({
      settings: {
        webhookToken: TOKEN,
        headerName: HEADER,
        webhooksOnIssueCreated: 'http://10.0.0.1/,https://b.com/',
      },
      asyncFunctions,
    });
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'IssueCreated');

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Blocked webhook to http://10.0.0.1/'),
    );
    expect(httpInstances).toHaveLength(1);
    expect(httpInstances[0].url).toBe('https://b.com/');
  });

  it('returns silently if all URLs are invalid', () => {
    const ctx = createCtx({
      settings: {
        webhookToken: TOKEN,
        headerName: HEADER,
        webhooksOnIssueCreated: 'http://10.0.0.1/,file:///etc/passwd',
      },
      asyncFunctions,
    });
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'IssueCreated');

    expect(httpInstances).toHaveLength(0);
  });
});

// ── logAndPostNext: response handler that logs + chains via direct postAsync ─

describe('logAndPostNext', () => {
  const TOKEN = 'test-token';
  const HEADER = 'X-Token';
  const PAYLOAD = { event: 'test' };

  function seedCtx(remainingUrls, currentUrl = 'https://a.com/') {
    const ctx = createCtx({
      settings: { webhookToken: TOKEN, headerName: HEADER },
      asyncFunctions,
    });
    ctx.store('webhookUrls', JSON.stringify(remainingUrls));
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

  it('logs the successful response and dispatches the next URL directly via postAsync', () => {
    const ctx = seedCtx(['https://b.com/']);
    ctx.response = { code: 200 };
    logAndPostNext(ctx);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Webhook sent successfully to https://a.com/'),
    );
    expect(httpInstances).toHaveLength(1);
    expect(httpInstances[0].url).toBe('https://b.com/');
    expect(httpInstances[0].calls[0].method).toBe('postAsync');
    expect(httpInstances[0].calls[0].handlerName).toBe('logAndPostNext');
  });

  it('does not dispatch when the URL list is empty', () => {
    const ctx = seedCtx([]);
    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(httpInstances).toHaveLength(0);
  });

  it('logs an error when ctx.response.exception is present and still dispatches the next URL', () => {
    const ctx = seedCtx(['https://b.com/']);
    ctx.response = { exception: 'timeout' };
    logAndPostNext(ctx);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Webhook to https://a.com/ failed: timeout'),
    );
    expect(httpInstances).toHaveLength(1);
    expect(httpInstances[0].url).toBe('https://b.com/');
  });

  it('warns on no-status-code response (likely timeout)', () => {
    const ctx = seedCtx([]);
    ctx.response = { code: undefined };
    logAndPostNext(ctx);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('completed but returned no status code'),
    );
  });

  it('shifts the dispatched URL out of the stored list and records currentUrl', () => {
    const ctx = seedCtx(['https://b.com/', 'https://c.com/']);
    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(JSON.parse(ctx._storeMap.get('webhookUrls'))).toEqual([
      'https://c.com/',
    ]);
    expect(ctx._storeMap.get('webhookCurrentUrl')).toBe('https://b.com/');
  });

  it('skips an invalid next URL synchronously and dispatches the one after (no async hop consumed)', () => {
    const ctx = seedCtx(['http://10.0.0.1/', 'https://c.com/']);
    ctx.response = { code: 200 };
    logAndPostNext(ctx);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Blocked webhook to http://10.0.0.1/'),
    );
    expect(httpInstances).toHaveLength(1);
    expect(httpInstances[0].url).toBe('https://c.com/');
  });

  it.each([
    ['10.x RFC-1918', 'http://10.0.0.1/'],
    ['172.16.x RFC-1918', 'http://172.16.0.1/'],
    ['172.31.x RFC-1918', 'http://172.31.255.255/'],
    ['192.168.x RFC-1918', 'http://192.168.1.1/'],
    ['169.254.x link-local', 'http://169.254.169.254/latest/meta-data/'],
    ['file:// scheme', 'file:///etc/passwd'],
    ['ftp:// scheme', 'ftp://example.com/'],
  ])('blocks %s (%s) when it is the next URL', (_label, url) => {
    const ctx = seedCtx([url]);
    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(httpInstances).toHaveLength(0);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[webhooks] Blocked webhook to'),
    );
  });

  it('warns when an HTTP (non-HTTPS) URL is used but still dispatches it', () => {
    const ctx = seedCtx(['http://example.com/webhook']);
    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('webhook URL uses HTTP (not HTTPS)'),
    );
    expect(httpInstances).toHaveLength(1);
    expect(httpInstances[0].calls[0].method).toBe('postAsync');
  });
});

// ── End-to-end chain progression ──────────────────────────────────────────────

describe('chain progression (sendWebhooks + logAndPostNext)', () => {
  const TOKEN = 'test-token';
  const HEADER = 'X-Token';
  const PAYLOAD = { event: 'test' };

  beforeEach(() => {
    resetHttp();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('walks a 3-URL chain end-to-end via direct postAsync chaining (1 hop per URL)', () => {
    const urls = ['https://a.com/', 'https://b.com/', 'https://c.com/'];
    const ctx = createCtx({
      settings: {
        webhookToken: TOKEN,
        headerName: HEADER,
        webhooksOnIssueCreated: urls.join(','),
      },
      asyncFunctions,
    });

    // sync action: dispatches URL #1 directly.
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'IssueCreated');
    expect(httpInstances).toHaveLength(1);
    expect(httpInstances[0].url).toBe('https://a.com/');

    // hop 1: logAndPostNext fires with URL #1 response, dispatches URL #2.
    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(httpInstances).toHaveLength(2);
    expect(httpInstances[1].url).toBe('https://b.com/');

    // hop 2: logAndPostNext fires with URL #2 response, dispatches URL #3.
    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(httpInstances).toHaveLength(3);
    expect(httpInstances[2].url).toBe('https://c.com/');

    // hop 3: logAndPostNext fires with URL #3 response, no more URLs → chain ends.
    ctx.response = { code: 200 };
    logAndPostNext(ctx);
    expect(httpInstances).toHaveLength(3);
  });
});

// ── Fail-closed guard when settings change mid-chain ─────────────────────────

describe('settings-disappear-mid-chain guard', () => {
  const TOKEN = 'test-token';
  const HEADER = 'X-Token';
  const PAYLOAD = { event: 'test' };

  beforeEach(() => {
    resetHttp();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('aborts the chain when the webhook token is cleared between hops', () => {
    const ctx = createCtx({
      settings: {
        webhookToken: TOKEN,
        headerName: HEADER,
        webhooksOnIssueCreated: 'https://a.com/,https://b.com/',
      },
      asyncFunctions,
    });

    // Sync action dispatches URL #1 normally (token present).
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'IssueCreated');
    expect(httpInstances).toHaveLength(1);
    expect(httpInstances[0].headers[HEADER]).toBe(TOKEN);

    // Admin clears the token between hops.
    ctx.settings.webhookToken = null;

    // Hop 1 — response for URL #1 arrives, logAndPostNext would normally
    // dispatch URL #2 but must abort instead of sending it unauthenticated.
    ctx.response = { code: 200 };
    logAndPostNext(ctx);

    expect(httpInstances).toHaveLength(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Webhook token or header was cleared during chain execution'),
    );
  });

  it('aborts the chain when the header name is cleared between hops', () => {
    const ctx = createCtx({
      settings: {
        webhookToken: TOKEN,
        headerName: HEADER,
        webhooksOnIssueCreated: 'https://a.com/,https://b.com/',
      },
      asyncFunctions,
    });

    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'IssueCreated');
    expect(httpInstances).toHaveLength(1);

    ctx.settings.headerName = null;

    ctx.response = { code: 200 };
    logAndPostNext(ctx);

    expect(httpInstances).toHaveLength(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Webhook token or header was cleared during chain execution'),
    );
  });

  it.each([
    ['empty-string token', { webhookToken: '', headerName: HEADER }],
    ['empty-string header', { webhookToken: TOKEN, headerName: '' }],
    ['both empty strings', { webhookToken: '', headerName: '' }],
  ])('aborts the chain when settings become %s mid-chain', (_label, mutated) => {
    const ctx = createCtx({
      settings: {
        webhookToken: TOKEN,
        headerName: HEADER,
        webhooksOnIssueCreated: 'https://a.com/,https://b.com/',
      },
      asyncFunctions,
    });

    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'IssueCreated');
    expect(httpInstances).toHaveLength(1);

    Object.assign(ctx.settings, mutated);

    ctx.response = { code: 200 };
    logAndPostNext(ctx);

    expect(httpInstances).toHaveLength(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Webhook token or header was cleared during chain execution'),
    );
  });
});

// ── asyncFunctions export ─────────────────────────────────────────────────────

describe('asyncFunctions export', () => {
  it('exposes logAndPostNext', () => {
    expect(typeof asyncFunctions.logAndPostNext).toBe('function');
    expect(asyncFunctions.logAndPostNext).toBe(logAndPostNext);
  });
});