/**
 * Webhook delivery via async function chain.
 *
 * Sync action dispatches URL 1 via postAsync; the response handler
 * `logAndPostNext` logs the result and dispatches URL 2 via another postAsync,
 * and so on. Each URL costs one async hop. Server `maxChainLength = 10` by
 * default, giving the practical cap in {@link MAX_WEBHOOK_URLS_PER_EVENT}.
 */

const http = require('@jetbrains/youtrack-scripting-api/http');
const security = require('./workflow-security');

const WEBHOOK_TIMEOUT_MS = 5000;
const MAX_WEBHOOK_URLS_PER_EVENT = 10;

const STORE_URLS = 'webhookUrls';
const STORE_PAYLOAD = 'webhookPayload';
const STORE_EVENT = 'webhookEvent';
const STORE_CURRENT_URL = 'webhookCurrentUrl';

// `webhookToken` is `format: "secret"` — at the JS layer its toString() is
// the literal "secret", and that's what reaches the wire. Same as the sync
// baseline; awaits a platform-side fix.

/**
 * Parse comma or newline separated webhook URLs from settings
 * @param {string} webhooksStr - Comma or newline separated webhook URLs
 * @returns {Array<string>} Array of trimmed, non-empty URLs
 */
function parseWebhookUrls(webhooksStr) {
  if (!webhooksStr || typeof webhooksStr !== 'string') {
    return [];
  }
  return webhooksStr.split(/[,\n]/)
    .map(function (s) {
      return s.trim();
    })
    .filter(function (s) {
      return s.length > 0;
    });
}

/**
 * Gets all webhook URLs for an event, combining event-specific and "All Events" URLs.
 * Deduplicates URLs to avoid sending multiple times to the same endpoint.
 * @param {Object} ctx - The workflow context with settings
 * @param {string} settingsKey - The key in ctx.settings to get webhook URLs from
 * @returns {Array<string>} Deduplicated array of webhook URLs
 */
function getWebhookUrls(ctx, settingsKey) {
  const webhooksStr = ctx.settings[settingsKey] || '';
  const eventUrls = parseWebhookUrls(webhooksStr);

  const allEventsWebhooksStr = ctx.settings.webhooksOnAllEvents || '';
  const allEventsUrls = parseWebhookUrls(allEventsWebhooksStr);

  const urlSet = {};
  const allUrls = [];

  eventUrls.forEach(function (url) {
    if (url && !urlSet[url]) {
      allUrls.push(url);
      urlSet[url] = true;
    }
  });

  allEventsUrls.forEach(function (url) {
    if (url && !urlSet[url]) {
      allUrls.push(url);
      urlSet[url] = true;
    }
  });

  return allUrls;
}

/**
 * Logs the outcome of a single webhook delivery.
 * @param {Object} response - ctx.response from the postAsync handler
 * @param {string} url - The webhook URL that was hit
 */
function logWebhookResponse(response, url) {
  if (!response) {
    console.warn('[webhooks] No response object received for ' + url);
    return;
  }
  if (response.exception) {
    console.error('[webhooks] Webhook to ' + url + ' failed: ' + response.exception);
    return;
  }
  if (!response.code) {
    console.warn('[webhooks] Webhook request to ' + url + ' completed but returned no status code (likely timeout after ' + WEBHOOK_TIMEOUT_MS + 'ms)');
    return;
  }

  console.log('[webhooks] Webhook sent successfully to ' + url);
  console.log('[webhooks] Response code: ' + response.code);
  // Response body not logged — SSRF: receivers may reflect internal data.
}

/**
 * Validates a URL, persists post-dispatch state, then fires postAsync with
 * `logAndPostNext` as the response handler. Stores BEFORE scheduling per
 * the async-functions "store before invoke" guidance.
 * @returns {boolean} true on scheduled, false on rejection (caller may retry next URL).
 */
function tryPostWebhook(ctx, url, remainingUrls, token, headerName, payloadJson) {
  const validation = security.validateWebhookUrl(url);
  if (!validation.valid) {
    console.error('[webhooks] Blocked webhook to ' + url + ': ' + validation.reason);
    return false;
  }

  if (url.startsWith('http://')) {
    console.warn('[webhooks] Warning: webhook URL uses HTTP (not HTTPS) — the webhook token will be transmitted in plaintext. HTTPS is strongly recommended: ' + url);
  }

  ctx.store(STORE_URLS, JSON.stringify(remainingUrls));
  ctx.store(STORE_CURRENT_URL, url);

  try {
    const connection = new http.Connection(url, null, WEBHOOK_TIMEOUT_MS);
    connection.addHeader('Content-Type', 'application/json');
    security.addSecurityHeaders(connection, token, headerName);
    connection.postAsync('', '', payloadJson, 'logAndPostNext');
    return true;
  } catch (error) {
    const errorMessage = error.message || error.toString() || 'Unknown error';
    console.error('[webhooks] Failed to schedule webhook to ' + url + ': ' + errorMessage);
    return false;
  }
}

