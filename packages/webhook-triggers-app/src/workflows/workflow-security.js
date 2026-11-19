/**
 * Security utilities for webhook authentication and validation.
 */


/** RFC 9110 `token`: the only characters an HTTP header name may contain. */
const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

/**
 * Whether `headerName` is a valid HTTP header name. A CR or LF in it would add
 * header lines to the request (JT-100132), so an invalid name is never sent or logged.
 * @param {*} headerName - The configured header name
 * @returns {boolean}
 */
function isValidHeaderName(headerName) {
  return typeof headerName === 'string' && HEADER_NAME_PATTERN.test(headerName);
}

/**
 * Adds security headers to an HTTP connection
 * @param {Object} connection - The HTTP connection object
 * @param {string|Object} token - Token value (supports YouTrack SecretAttributeValue)
 * @param {string} headerName - Name of the HTTP header to include the webhook token in requests
 * @throws {Error} If `headerName` is not a valid HTTP header name
 */
function addSecurityHeaders(connection, token, headerName) {
  if (token != null && headerName) {
    if (!isValidHeaderName(headerName)) {
      throw new Error('The header name setting is not a valid HTTP header name');
    }
    connection.addHeader(headerName, token);
    console.log(`[webhooks] Added ${headerName} header`);
  }
}

exports.addSecurityHeaders = addSecurityHeaders;
exports.isValidHeaderName = isValidHeaderName;
