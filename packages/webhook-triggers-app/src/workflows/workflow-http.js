/**
 * HTTP and webhook communication utilities for YouTrack workflow rules.
 */

const http = require('@jetbrains/youtrack-scripting-api/http');
const security = require('./workflow-security');

/**
 * Timeout for webhook HTTP connections in milliseconds
 */
const WEBHOOK_TIMEOUT_MS = 5000;

/**
 * Minimum recommended token length (mirrors the schema minLength on webhookToken)
 */
const MIN_TOKEN_LENGTH = 32;

/**
 * Parse comma or newline separated webhook entries from settings.
 * Each line may be "url" or "url token" (split on first whitespace).
 * @param {string} webhooksStr
 * @returns {Array<{url: string, token: string|null}>}
 */
function parseWebhookEntries(webhooksStr) {
  if (!webhooksStr || typeof webhooksStr !== 'string') {
    return [];
  }
  return webhooksStr.split(/[,\n]/)
    .map(function(segment) {
      var trimmed = segment.trim();
      if (!trimmed) {return null;}
      var spaceIdx = trimmed.search(/\s/);
      if (spaceIdx === -1) {
        return { url: trimmed, token: null };
      }
      var url = trimmed.slice(0, spaceIdx);
      var token = trimmed.slice(spaceIdx).trim();
      return { url: url, token: token || null };
    })
    .filter(function(e) { return e !== null; });
}

/**
 * Parse comma or newline separated webhook URLs from settings
 * @param {string} webhooksStr - Comma or newline separated webhook URLs
 * @returns {Array<string>} Array of trimmed, non-empty URLs
 */
function parseWebhookUrls(webhooksStr) {
  return parseWebhookEntries(webhooksStr).map(function(e) { return e.url; });
}

/**
 * Gets all webhook entries for an event, combining event-specific and "All Events" entries.
 * Deduplicates by URL (first-wins; event-specific is processed first).
 * @param {Object} ctx - The workflow context with settings
 * @param {string} settingsKey - The key in ctx.settings to get webhook entries from
 * @returns {Array<{url: string, token: string|null}>}
 */
function getWebhookEntries(ctx, settingsKey) {
  var eventEntries = parseWebhookEntries(ctx.settings[settingsKey] || '');
  var allEventsEntries = parseWebhookEntries(ctx.settings.webhooksOnAllEvents || '');

  var tokenByUrl = Object.create(null);
  var order = [];

  function addEntry(entry) {
    if (!entry.url) { return; }
    if (!(entry.url in tokenByUrl)) {
      order.push(entry.url);
      tokenByUrl[entry.url] = entry.token;
    } else if (tokenByUrl[entry.url] == null && entry.token != null) {
      tokenByUrl[entry.url] = entry.token;
    }
  }

  eventEntries.forEach(addEntry);
  allEventsEntries.forEach(addEntry);

  return order.map(function(url) { return { url: url, token: tokenByUrl[url] }; });
}

/**
 * Gets all webhook URLs for an event, combining event-specific and "All Events" URLs.
 * Deduplicates URLs to avoid sending multiple times to the same endpoint.
 * @param {Object} ctx - The workflow context with settings
 * @param {string} settingsKey - The key in ctx.settings to get webhook URLs from
 * @returns {Array<string>} Deduplicated array of webhook URLs
 */
function getWebhookUrls(ctx, settingsKey) {
  return getWebhookEntries(ctx, settingsKey).map(function(e) { return e.url; });
}

/**
 * Logs webhook response details
 * @param {Object} postResult - The HTTP response object
 * @param {string} url - The webhook URL
 */
function logWebhookResponse(postResult, url) {
  if (postResult && !postResult.code) {
    console.warn('[webhooks] Webhook request to ' + url + ' completed but returned no status code (likely timeout after ' + WEBHOOK_TIMEOUT_MS + 'ms)');
    return;
  }

  console.log('[webhooks] Webhook sent successfully to ' + url);
  if (postResult) {
    console.log('[webhooks] Response code: ' + (postResult.code || 'unknown'));
    // Response body is intentionally not logged to prevent exposure of data
    // from internal services reachable from the YouTrack server (SSRF).
  }
}

