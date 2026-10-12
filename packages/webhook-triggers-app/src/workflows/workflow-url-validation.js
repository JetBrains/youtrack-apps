/**
 * Webhook URL validation to prevent SSRF.
 */

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

// Ranges mirror the server's HostedOutboundConnectionFilter. Each entry tests
// the first two octets of an address.
var INTERNAL_IPV4_RANGES = [
  { test: function (a) { return a === 127; }, reason: 'Loopback addresses (127.x.x.x) are not allowed' },
  { test: function (a) { return a === 0; }, reason: 'Unspecified addresses (0.x.x.x) are not allowed' },
  { test: function (a) { return a === 10; }, reason: 'Private network addresses (10.x.x.x) are not allowed' },
  {
    test: function (a, b) { return a === 172 && b >= 16 && b <= 31; },
    reason: 'Private network addresses (172.16-31.x.x) are not allowed'
  },
  {
    test: function (a, b) { return a === 192 && b === 168; },
    reason: 'Private network addresses (192.168.x.x) are not allowed'
  },
  {
    test: function (a, b) { return a === 169 && b === 254; },
    reason: 'Link-local addresses (169.254.x.x) are not allowed — these include cloud metadata endpoints'
  },
  {
    test: function (a, b) { return a === 100 && b >= 64 && b <= 127; },
    reason: 'Carrier-grade NAT addresses (100.64-127.x.x) are not allowed'
  }
];

function allowed() {
  return { valid: true, reason: null };
}

function reject(reason) {
  return { valid: false, reason: reason };
}

function internalIpv4Reason(a, b) {
  for (var i = 0; i < INTERNAL_IPV4_RANGES.length; i++) {
    if (INTERNAL_IPV4_RANGES[i].test(a, b)) {
      return INTERNAL_IPV4_RANGES[i].reason;
    }
  }
  return null;
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

// True when the first 16-bit group of an IPv6 address falls in prefix/len,
// given as the group's mask (e.g. 0xfe00 for /7) and the expected masked value.
function groupInPrefix(group, mask, expected) {
  return (group & mask) === expected;
}

function internalIpv6Reason(g) {
  var firstSixZero = (g[0] | g[1] | g[2] | g[3] | g[4] | g[5]) === 0;
  var firstFiveZero = (g[0] | g[1] | g[2] | g[3] | g[4]) === 0;
  if (firstSixZero && g[6] === 0 && (g[7] === 0 || g[7] === 1)) {
    return 'Loopback or unspecified addresses (::, ::1) are not allowed';
  }

  var isMapped = firstFiveZero && g[5] === 0xffff; // ::ffff:a.b.c.d
  var isCompatible = firstSixZero; // ::a.b.c.d
  var isNat64 = g[0] === 0x64 && g[1] === 0xff9b && (g[2] | g[3] | g[4] | g[5]) === 0; // 64:ff9b::/96
  if (isMapped || isCompatible || isNat64) {
    var embeddedReason = internalIpv4Reason(g[6] >> 8, g[6] & 255);
    if (embeddedReason) {
      return embeddedReason;
    }
  }

  if (groupInPrefix(g[0], 0xfe00, 0xfc00)) {
    return 'Unique-local IPv6 addresses (fc00::/7) are not allowed';
  }
  if (groupInPrefix(g[0], 0xffc0, 0xfe80)) {
    return 'Link-local IPv6 addresses (fe80::/10) are not allowed';
  }
  if (groupInPrefix(g[0], 0xffc0, 0xfec0)) {
    return 'Site-local IPv6 addresses (fec0::/10) are not allowed';
  }
  return null;
}

function ipv6HostReason(hostname) {
  var groups = parseIpv6(hostname);
  if (!groups) {
    return 'IPv6 host "' + hostname + '" is not valid';
  }
  return internalIpv6Reason(groups);
}

function isNumericHost(hostname) {
  return /^(0x[0-9a-f]+|[0-9]+)(\.(0x[0-9a-f]+|[0-9]+))*$/.test(hostname);
}

function numericHostReason(hostname) {
  var octets = canonicalDottedQuad(hostname);
  if (!octets) {
    return 'Ambiguous numeric host "' + hostname + '" is not allowed — ' +
      'write an IPv4 address as four dotted decimal octets';
  }
  return internalIpv4Reason(octets[0], octets[1]);
}

/**
 * Wildcard resolvers encode the target in the name: 127.0.0.1.nip.io,
 * 127-0-0-1.sslip.io. The patterns are deliberately lenient (\d{1,3}, no
 * canonical-form check): a name is only inspected for an address that appears
 * to be embedded, unlike a numeric host, which is the address itself.
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

function nameHostReason(hostname) {
  return loopbackDomainReason(hostname) || embeddedIpv4Reason(hostname);
}

/**
 * Host of an http(s) URL, as the HTTP client will read it.
 * @returns {{hostname: string, isIpv6: boolean, failure: null}|{failure: string}}
 */
function extractHost(url) {
  var schemeMatch = url.match(/^([a-zA-Z][a-zA-Z0-9+\-.]*):(.*)$/);
  if (!schemeMatch) {
    return { failure: 'URL is not valid' };
  }

  var scheme = schemeMatch[1].toLowerCase();
  if (scheme !== 'http' && scheme !== 'https') {
    return { failure: 'Only http:// and https:// schemes are allowed' };
  }

  var rest = schemeMatch[2];
  if (rest.substring(0, 2) !== '//') {
    return { failure: 'URL is not valid' };
  }

  // Host of http://example.com@127.0.0.1/ is 127.0.0.1, and for http(s) a
  // backslash ends the authority, so http://127.0.0.1\@evil.com/ is 127.0.0.1.
  var authority = rest.substring(2).split(/[/?#\\]/)[0];
  var atIndex = authority.lastIndexOf('@');
  if (atIndex !== -1) {
    authority = authority.substring(atIndex + 1);
  }

  var hostname;
  var isIpv6 = false;
  if (authority.charAt(0) === '[') {
    var closeBracket = authority.indexOf(']');
    if (closeBracket === -1) {
      return { failure: 'URL is not valid' };
    }
    hostname = authority.substring(1, closeBracket).toLowerCase();
    isIpv6 = true;
  } else {
    hostname = authority.split(':')[0].toLowerCase();
  }

  // "localhost." is the DNS root form of "localhost" and resolves the same.
  if (hostname.charAt(hostname.length - 1) === '.') {
    hostname = hostname.substring(0, hostname.length - 1);
  }

  if (!hostname) {
    return { failure: 'URL is not valid' };
  }

  // Clients split whitespace and stray delimiters differently, so a host
  // carrying them cannot be reasoned about here.
  var hostCharset = isIpv6 ? /^[0-9a-f:.%]+$/ : /^[a-z0-9._-]+$/;
  if (!hostCharset.test(hostname)) {
    return { failure: 'Host "' + hostname + '" contains characters that are not allowed in a hostname' };
  }

  return { hostname: hostname, isIpv6: isIpv6, failure: null };
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
    return reject('URL must be a non-empty string');
  }

  var host = extractHost(url);
  if (host.failure) {
    return reject(host.failure);
  }

  var reason;
  if (host.isIpv6) {
    reason = ipv6HostReason(host.hostname);
  } else if (isNumericHost(host.hostname)) {
    reason = numericHostReason(host.hostname);
  } else {
    reason = nameHostReason(host.hostname);
  }
  return reason ? reject(reason) : allowed();
}

exports.validateWebhookUrl = validateWebhookUrl;
