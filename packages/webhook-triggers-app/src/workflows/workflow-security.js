/**
 * Security utilities for webhook authentication and validation.
 */

/**
 * Validates that a webhook signature is configured
 * @param {string} signature - The signature to validate
 * @returns {boolean} True if signature is valid (non-empty)
 */
function isSignatureValid(signature) {
  return !!(signature && signature.trim());
}

/**
 * Validates webhook signature from settings and logs error if invalid
 * @param {Object} ctx - The workflow context
 * @returns {string|null} The signature if valid, null if invalid
 */
function validateWebhookSignature(ctx) {
  const signature = ctx.settings.webhookSignature || '';

  if (!isSignatureValid(signature)) {
    console.error('[webhooks] ERROR: Webhook signature is not configured. Webhooks cannot be sent for security reasons.');
    console.error('[webhooks] Please configure the webhook signature in app settings.');
    return null;
  }

  const minimumLength = 32;
  if (signature.length < minimumLength) {
    console.error('[webhooks] ERROR: Webhook signature must be at least 32 characters long.');
    return null;
  }

  return signature.trim();
}

/**
 * Adds security headers to an HTTP connection
 * @param {Object} connection - The HTTP connection object
 * @param {string} signature - The webhook signature for authentication
 */
function addSecurityHeaders(connection, signature) {
  if (signature && signature.trim()) {
    connection.addHeader('X-YouTrack-Signature', signature.trim());
    console.log('[webhooks] Added X-YouTrack-Signature header');
  }
}

exports.isSignatureValid = isSignatureValid;
exports.validateWebhookSignature = validateWebhookSignature;
exports.addSecurityHeaders = addSecurityHeaders;
