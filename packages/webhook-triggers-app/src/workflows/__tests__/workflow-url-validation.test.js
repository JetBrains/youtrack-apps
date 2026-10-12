import { describe, it, expect } from 'vitest';
import { validateWebhookUrl } from '../workflow-url-validation.js';

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

  // ── Loopback / server-local (JT-98610) ──────────────────────────────────────

  describe('loopback addresses', () => {
    it.each([
      'http://127.0.0.1/',
      'http://127.0.0.1:8080/admin',
      'https://127.255.255.255/',
    ])('rejects 127/8 address %s', (url) => {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/loopback/i);
    });

    it.each([
      'http://localhost/',
      'http://localhost:8080/webhook',
      'http://LOCALHOST/',
    ])('rejects localhost %s', (url) => {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/loopback/i);
    });

    it.each([
      'http://[::1]/',
      'http://[::1]:8080/',
      'http://[::]/',
    ])('rejects IPv6 loopback/unspecified %s', (url) => {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/loopback/i);
    });

    it.each([
      'http://0.0.0.0/',
      'http://0.0.0.0:9200/',
    ])('rejects unspecified 0/8 address %s', (url) => {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/unspecified/i);
    });

    it('rejects IPv4-mapped IPv6 loopback', () => {
      const result = validateWebhookUrl('http://[::ffff:127.0.0.1]/');
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/loopback/i);
    });
  });

  // ── DNS names resolving to internal addresses (JT-98610 follow-up) ─────────

  describe('loopback-resolving DNS names', () => {
    it.each([
      'http://127.0.0.1.nip.io:8080/x',   // wildcard resolver, dotted form
      'http://127-0-0-1.sslip.io/x',      // wildcard resolver, dashed form
      'http://10.0.0.1.nip.io/x',         // embedded RFC-1918
      'http://169.254.169.254.nip.io/x',  // embedded metadata endpoint
    ])('rejects wildcard resolver name %s', (url) => {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
    });

    it.each([
      'http://anything.localtest.me/x',
      'http://foo.lvh.me/x',
      'http://vcap.me/x',
      'http://localho.st/x',
      'http://localhost.localdomain/x',   // common /etc/hosts alias
      'http://ip6-localhost:8080/x',      // common /etc/hosts alias
      'http://metadata.google.internal/x', // GCP metadata endpoint
    ])('rejects known loopback domain %s', (url) => {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/loopback/i);
    });

    it.each([
      'http://foo.localhost/x',           // RFC 6761 reserved TLD
      'http://buildserver.local/x',       // mDNS / LAN-scoped
    ])('rejects reserved internal TLD %s', (url) => {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/loopback|internal/i);
    });

    it('rejects the whole wildcard-resolver domain even with no embedded IP', () => {
      expect(validateWebhookUrl('http://nip.io/x').valid).toBe(false);
      expect(validateWebhookUrl('http://sslip.io/x').valid).toBe(false);
    });

    it('still allows a public hostname that merely embeds a public IP', () => {
      expect(validateWebhookUrl('https://1.2.3.4.example.com/hook').valid).toBe(true);
    });

    it('does not false-positive on names that merely start like a blocked one', () => {
      expect(validateWebhookUrl('https://localhostings.com/hook').valid).toBe(true);
      expect(validateWebhookUrl('https://fcbarcelona.com/hook').valid).toBe(true);
      expect(validateWebhookUrl('https://notnip.io.example.com/hook').valid).toBe(true);
    });
  });

  // ── Extra internal ranges mirrored from the server-side outbound filter ────

  describe('additional internal ranges', () => {
    it.each([
      'http://100.64.0.1/',
      'http://100.127.255.255/',
    ])('rejects carrier-grade NAT %s', (url) => {
      expect(validateWebhookUrl(url).valid).toBe(false);
    });

    it('allows 100.63.x.x and 100.128.x.x (outside CGNAT)', () => {
      expect(validateWebhookUrl('https://100.63.0.1/').valid).toBe(true);
      expect(validateWebhookUrl('https://100.128.0.1/').valid).toBe(true);
    });

    it.each([
      'http://[fc00::1]/',
      'http://[fd12:3456::1]/',
    ])('rejects IPv6 unique-local %s', (url) => {
      expect(validateWebhookUrl(url).valid).toBe(false);
    });

    it('rejects IPv6 link-local', () => {
      expect(validateWebhookUrl('http://[fe80::1]/').valid).toBe(false);
    });

    it('allows a public IPv6 literal', () => {
      expect(validateWebhookUrl('https://[2606:4700::1111]/hook').valid).toBe(true);
      expect(validateWebhookUrl('https://[2606:4700:0:0:0:0:0:1111]/hook').valid).toBe(true);
    });

    it.each([
      'http://[0:0:0:0:0:0:0:1]/',
      'http://[0000:0000:0000:0000:0000:0000:0000:0001]/',
      'http://[::0]/',
      'http://[0:0:0:0:0:0:0:0]/',
      'http://[::ffff:7f00:1]/',
      'http://[::ffff:127.0.0.1]/',
      'http://[0:0:0:0:0:ffff:7f00:1]/',
      'http://[::ffff:a00:1]/',
      'http://[::ffff:a9fe:a9fe]/',
      'http://[::127.0.0.1]/',
      'http://[::7f00:1]/',
      'http://[64:ff9b::7f00:1]/',
      'http://[fec0::1]/',
      'http://[FE80:0:0:0:0:0:0:1]/',
      'http://[fe80::1%25eth0]/',
    ])('rejects IPv6 alias of an internal address %s', (url) => {
      expect(validateWebhookUrl(url).valid).toBe(false);
    });

    it.each([
      'http://[1::2::3]/',
      'http://[1:2:3:4:5:6:7:8:9]/',
      'http://[12345::1]/',
      'http://[::ffff:1.2.3]/',
    ])('rejects malformed IPv6 %s', (url) => {
      expect(validateWebhookUrl(url).valid).toBe(false);
    });

    it('allows a mapped public IPv4', () => {
      expect(validateWebhookUrl('https://[::ffff:8.8.8.8]/').valid).toBe(true);
    });
  });

  // ── Non-dotted-quad numeric encodings (JT-98610 follow-up) ────────────────

  describe('numeric host encodings', () => {
    it.each([
      ['decimal', 'http://2886926338/hook'],        // 172.19.0.2
      ['two-part', 'http://172.1245186/hook'],      // 172.19.0.2
      ['hex', 'http://0xac130002/hook'],            // 172.19.0.2
      ['dotted octal', 'http://0300.0250.0.1/hook'],// 192.168.0.1
      ['octal quad', 'http://0254.023.0.2/hook'],   // 172.19.0.2
      ['three-part', 'http://192.168.257/hook'],
      ['one-part loopback', 'http://2130706433/hook'], // 127.0.0.1
    ])('rejects %s encoding %s', (_label, url) => {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
    });

    it('rejects a dotted quad with an out-of-range octet', () => {
      expect(validateWebhookUrl('http://999.1.1.1/hook').valid).toBe(false);
      expect(validateWebhookUrl('http://1.2.3.999/hook').valid).toBe(false);
    });

    it('still blocks the canonical dotted form of the same address', () => {
      const result = validateWebhookUrl('http://172.19.0.2/hook');
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/private/i);
    });

    it('still allows canonical public dotted quads', () => {
      expect(validateWebhookUrl('https://8.8.8.8/hook').valid).toBe(true);
      expect(validateWebhookUrl('https://1.2.3.4/hook').valid).toBe(true);
    });

    it('does not mistake a normal hostname for a numeric host', () => {
      expect(validateWebhookUrl('https://api2.example.com/hook').valid).toBe(true);
      expect(validateWebhookUrl('https://3m.com/hook').valid).toBe(true);
    });
  });

  // ── Authority parsing: userinfo and host charset ──────────────────────────

  describe('userinfo in the authority', () => {
    it.each([
      'http://user@127.0.0.1:9099/hook',
      'http://evil.com@127.0.0.1:9099/hook',
      'http://a:b@127.0.0.1/hook',
      'http://example.com@[::1]/hook',
    ])('rejects loopback hidden behind userinfo in %s', (url) => {
      const result = validateWebhookUrl(url);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/loopback/i);
    });

    it.each([
      'http://x@10.0.0.5/hook',
      'http://x@169.254.169.254/hook',
    ])('rejects internal address hidden behind userinfo in %s', (url) => {
      expect(validateWebhookUrl(url).valid).toBe(false);
    });

    it('rejects a numeric-encoded host behind userinfo', () => {
      expect(validateWebhookUrl('http://evil.com@2886926338/hook').valid).toBe(false);
    });

    it('allows userinfo pointing at a genuinely public host', () => {
      expect(validateWebhookUrl('https://user:pass@example.com/hook').valid).toBe(true);
    });

    it('is not fooled by a decoy host after the real one', () => {
      // Last "@" wins, so the host here is evil.example.com, not 127.0.0.1
      expect(validateWebhookUrl('http://127.0.0.1@evil.example.com/hook').valid).toBe(true);
    });
  });

  describe('host charset', () => {
    it.each([
      'http://127.0.0.1\\@evil.com/hook',
      'http://127.0.0.1 /hook',
      'http://127.0.0.1\t/hook',
      'http://exa mple.com/hook',
    ])('rejects a host with characters outside the hostname charset: %j', (url) => {
      expect(validateWebhookUrl(url).valid).toBe(false);
    });

    it('still allows ordinary hostnames and punycode', () => {
      expect(validateWebhookUrl('https://hooks.example-corp.com/x').valid).toBe(true);
      expect(validateWebhookUrl('https://xn--80ak6aa92e.com/x').valid).toBe(true);
    });
  });
});