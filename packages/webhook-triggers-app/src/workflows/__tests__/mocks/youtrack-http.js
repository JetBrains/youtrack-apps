/**
 * Minimal stub for @jetbrains/youtrack-scripting-api/http used in tests.
 * Tests that need to control Connection behaviour should vi.mock this module.
 */

export class Connection {
  constructor() {
    this.headers = {};
  }

  addHeader(name, value) {
    this.headers[name] = value;
  }

  postSync() {
    return { code: 200, response: '' };
  }
}