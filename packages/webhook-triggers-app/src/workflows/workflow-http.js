/**
 * Webhook delivery via async function chain: the sync action dispatches URL #1
 * via postAsync, whose response handler `logAndPostNext` dispatches the next
 * URL, and so on — one async hop per URL, capped by MAX_WEBHOOK_URLS_PER_EVENT
 * (the server's async chain limit).
 *
 * `ctx.settings.triggers` is an array of `{event, endpoints}` rows, each
 * `endpoints` an array of `{url, secret}`. `secret` is a live `format: 'secret'`
 * object that must reach http.js unmodified — the JVM substitutes the real
 * value at send time. Stringifying it yields the mask `<***>`, and it can't be
 * round-tripped through ctx.store. So only the URL queue crosses async hops;
 * each URL's secret is re-resolved from ctx.settings.triggers at dispatch time.
 */

const http = require('@jetbrains/youtrack-scripting-api/http');
const security = require('./workflow-security');
const {ALL_EVENTS_TYPE} = require('./constants');

const WEBHOOK_TIMEOUT_MS = 5000;
const MAX_WEBHOOK_URLS_PER_EVENT = 10;

const STORE_URLS = 'webhookUrls';
const STORE_EVENT_TYPE = 'webhookEventType';
const STORE_PAYLOAD = 'webhookPayload';
const STORE_EVENT = 'webhookEvent';
const STORE_CURRENT_URL = 'webhookCurrentUrl';

/**
 * Normalizes a settings array into a plain JS array. Real arrays are returned
 * as-is; other runtimes may hand back a host wrapper instead, so each shape is
 * tried in turn. Every probe — including the property read itself, which can
 * throw for a non-whitelisted host getter — is guarded so this never throws
 * (which would block issue creation); worst case is an empty list.
 */
function toRows(value) {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  const out = [];
  try {
    if (typeof value.forEach === 'function') {
      value.forEach(function (row) { out.push(row); });
      return out;
    }
  } catch (e) {
    out.length = 0;
  }
  try {
    for (const row of value) {
      out.push(row);
    }
    if (out.length) {
      return out;
    }
  } catch (e) {
    out.length = 0;
  }
  try {
    if (typeof value.size === 'function' && typeof value.get === 'function') {
      const n = value.size();
      for (let i = 0; i < n; i++) {
        out.push(value.get(i));
      }
      return out;
    }
  } catch (e) {
    out.length = 0;
  }
  try {
    if (typeof value.length === 'number') {
      for (let i = 0; i < value.length; i++) {
        out.push(value[i]);
      }
      return out;
    }
  } catch (e) {
    out.length = 0;
  }
  console.warn('[webhooks] Could not read triggers setting in this context; treating as empty.');
  return out;
}

/**
 * Reads one field from a row that may be a plain object or a host Map-like
 * object (`.get(key)`). Guarded like toRows so a hostile row can't throw.
 * For `secret` this returns the live setting object, never a string.
 */
function rowField(row, key) {
  if (row == null) {
    return undefined;
  }
  try {
    const direct = row[key];
    if (direct !== undefined) {
      return direct;
    }
    if (typeof row.get === 'function') {
      return row.get(key);
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
}

function normalizeUrl(endpoint) {
  try {
    const raw = rowField(endpoint, 'url');
    return raw != null ? String(raw).trim() : '';
  } catch (e) {
    return '';
  }
}

function rowMatchesEvent(row, eventType) {
  const event = rowField(row, 'event');
  return event === eventType || event === ALL_EVENTS_TYPE;
}

function endpointsOf(row) {
  return toRows(rowField(row, 'endpoints'));
}

/**
 * Ordered, de-duplicated URLs configured for an event, across every matching
 * row (event-specific + "All events") and each row's endpoints. URLs only —
 * secrets are resolved separately, live, at dispatch time.
 */
function getWebhookTargets(ctx, eventType) {
  const rows = toRows(ctx.settings.triggers);

  const seen = {};
  const urls = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || typeof row !== 'object' || !rowMatchesEvent(row, eventType)) {
      continue;
    }
    const endpoints = endpointsOf(row);
    for (let j = 0; j < endpoints.length; j++) {
      const url = normalizeUrl(endpoints[j]);
      if (!url || seen[url]) {
        continue;
      }
      seen[url] = true;
      urls.push(url);
    }
  }
  return urls;
}

/**
 * Resolves the live secret object for a given event+URL, matching
 * getWebhookTargets' precedence: the first matching endpoint of the first
 * matching row wins, so a URL listed twice is called once with the token of
 * the row that declared it first. Returns null when the endpoint has no token.
 */
function resolveTriggerSecret(ctx, eventType, url) {
  const rows = toRows(ctx.settings.triggers);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || typeof row !== 'object' || !rowMatchesEvent(row, eventType)) {
      continue;
    }
    const endpoints = endpointsOf(row);
    for (let j = 0; j < endpoints.length; j++) {
      if (normalizeUrl(endpoints[j]) !== url) {
        continue;
      }
      const secret = rowField(endpoints[j], 'secret');
      return secret ? secret : null;
    }
  }
  return null;
}

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
  // Response body not logged - SSRF: receivers may reflect internal data.
}

