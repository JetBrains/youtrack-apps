import { describe, it, expect } from 'vitest';
import { validateWebhookUrl } from '../workflow-security.js';

describe('validateWebhookUrl', () => {
  // ── Valid URLs ──────────────────────────────────────────────────────────────

  describe('valid URLs', () => {
    it.each([
      'https://example.com/webhook',
      'http://example.com/webhook',
      'https://hooks.example.com:8443/path?query=1',
      'https://1.2.3.4/webhook',          // public IPv4
      'https://8.8.8.8/',
      'https://172.15.255.255/',           // just below RFC-1918 172.16/12
      'https://172.32.0.1/',              // just above RFC-1918 172.31/12
      'https://192.169.0.1/',             // just above 192.168/16
    ])('allows %s', (url) => {
      const result = validateWebhookUrl(url);
      expect(result).toEqual({ valid: true, reason: null });
    });
  });

  // ── Scheme validation ───────────────────────────────────────────────────────

  describe('scheme validation', () => {
    it.each([
      'file:///etc/passwd',
      'ftp://example.com/',
      'javascript:alert(1)',
      'data:text/plain,hello',
      'gopher://example.com/',
    ])('rejects non-http(s) scheme in %s', (url) => {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/only http/i);
    });
  });

  // ── Malformed / empty input ─────────────────────────────────────────────────

  describe('malformed input', () => {
    it('rejects an empty string', () => {
      expect(validateWebhookUrl('').valid).toBe(false);
    });

    it('rejects null', () => {
      expect(validateWebhookUrl(null).valid).toBe(false);
    });

    it('rejects undefined', () => {
      expect(validateWebhookUrl(undefined).valid).toBe(false);
    });

    it('rejects a plain hostname with no scheme', () => {
      expect(validateWebhookUrl('example.com').valid).toBe(false);
    });

    it('rejects a random string', () => {
      expect(validateWebhookUrl('not-a-url').valid).toBe(false);
    });
  });

  // ── RFC-1918 private ranges ─────────────────────────────────────────────────

  describe('RFC-1918 private IPv4', () => {
    it.each([
      'http://10.0.0.1/',
      'http://10.255.255.255/',
    ])('rejects 10/8 address %s', (url) => {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/private/i);
    });

    it.each([
      'http://172.16.0.1/',
      'http://172.20.0.1/',
      'http://172.31.255.255/',
    ])('rejects 172.16/12 address %s', (url) => {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/private/i);
    });

    it.each([
      'http://192.168.0.1/',
      'http://192.168.1.100/',
      'http://192.168.255.255/',
    ])('rejects 192.168/16 address %s', (url) => {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/private/i);
    });

    it('allows 172.15.255.255 (below 172.16/12)', () => {
      expect(validateWebhookUrl('https://172.15.255.255/').valid).toBe(true);
    });

    it('allows 172.32.0.1 (above 172.31/12)', () => {
      expect(validateWebhookUrl('https://172.32.0.1/').valid).toBe(true);
    });
  });

  // ── Link-local / cloud metadata (169.254.0.0/16) ───────────────────────────

  describe('link-local IPv4', () => {
    it.each([
      'http://169.254.0.1/',
      'http://169.254.169.254/',          // AWS/GCP/Azure instance metadata
      'http://169.254.255.255/',
    ])('rejects link-local %s', (url) => {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/link-local/i);
    });
  });
});