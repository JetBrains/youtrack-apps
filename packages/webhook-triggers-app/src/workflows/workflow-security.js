/**
 * Security utilities for webhook authentication and validation.
 */


/**
 * Adds security headers to an HTTP connection
 * @param {Object} connection - The HTTP connection object
 * @param {string|Object} token - Token value (supports YouTrack SecretAttributeValue)
 * @param {string} headerName - Name of the HTTP header to include the webhook token in requests
 */
function addSecurityHeaders(connection, token, headerName) {
  if (token != null && headerName) {
    connection.addHeader(headerName, token);
    console.log(`[webhooks] Added ${headerName} header`);
  }
}

/**
 * Domains that exist to resolve to loopback or to a caller-chosen address.
 * `nip.io`/`sslip.io`/`xip.io` are wildcard resolvers — no real webhook
 * receiver is hosted on them, so the whole domain is refused.
 */
var LOOPBACK_DOMAINS = [
  'localhost',      // RFC 6761 — reserved, always loopback
  'local',          // mDNS — LAN-scoped
  'localtest.me',
  'lvh.me',
  'vcap.me',
  'localho.st',
  'nip.io',
  'sslip.io',
  'xip.io'
];

/**
 * Reason the given IPv4 leading octets are not a usable webhook destination,
 * or null when the address is publicly routable. Ranges mirror the server's
 * HostedOutboundConnectionFilter so the two layers agree on what "internal" is.
 */
function internalIpv4Reason(a, b) {
  if (a === 127) {
    return 'Loopback addresses (127.x.x.x) are not allowed';
  }
  if (a === 0) {
    return 'Unspecified addresses (0.x.x.x) are not allowed';
  }
  if (a === 10) {
    return 'Private network addresses (10.x.x.x) are not allowed';
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return 'Private network addresses (172.16-31.x.x) are not allowed';
  }
  if (a === 192 && b === 168) {
    return 'Private network addresses (192.168.x.x) are not allowed';
  }
  if (a === 169 && b === 254) {
    return 'Link-local addresses (169.254.x.x) are not allowed — these include cloud metadata endpoints';
  }
  if (a === 100 && b >= 64 && b <= 127) {
    return 'Carrier-grade NAT addresses (100.64-127.x.x) are not allowed';
  }
  return null;
}

/**
 * True when the host is written as a number rather than a DNS name. No real
 * hostname is all-numeric (a TLD cannot be), so anything matching here is an
 * address literal in some notation.
 */
function isNumericHost(hostname) {
  return /^(0x[0-9a-f]+|[0-9]+)(\.(0x[0-9a-f]+|[0-9]+))*$/.test(hostname);
}

/**
 * The four octets of a canonical dotted-quad address, or null for every other
 * spelling. inet_aton also accepts one-, two- and three-part forms and octal
 * (leading zero) and hex (0x) parts, so 172.19.0.2 can be written 2886926338,
 * 172.1245186, 0254.023.0.2 or 0xac130002. Those are refused rather than
 * decoded: HTTP clients disagree on which forms they accept, so decoding one
 * here and judging it routable would not predict what the client connects to.
 */
function canonicalDottedQuad(hostname) {
  var parts = hostname.split('.');
  if (parts.length !== 4) {
    return null;
  }
  var octets = [];
  for (var i = 0; i < 4; i++) {
    var part = parts[i];
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }
    // A leading zero means the part may be read as octal.
    if (part.length > 1 && part.charAt(0) === '0') {
      return null;
    }
    var value = parseInt(part, 10);
    if (value > 255) {
      return null;
    }
    octets.push(value);
  }
  return octets;
}

/**
 * Wildcard DNS services encode the target address in the name itself
 * (127.0.0.1.nip.io, 127-0-0-1.sslip.io). Reads that address back out of the
 * hostname so an internal target is refused without resolving anything.
 */
function embeddedIpv4Reason(hostname) {
  var patterns = [
    /(?:^|[.\-])(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:[.\-]|$)/,
    /(?:^|[.\-])(\d{1,3})-(\d{1,3})-(\d{1,3})-(\d{1,3})(?:[.\-]|$)/
  ];
  for (var i = 0; i < patterns.length; i++) {
    var match = hostname.match(patterns[i]);
    if (match) {
      var reason = internalIpv4Reason(parseInt(match[1], 10), parseInt(match[2], 10));
      if (reason) {
        return reason + ' (embedded in hostname "' + hostname + '")';
      }
    }
  }
  return null;
}

