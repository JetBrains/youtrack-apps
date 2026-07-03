// Compile-time fixture for `withStore` HTTP handler overload.
//
// Expected to compile cleanly under tsc. The positive lines fail if the overload
// regresses; the `@ts-expect-error` lines fail (unused directive) if the narrowing
// weakens. Wired via src/dx/test/types-strict-tsconfig.json (`npm run typecheck:types`).
//
// Asserts:
//   - withStore<S>() selects the HTTP overload (1 explicit type arg)
//   - AK is inferred from `asyncFunctions` keys (no manual union)
//   - ctx.store / ctx.load are typed against S in both the sync handle and the async ctx
//   - ctx.invokeAsync is narrowed to the declared AK union
//   - asyncFunctions is required (the intersection forces it)

import { withStore } from '../utility/withStore.js';

type MyStore = { count: number; label: string };

const httpHandler = withStore<MyStore>()({
  endpoints: [
    {
      scope: 'global',
      method: 'POST',
      path: '/tick',
      handle: (ctx) => {
        ctx.store('count', 1); // typed: S['count'] = number
        ctx.store('label', 'hello'); // typed: S['label'] = string
        const c: number | undefined = ctx.load('count'); // typed against S
        void c;

        ctx.invokeAsync('onTick'); // narrowed: 'onTick' | 'onDone'
        ctx.invokeAsync('onDone');

        // @ts-expect-error - value must match S['count'] (number, not string)
        ctx.store('count', 'not-a-number');
        // @ts-expect-error - 'missing' is not a key of S
        ctx.store('missing', 1);
        // @ts-expect-error - 'unknownFn' is not a declared async function key
        ctx.invokeAsync('unknownFn');

        ctx.response.json({ ok: true });
      },
    },
  ],
  asyncFunctions: {
    onTick: (ctx) => {
      const v: number | undefined = ctx.load('count'); // typed against S
      void v;
      // @ts-expect-error - 'missing' is not a key of S
      ctx.load('missing');
    },
    onDone: (ctx) => {
      ctx.store('label', 'done'); // typed against S
    },
  },
});

console.log(httpHandler);