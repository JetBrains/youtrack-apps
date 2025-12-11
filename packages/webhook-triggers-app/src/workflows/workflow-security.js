/**
 * Security utilities for webhook authentication and validation.
 */


/**
 * Adds security headers to an HTTP connection
 * @param {Object} connection - The HTTP connection object
 * @param {*} signature - The webhook signature for authentication (can be string or SecretAttributeValue)
 */
function addSecurityHeaders(connection, signature) {
    if (signature != null) {
        connection.addHeader('X-YouTrack-Signature', signature);
        console.log('[webhooks] Added X-YouTrack-Signature header');
    }
}

exports.addSecurityHeaders = addSecurityHeaders;
