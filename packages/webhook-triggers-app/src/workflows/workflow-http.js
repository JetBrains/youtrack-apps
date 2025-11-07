/**
 * HTTP and webhook communication utilities for YouTrack workflow rules.
 */

const http = require('@jetbrains/youtrack-scripting-api/http');

/**
 * Parses comma or newline separated webhook URLs from settings
 * @param {string} webhooksStr - Comma or newline separated webhook URLs
 * @returns {Array<string>} Array of trimmed, non-empty URLs
 */
function parseWebhookUrls(webhooksStr) {
  if (!webhooksStr || typeof webhooksStr !== 'string') {
    return [];
  }
  return webhooksStr.split(/[,\n]/)  // Split by comma OR newline
    .map(function(s) { return s.trim(); })
    .filter(function(s) { return s.length > 0; });
}

/**
 * Logs webhook response details
 * @param {Object} postResult - The HTTP response object
 * @param {string} url - The webhook URL
 */
function logWebhookResponse(postResult, url) {
  console.log('[webhooks] Webhook sent successfully to ' + url);
  if (postResult) {
    console.log('[webhooks] Response code: ' + (postResult.code || 'unknown'));
    console.log('[webhooks] Response available fields: ' + Object.keys(postResult).join(', '));
    if (postResult.response) {
      console.log('[webhooks] Response body: ' + postResult.response);
    }
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
 * @returns {Object|null} The HTTP response or null on error
 */
function sendWebhook(url, payload, eventName) {
  try {
    console.log('[webhooks] Sending ' + eventName + ' webhook to: ' + url);
    console.log('[webhooks] Payload: ' + JSON.stringify(payload));

    const connection = new http.Connection(url.trim());
    connection.addHeader('Content-Type', 'application/json');

    const postResult = connection.postSync('', '', JSON.stringify(payload));

    logWebhookResponse(postResult, url);
    return postResult;
  } catch (error) {
    logWebhookError(error, url);
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
  const webhooksStr = ctx.settings[settingsKey] || '';
  const webhookUrls = parseWebhookUrls(webhooksStr);

  if (webhookUrls.length === 0) {
    console.log('[webhooks] No webhook URLs configured for ' + eventName);
    return;
  }

  console.log('[webhooks] Sending webhooks to ' + webhookUrls.length + ' URL(s)');
  webhookUrls.forEach(function(url) {
    if (url && url.trim()) {
      sendWebhook(url, payload, eventName);
    }
  });
}

exports.parseWebhookUrls = parseWebhookUrls;
exports.sendWebhook = sendWebhook;
exports.sendWebhooks = sendWebhooks;

