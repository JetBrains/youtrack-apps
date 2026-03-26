/**
 * CJS stub for @jetbrains/youtrack-scripting-api/http used in tests.
 * Loaded via Module._resolveFilename patch in setup.js.
 */

class Connection {
  constructor(url) {
    this.url = url;
    this.headers = {};
  }
  addHeader(name, value) { this.headers[name] = value; }
  postSync() { return { code: 200, response: '' }; }
}

module.exports = { Connection };