/**
 * Validates a URL, resolves its live secret, persists post-dispatch state, then
 * fires postAsync with `logAndPostNext` as the response handler. Stores BEFORE
 * scheduling per the async-functions "store before invoke" guidance.
 * @returns {boolean} true on scheduled, false on rejection (caller may retry next URL).
 */
function tryPostWebhook(ctx, url, remainingUrls, eventType, headerName, payloadJson) {
  const validation = security.validateWebhookUrl(url);
  if (!validation.valid) {
    console.error('[webhooks] Blocked webhook to ' + url + ': ' + validation.reason);
    return false;
  }

  // Fail closed: no token means skip rather than send an unauthenticated request.
  const secret = resolveTriggerSecret(ctx, eventType, url);
  if (!secret) {
    console.warn('[webhooks] Trigger for ' + url + ' has no token configured; skipping to avoid an unauthenticated request');
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
    security.addSecurityHeaders(connection, secret, headerName);
    connection.postAsync('', '', payloadJson, 'logAndPostNext');
    return true;
  } catch (error) {
    const errorMessage = error.message || error.toString() || 'Unknown error';
    console.error('[webhooks] Failed to schedule webhook to ' + url + ': ' + errorMessage);
    return false;
  }
}

/**
 * Dispatches the next valid URL via postAsync. Invalid / tokenless URLs are
 * skipped synchronously without consuming an async hop.
 * @returns {boolean} true if scheduled, false if no valid URLs remain.
 */
function postNextValid(ctx) {
  const headerName = ctx.settings.headerName;

  // Fail closed if the header name was cleared mid-chain — without it the
  // token cannot be attached and requests would go out unauthenticated.
  if (!headerName) {
    console.warn('[webhooks] Header name was cleared during chain execution; aborting remaining dispatches');
    return false;
  }

  const eventType = ctx.load(STORE_EVENT_TYPE);
  const payloadJson = ctx.load(STORE_PAYLOAD);
  const urlsJson = ctx.load(STORE_URLS);
  const urls = urlsJson ? JSON.parse(urlsJson) : [];

  while (urls.length > 0) {
    const url = urls.shift();
    if (tryPostWebhook(ctx, url, urls, eventType, headerName, payloadJson)) {
      return true;
    }
  }

  ctx.store(STORE_URLS, JSON.stringify(urls));
  return false;
}

function logAndPostNext(ctx) {
  const url = ctx.load(STORE_CURRENT_URL);
  logWebhookResponse(ctx.response, url);
  postNextValid(ctx);
}

/**
 * Schedules webhooks via the async function chain. Call from a rule's sync
 * `action`. The rule must declare `asyncFunctions: core.asyncFunctions`.
 */
function sendWebhooks(ctx, eventType, payload, eventName) {
  const headerName = ctx.settings.headerName || null;
  if (!headerName) {
    console.warn('[webhooks] No header name configured - webhooks disabled for ' + eventName);
    return;
  }

  const urls = getWebhookTargets(ctx, eventType);

  if (urls.length === 0) {
    console.log('[webhooks] No webhook triggers configured for ' + eventName);
    return;
  }

  // Filter invalid URLs first so the cap applies to URLs that can actually be dispatched.
  const validUrls = urls.filter(function (url) {
    const validation = security.validateWebhookUrl(url);
    if (!validation.valid) {
      console.error('[webhooks] Blocked webhook to ' + url + ': ' + validation.reason);
      return false;
    }
    return true;
  });

  if (validUrls.length === 0) {
    console.log('[webhooks] No valid webhook triggers for ' + eventName);
    return;
  }

  let dispatchUrls = validUrls;
  if (validUrls.length > MAX_WEBHOOK_URLS_PER_EVENT) {
    console.warn('[webhooks] ' + validUrls.length + ' valid triggers configured for ' + eventName + ' but max is ' + MAX_WEBHOOK_URLS_PER_EVENT + ' per event (async chain limit). Extra triggers dropped.');
    dispatchUrls = validUrls.slice(0, MAX_WEBHOOK_URLS_PER_EVENT);
  }

  ctx.store(STORE_URLS, JSON.stringify(dispatchUrls));
  ctx.store(STORE_EVENT_TYPE, eventType);
  ctx.store(STORE_PAYLOAD, JSON.stringify(payload));
  ctx.store(STORE_EVENT, eventName);

  console.log('[webhooks] Scheduling ' + dispatchUrls.length + ' webhook(s) for ' + eventName);
  postNextValid(ctx);
}

const asyncFunctions = {
  logAndPostNext: logAndPostNext,
};

exports.getWebhookTargets = getWebhookTargets;
exports.resolveTriggerSecret = resolveTriggerSecret;
exports.sendWebhooks = sendWebhooks;
exports.logAndPostNext = logAndPostNext;
exports.logWebhookResponse = logWebhookResponse;
exports.postNextValid = postNextValid;
exports.asyncFunctions = asyncFunctions;
exports.MAX_WEBHOOK_URLS_PER_EVENT = MAX_WEBHOOK_URLS_PER_EVENT;
exports.WEBHOOK_TIMEOUT_MS = WEBHOOK_TIMEOUT_MS;
