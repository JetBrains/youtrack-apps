import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// @jetbrains/youtrack-scripting-api/http is stubbed by setup.js via
// Module._resolveFilename so workflow-http.js loads without YouTrack runtime.
import {
  parseWebhookUrls,
  parseWebhookEntries,
  getWebhookEntries,
  sendWebhook,
  sendWebhooks,
} from '../workflow-http.js';
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const httpMock = _require('./mocks/youtrack-http.cjs');

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

// ── parseWebhookEntries ───────────────────────────────────────────────────────

describe('parseWebhookEntries', () => {
  it('returns [] for empty string', () => {
    expect(parseWebhookEntries('')).toEqual([]);
  });

  it('returns [] for null', () => {
    expect(parseWebhookEntries(null)).toEqual([]);
  });

  it('returns [] for undefined', () => {
    expect(parseWebhookEntries(undefined)).toEqual([]);
  });

  it('returns [] for a non-string', () => {
    expect(parseWebhookEntries(42)).toEqual([]);
  });

  it('parses a URL-only line — token is null', () => {
    expect(parseWebhookEntries('https://example.com/hook')).toEqual([
      { url: 'https://example.com/hook', token: null },
    ]);
  });

  it('parses a url+token line', () => {
    expect(parseWebhookEntries('https://example.com/hook mytoken123')).toEqual([
      { url: 'https://example.com/hook', token: 'mytoken123' },
    ]);
  });

  it('trailing space → token is null', () => {
    expect(parseWebhookEntries('https://example.com/hook ')).toEqual([
      { url: 'https://example.com/hook', token: null },
    ]);
  });

  it('multiple spaces between url and token → token trimmed correctly', () => {
    expect(parseWebhookEntries('https://example.com/hook   mytoken')).toEqual([
      { url: 'https://example.com/hook', token: 'mytoken' },
    ]);
  });

  it('parses multiple lines with mixed url-only and url+token', () => {
    expect(
      parseWebhookEntries('https://a.com/hook token_a\nhttps://b.com/hook')
    ).toEqual([
      { url: 'https://a.com/hook', token: 'token_a' },
      { url: 'https://b.com/hook', token: null },
    ]);
  });

  it('filters out blank lines', () => {
    expect(
      parseWebhookEntries('https://a.com/hook\n\nhttps://b.com/hook token_b')
    ).toEqual([
      { url: 'https://a.com/hook', token: null },
      { url: 'https://b.com/hook', token: 'token_b' },
    ]);
  });

  it('splits on commas (url-only entries)', () => {
    expect(parseWebhookEntries('https://a.com/,https://b.com/')).toEqual([
      { url: 'https://a.com/', token: null },
      { url: 'https://b.com/', token: null },
    ]);
  });
});

// ── getWebhookEntries ─────────────────────────────────────────────────────────

describe('getWebhookEntries', () => {
  it('returns entries from event-specific field', () => {
    const ctx = {
      settings: { webhooksOnIssueCreated: 'https://a.com hook_a', webhooksOnAllEvents: '' },
    };
    expect(getWebhookEntries(ctx, 'webhooksOnIssueCreated')).toEqual([
      { url: 'https://a.com', token: 'hook_a' },
    ]);
  });

  it('combines event-specific and all-events entries', () => {
    const ctx = {
      settings: {
        webhooksOnIssueCreated: 'https://a.com token_a',
        webhooksOnAllEvents: 'https://b.com token_b',
      },
    };
    expect(getWebhookEntries(ctx, 'webhooksOnIssueCreated')).toEqual([
      { url: 'https://a.com', token: 'token_a' },
      { url: 'https://b.com', token: 'token_b' },
    ]);
  });

  it('deduplicates: event-specific version wins when same URL appears in both', () => {
    const ctx = {
      settings: {
        webhooksOnIssueCreated: 'https://a.com token_specific',
        webhooksOnAllEvents: 'https://a.com',
      },
    };
    expect(getWebhookEntries(ctx, 'webhooksOnIssueCreated')).toEqual([
      { url: 'https://a.com', token: 'token_specific' },
    ]);
  });

  it('deduplicates: event-specific no-token wins over all-events token when event-specific is listed first', () => {
    const ctx = {
      settings: {
        webhooksOnIssueCreated: 'https://a.com',
        webhooksOnAllEvents: 'https://a.com token_all',
      },
    };
    expect(getWebhookEntries(ctx, 'webhooksOnIssueCreated')).toEqual([
      { url: 'https://a.com', token: null },
    ]);
  });

  it('returns [] when both fields are empty', () => {
    const ctx = {
      settings: { webhooksOnIssueCreated: '', webhooksOnAllEvents: '' },
    };
    expect(getWebhookEntries(ctx, 'webhooksOnIssueCreated')).toEqual([]);
  });

  it('returns all-events entries when event-specific field is absent', () => {
    const ctx = {
      settings: { webhooksOnAllEvents: 'https://b.com token_b' },
    };
    expect(getWebhookEntries(ctx, 'webhooksOnIssueCreated')).toEqual([
      { url: 'https://b.com', token: 'token_b' },
    ]);
  });
});