function loopbackDomainReason(hostname) {
  for (var i = 0; i < LOOPBACK_DOMAINS.length; i++) {
    var domain = LOOPBACK_DOMAINS[i];
    var isSuffix = hostname.length > domain.length &&
      hostname.substring(hostname.length - domain.length - 1) === '.' + domain;
    if (hostname === domain || isSuffix) {
      return 'Loopback or internal hostname "' + hostname + '" is not allowed (' + domain + ')';
    }
  }
  return null;
}

/**
 * Validates a webhook URL to prevent SSRF attacks. Rejects non-HTTP(S) schemes,
 * internal IP literals, and hostnames that are known to resolve to loopback.
 *
 * Best-effort only, NOT a security boundary. This runs in the workflow sandbox,
 * which has no DNS resolution, so a hostname can only be matched as a string —
 * any name with an A record pointing at an internal address (or one that
 * changes between validation and connect, i.e. DNS rebinding) still passes.
 * The enforceable control is the server's outbound filter, which hooks the DNS
 * resolver in ClientFactory and checks the addresses actually resolved. Treat
 * the checks below as a way to catch misconfiguration early and turn away the
 * obvious cases, not as the thing that stops a determined Project Admin.
 *
 * @param {string} url - The URL to validate
 * @returns {{valid: boolean, reason: string|null}} Validation result
 */
function validateWebhookUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, reason: 'URL must be a non-empty string' };
  }

  var schemeMatch = url.match(/^([a-zA-Z][a-zA-Z0-9+\-.]*):(.*)$/);
  if (!schemeMatch) {
    return { valid: false, reason: 'URL is not valid' };
  }

  var scheme = schemeMatch[1].toLowerCase();
  if (scheme !== 'http' && scheme !== 'https') {
    return { valid: false, reason: 'Only http:// and https:// schemes are allowed' };
  }

  var rest = schemeMatch[2];
  if (rest.substring(0, 2) !== '//') {
    return { valid: false, reason: 'URL is not valid' };
  }

  // Extract hostname: strip "//" prefix, then take up to the first / ? or #
  var afterScheme = rest.substring(2);
  var hostname;
  if (afterScheme.charAt(0) === '[') {
    // Bracketed IPv6 literal, e.g. [::1] or [::1]:8080
    var closeBracket = afterScheme.indexOf(']');
    if (closeBracket === -1) {
      return { valid: false, reason: 'URL is not valid' };
    }
    hostname = afterScheme.substring(1, closeBracket).toLowerCase();
  } else {
    hostname = afterScheme.split(/[/:?#]/)[0].toLowerCase();
  }

  // A trailing dot denotes the DNS root and resolves identically ("localhost.")
  if (hostname.charAt(hostname.length - 1) === '.') {
    hostname = hostname.substring(0, hostname.length - 1);
  }

  if (!hostname) {
    return { valid: false, reason: 'URL is not valid' };
  }

  if (hostname.indexOf(':') !== -1) {
    // IPv6 literal
    if (hostname === '::1' || hostname === '::') {
      return { valid: false, reason: 'Loopback addresses (' + hostname + ') are not allowed' };
    }
    var mapped = hostname.match(/^::ffff:(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (mapped) {
      var mappedReason = internalIpv4Reason(parseInt(mapped[1], 10), parseInt(mapped[2], 10));
      if (mappedReason) {
        return { valid: false, reason: mappedReason };
      }
    }
    // fc00::/7 unique-local
    if (/^f[cd]/.test(hostname)) {
      return { valid: false, reason: 'Unique-local IPv6 addresses (fc00::/7) are not allowed' };
    }
    // fe80::/10 link-local
    if (/^fe[89ab]/.test(hostname)) {
      return { valid: false, reason: 'Link-local IPv6 addresses (fe80::/10) are not allowed' };
    }
    return { valid: true, reason: null };
  }

  if (isNumericHost(hostname)) {
    var octets = canonicalDottedQuad(hostname);
    if (!octets) {
      return {
        valid: false,
        reason: 'Ambiguous numeric host "' + hostname + '" is not allowed — ' +
          'write an IPv4 address as four dotted decimal octets'
      };
    }
    var literalReason = internalIpv4Reason(octets[0], octets[1]);
    if (literalReason) {
      return { valid: false, reason: literalReason };
    }
    return { valid: true, reason: null };
  }

  var domainReason = loopbackDomainReason(hostname);
  if (domainReason) {
    return { valid: false, reason: domainReason };
  }

  var embeddedReason = embeddedIpv4Reason(hostname);
  if (embeddedReason) {
    return { valid: false, reason: embeddedReason };
  }

  return { valid: true, reason: null };
}

exports.addSecurityHeaders = addSecurityHeaders;
exports.validateWebhookUrl = validateWebhookUrl;
