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
 * Validates a webhook URL to prevent SSRF attacks.
 * Rejects non-HTTP(S) schemes and RFC-1918 / loopback / link-local addresses.
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

  // Extract hostname: strip "//" prefix, then take up to the first / : or ?
  var afterScheme = rest.substring(2);
  var hostname = afterScheme.split(/[/:?#]/)[0].toLowerCase();

  if (!hostname) {
    return { valid: false, reason: 'URL is not valid' };
  }

  // Check IPv4 private / reserved ranges
  var ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    var a = parseInt(ipv4[1], 10);
    var b = parseInt(ipv4[2], 10);

    // 10.0.0.0/8 — RFC-1918
    if (a === 10) {
      return { valid: false, reason: 'Private network addresses (10.x.x.x) are not allowed' };
    }
    // 172.16.0.0/12 — RFC-1918
    if (a === 172 && b >= 16 && b <= 31) {
      return { valid: false, reason: 'Private network addresses (172.16-31.x.x) are not allowed' };
    }
    // 192.168.0.0/16 — RFC-1918
    if (a === 192 && b === 168) {
      return { valid: false, reason: 'Private network addresses (192.168.x.x) are not allowed' };
    }
    // 169.254.0.0/16 — link-local / cloud metadata endpoints
    if (a === 169 && b === 254) {
      return { valid: false, reason: 'Link-local addresses (169.254.x.x) are not allowed — these include cloud metadata endpoints' };
    }
  }

  return { valid: true, reason: null };
}

exports.addSecurityHeaders = addSecurityHeaders;
exports.validateWebhookUrl = validateWebhookUrl;
