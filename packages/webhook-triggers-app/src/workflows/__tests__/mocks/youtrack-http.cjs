/**
 * CJS stub for @jetbrains/youtrack-scripting-api/http used in tests.
 * Loaded via Module._resolveFilename patch in setup.js.
 *
 * Each Connection instance records all calls. The `instances` array is
 * attached to globalThis so that this stub (loaded as CJS by Node) and an
 * ESM-side mirror loaded by Vitest share the same recording — Vitest's
 * resolver does not always reuse Node's CJS require cache, so a plain
 * module-level array would drift between the two loaders.
 */

if (!globalThis.__youtrackHttpStub) {
  globalThis.__youtrackHttpStub = { instances: [] };
}
const state = globalThis.__youtrackHttpStub;

class Connection {
  constructor(url, sslKeyName, timeout) {
    this.url = url;
    this.sslKeyName = sslKeyName;
    this.timeout = timeout;
    this.headers = {};
    this.calls = [];
    state.instances.push(this);
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

function reset() {
  state.instances.length = 0;
}

module.exports = {
  Connection,
  get instances() {
    return state.instances;
  },
  reset,
};