// ── sendWebhook — SSRF validation ─────────────────────────────────────────────

describe('sendWebhook URL validation', () => {
  const TOKEN = 'test-token';
  const HEADER = 'X-Token';
  const PAYLOAD = { event: 'test' };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('blocked URLs', () => {
    it.each([
      ['10.x RFC-1918',        'http://10.0.0.1/'],
      ['172.16.x RFC-1918',    'http://172.16.0.1/'],
      ['172.31.x RFC-1918',    'http://172.31.255.255/'],
      ['192.168.x RFC-1918',   'http://192.168.1.1/'],
      ['169.254.x link-local', 'http://169.254.169.254/latest/meta-data/'],
      ['file:// scheme',       'file:///etc/passwd'],
      ['ftp:// scheme',        'ftp://example.com/'],
    ])('returns null for %s (%s)', (_label, url) => {
      const result = sendWebhook(url, PAYLOAD, 'test-event', TOKEN, HEADER);
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[webhooks] Blocked webhook to')
      );
    });
  });

  describe('allowed URLs', () => {
    it('sends the request for a valid public HTTPS URL', () => {
      const result = sendWebhook(
        'https://example.com/webhook', PAYLOAD, 'test-event', TOKEN, HEADER
      );
      expect(result).not.toBeNull();
      expect(result.code).toBe(200);
    });

    it('sends the request for a valid public HTTP URL', () => {
      const result = sendWebhook(
        'http://example.com/webhook', PAYLOAD, 'test-event', TOKEN, HEADER
      );
      expect(result).not.toBeNull();
      expect(result.code).toBe(200);
    });

    it('trims whitespace around valid URLs before connecting', () => {
      const result = sendWebhook(
        '  https://example.com/webhook  ', PAYLOAD, 'test-event', TOKEN, HEADER
      );
      expect(result).not.toBeNull();
    });
  });
});

// ── sendWebhooks ──────────────────────────────────────────────────────────────

describe('sendWebhooks', () => {
  const PAYLOAD = { event: 'test' };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('sends to an entry with an inline token when webhookToken is absent', () => {
    const ctx = {
      settings: {
        webhooksOnIssueCreated: 'https://example.com/hook inline_token',
        webhooksOnAllEvents: '',
      },
    };
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'issueCreated');
    expect(console.warn).not.toHaveBeenCalledWith(
      expect.stringContaining('No token configured')
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Sending webhooks to 1')
    );
  });

  it('skips an entry and warns when effectiveToken is null (no inline token, no webhookToken)', () => {
    const ctx = {
      settings: {
        webhooksOnIssueCreated: 'https://example.com/hook',
        webhooksOnAllEvents: '',
      },
    };
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'issueCreated');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('No token configured for https://example.com/hook')
    );
  });

  it('uses inline token and does NOT count that entry as a fallback user', () => {
    // Two URLs: A has inline token, B uses fallback. Fallback-user count = 1 → no deprecation warning.
    const ctx = {
      settings: {
        webhooksOnIssueCreated: 'https://a.com/hook inline_token\nhttps://b.com/hook',
        webhooksOnAllEvents: '',
        webhookToken: 'global_token',
        headerName: 'X-Token',
      },
    };
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'issueCreated');
    expect(console.warn).not.toHaveBeenCalledWith(
      expect.stringContaining('sharing the global webhookToken fallback')
    );
  });

  it('emits deprecation warning when fallback-user count > 1', () => {
    const ctx = {
      settings: {
        webhooksOnIssueCreated: 'https://a.com/hook\nhttps://b.com/hook',
        webhooksOnAllEvents: '',
        webhookToken: 'global_token',
        headerName: 'X-Token',
      },
    };
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'issueCreated');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('sharing the global webhookToken fallback')
    );
  });

  it('does NOT emit deprecation warning when exactly one entry uses the fallback', () => {
    const ctx = {
      settings: {
        webhooksOnIssueCreated: 'https://a.com/hook',
        webhooksOnAllEvents: '',
        webhookToken: 'global_token',
        headerName: 'X-Token',
      },
    };
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'issueCreated');
    expect(console.warn).not.toHaveBeenCalledWith(
      expect.stringContaining('sharing the global webhookToken fallback')
    );
  });

  it('uses default header name (X-YouTrack-Token) when headerName is absent from settings', () => {
    const ctx = {
      settings: {
        webhooksOnIssueCreated: 'https://example.com/hook inline_token',
        webhooksOnAllEvents: '',
      },
    };
    // Should not skip or throw — headerName fallback to 'X-YouTrack-Token'
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'issueCreated');
    expect(console.warn).not.toHaveBeenCalledWith(
      expect.stringContaining('No token configured')
    );
  });

  it('logs a message when no URLs are configured', () => {
    const ctx = {
      settings: {
        webhooksOnIssueCreated: '',
        webhooksOnAllEvents: '',
        webhookToken: 'global_token',
      },
    };
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'issueCreated');
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('No webhook URLs configured')
    );
  });
});