/**
 * Logs webhook error details
 * @param {Error} error - The error object
 * @param {string} url - The webhook URL
 */
function logWebhookError(error, url) {
  console.error('[webhooks] Failed to send webhook to ' + url);
  const errorMessage = error.message || error.toString() || 'Unknown error';
  const errorStack = error.stack || 'No stack trace';
  console.error('[webhooks] Error: ' + errorMessage);
  console.error('[webhooks] Error stack: ' + errorStack);
}

/**
 * Sends a webhook to a single URL
 * @param {string} url - The webhook URL
 * @param {Object} payload - The data to send
 * @param {string} eventName - Name of the event for logging
 * @param {string} [token] - Token for authentication header
 * @param {string} [headerName] - Name of the HTTP header for the token
 * @returns {Object|null} The HTTP response or null on error
 */
function sendWebhook(url, payload, eventName, token, headerName) {
  const trimmedUrl = url.trim();
  const validation = security.validateWebhookUrl(trimmedUrl);
  if (!validation.valid) {
    console.error('[webhooks] Blocked webhook to ' + trimmedUrl + ': ' + validation.reason);
    return null;
  }

  if (trimmedUrl.startsWith('http://')) {
    console.warn('[webhooks] Warning: webhook URL uses HTTP (not HTTPS) — the webhook token will be transmitted in plaintext. HTTPS is strongly recommended: ' + trimmedUrl);
  }
  try {
    const connection = new http.Connection(trimmedUrl, null, WEBHOOK_TIMEOUT_MS);
    connection.addHeader('Content-Type', 'application/json');
    security.addSecurityHeaders(connection, token, headerName);

    const postResult = connection.postSync('', '', JSON.stringify(payload));

    logWebhookResponse(postResult, trimmedUrl);
    return postResult;
  } catch (error) {
    logWebhookError(error, trimmedUrl);
    return null;
  }
}

/**
 * Sends webhooks to all configured URLs
 * @param {Object} ctx - The workflow context
 * @param {string} settingsKey - The key in ctx.settings to get webhook URLs from
 * @param {Object} payload - The data to send
 * @param {string} eventName - Name of the event for logging
 */
function sendWebhooks(ctx, settingsKey, payload, eventName) {
  var headerName = ctx.settings.headerName || 'X-YouTrack-Token';
  var globalToken = ctx.settings.webhookToken || null;

  var allEntries = getWebhookEntries(ctx, settingsKey);
  if (allEntries.length === 0) {
    console.log('[webhooks] No webhook URLs configured for ' + eventName);
    return;
  }

  console.log('[webhooks] Sending webhooks to ' + allEntries.length + ' URL(s)');

  var fallbackCount = 0;
  allEntries.forEach(function(entry) {
    var effectiveToken = entry.token != null ? entry.token : globalToken;
    if (effectiveToken == null) {
      console.warn('[webhooks] No token configured for ' + entry.url + ' — skipping');
      return;
    }
    if (/\s/.test(effectiveToken)) {
      console.warn('[webhooks] Token for ' + entry.url + ' contains whitespace — HTTP header values with spaces may be rejected by some services.');
    }
    if (entry.token != null && entry.token.length < MIN_TOKEN_LENGTH) {
      console.warn('[webhooks] Inline token for ' + entry.url + ' is shorter than ' + MIN_TOKEN_LENGTH + ' characters — short tokens are easier to brute-force. Consider using a longer token.');
    }
    if (entry.token == null) {
      fallbackCount++;
    }
    sendWebhook(entry.url, payload, eventName, effectiveToken, headerName);
  });

  if (fallbackCount > 1) {
    console.warn(
      '[webhooks] ' + fallbackCount + ' webhook URLs are sharing the global webhookToken fallback. ' +
      'A token compromise at any one endpoint exposes all others sharing the same token. ' +
      'Add a per-line inline token to each URL: https://example.com mytoken'
    );
  }
}

exports.parseWebhookEntries = parseWebhookEntries;
exports.parseWebhookUrls = parseWebhookUrls;
exports.getWebhookEntries = getWebhookEntries;
exports.getWebhookUrls = getWebhookUrls;
exports.sendWebhook = sendWebhook;
exports.sendWebhooks = sendWebhooks;

