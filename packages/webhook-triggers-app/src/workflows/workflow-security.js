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

// Reserved names, common /etc/hosts aliases, the GCP metadata name and public
// wildcard resolvers; all resolve to loopback or internal addresses.
var LOOPBACK_DOMAINS = [
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'metadata.google.internal',
  'local',
  'localtest.me',
  'lvh.me',
  'vcap.me',
  'localho.st',
  'nip.io',
  'sslip.io',
  'xip.io'
];

// Ranges mirror the server's HostedOutboundConnectionFilter.
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
 * Eight 16-bit groups of an IPv6 literal, or null if it is malformed.
 * Handles "::" compression, leading zeros and a trailing dotted IPv4 part.
 * A zone id ("%eth0") is dropped; it does not change the address.
 */
function parseIpv6(rawLiteral) {
  var zone = rawLiteral.indexOf('%');
  var literal = zone !== -1 ? rawLiteral.substring(0, zone) : rawLiteral;
  if (literal.split('::').length > 2) {
    return null;
  }

  var tail = [];
  var lastColon = literal.lastIndexOf(':');
  var lastPart = literal.substring(lastColon + 1);
  if (lastPart.indexOf('.') !== -1) {
    var quad = canonicalDottedQuad(lastPart);
    if (!quad) {
      return null;
    }
    tail = [quad[0] * 256 + quad[1], quad[2] * 256 + quad[3]];
    literal = literal.substring(0, lastColon + 1) + '0:0';
  }

  var halves = literal.split('::');
  var head = halves[0] ? halves[0].split(':') : [];
  var rear = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  var all = head.concat(rear);
  for (var i = 0; i < all.length; i++) {
    if (!/^[0-9a-f]{1,4}$/.test(all[i])) {
      return null;
    }
  }

  var groups;
  if (halves.length === 2) {
    if (all.length > 7) {
      return null;
    }
    groups = head.slice();
    while (groups.length + rear.length < 8) {
      groups.push('0');
    }
    groups = groups.concat(rear);
  } else {
    if (all.length !== 8) {
      return null;
    }
    groups = head;
  }

  var result = [];
  for (var j = 0; j < 8; j++) {
    result.push(parseInt(groups[j], 16));
  }
  if (tail.length) {
    result[6] = tail[0];
    result[7] = tail[1];
  }
  return result;
}

function internalIpv6Reason(g) {
  var firstSix = g[0] | g[1] | g[2] | g[3] | g[4] | g[5];
  var firstFive = g[0] | g[1] | g[2] | g[3] | g[4];
  if (firstSix === 0 && g[6] === 0 && (g[7] === 0 || g[7] === 1)) {
    return 'Loopback or unspecified addresses (::, ::1) are not allowed';
  }
  // IPv4-mapped (::ffff:a.b.c.d), IPv4-compatible (::a.b.c.d) and NAT64 (64:ff9b::/96)
  var embedsIpv4 = (firstFive === 0 && g[5] === 0xffff) || firstSix === 0 ||
    (g[0] === 0x64 && g[1] === 0xff9b && (g[2] | g[3] | g[4] | g[5]) === 0);
  if (embedsIpv4) {
    var reason = internalIpv4Reason(g[6] >> 8, g[6] & 255);
    if (reason) {
      return reason;
    }
  }
  if ((g[0] & 0xfe00) === 0xfc00) {
    return 'Unique-local IPv6 addresses (fc00::/7) are not allowed';
  }
  if ((g[0] & 0xffc0) === 0xfe80) {
    return 'Link-local IPv6 addresses (fe80::/10) are not allowed';
  }
  if ((g[0] & 0xffc0) === 0xfec0) {
    return 'Site-local IPv6 addresses (fec0::/10) are not allowed';
  }
  return null;
}

function isNumericHost(hostname) {
  return /^(0x[0-9a-f]+|[0-9]+)(\.(0x[0-9a-f]+|[0-9]+))*$/.test(hostname);
}

/**
 * Octets of a canonical dotted quad, or null for every other numeric spelling.
 * Non-canonical forms (2886926338, 172.1245186, 0254.023.0.2, 0xac130002) are
 * refused rather than decoded, because HTTP clients disagree on which ones they
 * accept — decoding one here would not predict what the client connects to.
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
    if (part.length > 1 && part.charAt(0) === '0') {
      return null; // leading zero may be read as octal
    }
    var value = parseInt(part, 10);
    if (value > 255) {
      return null;
    }
    octets.push(value);
  }
  return octets;
}

// Wildcard resolvers encode the target in the name: 127.0.0.1.nip.io, 127-0-0-1.sslip.io
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
 * Validates a webhook URL to prevent SSRF attacks.
 *
 * Best-effort, NOT a security boundary. The workflow sandbox has no DNS, so a
 * host is only ever matched as a string: any name with an A record pointing at
 * an internal address, or one that changes between validation and connect,
 * still passes. The enforceable control is the server's outbound filter, which
 * hooks the DNS resolver in ClientFactory and checks the resolved addresses.
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

  // Host of http://example.com@127.0.0.1/ is 127.0.0.1, and for http(s) a
  // backslash ends the authority, so http://127.0.0.1\@evil.com/ is 127.0.0.1.
  var authority = rest.substring(2).split(/[/?#\\]/)[0];
  var atIndex = authority.lastIndexOf('@');
  if (atIndex !== -1) {
    authority = authority.substring(atIndex + 1);
  }

  var hostname;
  var isIpv6Literal = false;
  if (authority.charAt(0) === '[') {
    var closeBracket = authority.indexOf(']');
    if (closeBracket === -1) {
      return { valid: false, reason: 'URL is not valid' };
    }
    hostname = authority.substring(1, closeBracket).toLowerCase();
    isIpv6Literal = true;
  } else {
    hostname = authority.split(':')[0].toLowerCase();
  }

  // "localhost." is the DNS root form of "localhost" and resolves the same.
  if (hostname.charAt(hostname.length - 1) === '.') {
    hostname = hostname.substring(0, hostname.length - 1);
  }

  if (!hostname) {
    return { valid: false, reason: 'URL is not valid' };
  }

  // Clients split whitespace and stray delimiters differently, so a host
  // carrying them cannot be reasoned about here.
  var hostCharset = isIpv6Literal ? /^[0-9a-f:.%]+$/ : /^[a-z0-9._-]+$/;
  if (!hostCharset.test(hostname)) {
    return {
      valid: false,
      reason: 'Host "' + hostname + '" contains characters that are not allowed in a hostname'
    };
  }

  if (hostname.indexOf(':') !== -1) {
    var groups = parseIpv6(hostname);
    if (!groups) {
      return { valid: false, reason: 'IPv6 host "' + hostname + '" is not valid' };
    }
    var ipv6Reason = internalIpv6Reason(groups);
    if (ipv6Reason) {
      return { valid: false, reason: ipv6Reason };
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