/**
 * Dispatches the next valid URL via postAsync. Invalid URLs are skipped
 * synchronously without consuming an async hop.
 * @returns {boolean} true if scheduled, false if no valid URLs remain.
 */
function postNextValid(ctx) {
  const token = ctx.settings.webhookToken;
  const headerName = ctx.settings.headerName;

  // Fail closed if settings were cleared mid-chain — addHeader silently
  // skips a falsy token, which would fan out unauthenticated requests.
  if (!token || !headerName) {
    console.warn('[webhooks] Webhook token or header was cleared during chain execution; aborting remaining dispatches');
    return false;
  }

  const payloadJson = ctx.load(STORE_PAYLOAD);
  const urlsJson = ctx.load(STORE_URLS);
  const urls = urlsJson ? JSON.parse(urlsJson) : [];

  while (urls.length > 0) {
    const url = urls.shift();
    if (tryPostWebhook(ctx, url, urls, token, headerName, payloadJson)) {
      return true;
    }
  }

  ctx.store(STORE_URLS, JSON.stringify(urls));
  return false;
}

/**
 * Response handler for each postAsync. Logs the previous response and
 * dispatches the next URL.
 */
function logAndPostNext(ctx) {
  const url = ctx.load(STORE_CURRENT_URL);
  logWebhookResponse(ctx.response, url);
  postNextValid(ctx);
}

/**
 * Schedules webhooks via the async function chain. Call from a rule's sync
 * `action`. The rule must declare `asyncFunctions: core.asyncFunctions`.
 */
function sendWebhooks(ctx, settingsKey, payload, eventName) {
  const token = ctx.settings.webhookToken || null;
  if (!token) {
    console.warn('[webhooks] No webhook token configured - webhooks disabled for ' + eventName);
    return;
  }

  const headerName = ctx.settings.headerName || null;
  if (!headerName) {
    console.warn('[webhooks] No header name configured - webhooks disabled for ' + eventName);
    return;
  }

  const allUrls = getWebhookUrls(ctx, settingsKey);

  if (allUrls.length === 0) {
    console.log('[webhooks] No webhook URLs configured for ' + eventName);
    return;
  }

  // Filter invalid URLs first so the cap applies to URLs that can actually be dispatched.
  const validUrls = allUrls.filter(function (url) {
    const validation = security.validateWebhookUrl(url);
    if (!validation.valid) {
      console.error('[webhooks] Blocked webhook to ' + url + ': ' + validation.reason);
      return false;
    }
    return true;
  });

  if (validUrls.length === 0) {
    console.log('[webhooks] No valid webhook URLs for ' + eventName);
    return;
  }

  let urls = validUrls;
  if (validUrls.length > MAX_WEBHOOK_URLS_PER_EVENT) {
    console.warn('[webhooks] ' + validUrls.length + ' valid URLs configured for ' + eventName + ' but max is ' + MAX_WEBHOOK_URLS_PER_EVENT + ' per event (async chain limit). Extra URLs dropped.');
    urls = validUrls.slice(0, MAX_WEBHOOK_URLS_PER_EVENT);
  }

  ctx.store(STORE_URLS, JSON.stringify(urls));
  ctx.store(STORE_PAYLOAD, JSON.stringify(payload));
  ctx.store(STORE_EVENT, eventName);

  console.log('[webhooks] Scheduling ' + urls.length + ' webhook(s) for ' + eventName);
  postNextValid(ctx);
}

const asyncFunctions = {
  logAndPostNext: logAndPostNext,
};

exports.parseWebhookUrls = parseWebhookUrls;
exports.getWebhookUrls = getWebhookUrls;
exports.sendWebhooks = sendWebhooks;
exports.logAndPostNext = logAndPostNext;
exports.logWebhookResponse = logWebhookResponse;
exports.postNextValid = postNextValid;
exports.asyncFunctions = asyncFunctions;
exports.MAX_WEBHOOK_URLS_PER_EVENT = MAX_WEBHOOK_URLS_PER_EVENT;
exports.WEBHOOK_TIMEOUT_MS = WEBHOOK_TIMEOUT_MS;
