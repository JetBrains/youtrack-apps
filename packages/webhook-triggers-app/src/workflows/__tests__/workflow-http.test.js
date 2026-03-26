import { describe, it, expect, vi, beforeEach } from 'vitest';
// @jetbrains/youtrack-scripting-api/http is stubbed by setup.js via
// Module._resolveFilename so workflow-http.js loads without YouTrack runtime.
import { parseWebhookUrls, sendWebhook } from '../workflow-http.js';

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