/**
 * Test helper: a minimal stand-in for the async-function ctx object.
 *
 * - `settings` is the workflow settings map.
 * - `store(key, value)` and `load(key)` back into an internal Map.
 * - `invokeAsync(name, delay)` records the scheduled call. Tests can
 *   invoke the recorded async function by reading `invocations` and
 *   calling `run(name)`.
 * - `response` is null by default; tests assign it before re-entering
 *   an async handler to simulate a webhook response.
 */
export function createCtx({ settings = {}, asyncFunctions = {} } = {}) {
  const storeMap = new Map();
  const invocations = [];

  const ctx = {
    settings,
    response: null,
    store(key, value) {
      storeMap.set(key, value);
    },
    load(key) {
      return storeMap.has(key) ? storeMap.get(key) : null;
    },
    invokeAsync(name, delay) {
      invocations.push({ name, delay });
    },
  };

  ctx._storeMap = storeMap;
  ctx._invocations = invocations;
  ctx._asyncFunctions = asyncFunctions;
  ctx.run = function (name) {
    const fn = asyncFunctions[name];
    if (!fn) {
      throw new Error('No async function: ' + name);
    }
    fn(ctx);
  };

  return ctx;
}