// ── sendWebhooks — token dispatch verification (Connection spy) ───────────────

describe('sendWebhooks token dispatch', () => {
  const PAYLOAD = { event: 'test' };
  let addHeaderSpy;
  let capturedCalls; // {url, name, value}[]

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    capturedCalls = [];
    addHeaderSpy = vi
      .spyOn(httpMock.Connection.prototype, 'addHeader')
      .mockImplementation(function (name, value) {
        capturedCalls.push({ url: this.url, name, value });
      });
  });

  afterEach(() => {
    addHeaderSpy.mockRestore();
  });

  it('inline token wins over global webhookToken when both are present', () => {
    const ctx = {
      settings: {
        webhooksOnIssueCreated: 'https://example.com/hook inline_token',
        webhooksOnAllEvents: '',
        webhookToken: 'global_token',
        headerName: 'X-Test-Token',
      },
    };
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'issueCreated');
    const authCalls = capturedCalls.filter(
      c => c.url === 'https://example.com/hook' && c.name === 'X-Test-Token'
    );
    expect(authCalls).toHaveLength(1);
    expect(authCalls[0].value).toBe('inline_token');
  });

  it('each URL receives its own distinct inline token', () => {
    const ctx = {
      settings: {
        webhooksOnIssueCreated: 'https://a.com/hook token_a\nhttps://b.com/hook token_b',
        webhooksOnAllEvents: '',
        headerName: 'X-Test-Token',
      },
    };
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'issueCreated');
    const forA = capturedCalls.find(
      c => c.url === 'https://a.com/hook' && c.name === 'X-Test-Token'
    );
    const forB = capturedCalls.find(
      c => c.url === 'https://b.com/hook' && c.name === 'X-Test-Token'
    );
    expect(forA?.value).toBe('token_a');
    expect(forB?.value).toBe('token_b');
  });

  it('global token is sent when entry has no inline token', () => {
    const ctx = {
      settings: {
        webhooksOnIssueCreated: 'https://example.com/hook',
        webhooksOnAllEvents: '',
        webhookToken: 'global_token',
        headerName: 'X-Test-Token',
      },
    };
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'issueCreated');
    const authCalls = capturedCalls.filter(
      c => c.url === 'https://example.com/hook' && c.name === 'X-Test-Token'
    );
    expect(authCalls).toHaveLength(1);
    expect(authCalls[0].value).toBe('global_token');
  });

  it('no HTTP call made for a skipped entry (null effective token)', () => {
    const ctx = {
      settings: {
        webhooksOnIssueCreated: 'https://example.com/hook',
        webhooksOnAllEvents: '',
        // no webhookToken, no inline token
      },
    };
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'issueCreated');
    const authCalls = capturedCalls.filter(c => c.url === 'https://example.com/hook');
    expect(authCalls).toHaveLength(0);
  });

  it('warns when effective token contains whitespace', () => {
    const ctx = {
      settings: {
        webhooksOnIssueCreated: 'https://example.com/hook tok en with spaces',
        webhooksOnAllEvents: '',
        headerName: 'X-Test-Token',
      },
    };
    sendWebhooks(ctx, 'webhooksOnIssueCreated', PAYLOAD, 'issueCreated');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('contains whitespace')
    );
  });
});
