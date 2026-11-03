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

exports.addSecurityHeaders = addSecurityHeaders;
