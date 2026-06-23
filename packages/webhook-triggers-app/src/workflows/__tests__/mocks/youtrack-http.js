/**
 * ESM mirror of the CJS stub for @jetbrains/youtrack-scripting-api/http.
 * Tests that need to inspect Connection behaviour should import from the
 * .cjs file (the one wired into Module._resolveFilename in setup.js) — this
 * ESM copy exists so the directory can be browsed without confusion.
 */

const instances = [];

export class Connection {
  constructor(url, sslKeyName, timeout) {
    this.url = url;
    this.sslKeyName = sslKeyName;
    this.timeout = timeout;
    this.headers = {};
    this.calls = [];
    instances.push(this);
  }
  addHeader(name, value) {
    this.headers[name] = value;
  }
  postSync(uri, queryParams, payload) {
    this.calls.push({ method: 'postSync', uri, queryParams, payload });
    return { code: 200, response: '' };
  }
  postAsync(uri, queryParams, payload, handlerName) {
    this.calls.push({ method: 'postAsync', uri, queryParams, payload, handlerName });
  }
}

export { instances };
