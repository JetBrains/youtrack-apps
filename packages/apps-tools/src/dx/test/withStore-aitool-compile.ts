// Compile-time fixture for `withStore` AI tool overload.
//
// Expected to compile cleanly under tsc. If the AI overload is missing or
// regresses, tsc fails on this file.
//
// Asserts:
//   - withStore<Args, TResult, S>() accepts 3 explicit type args
//   - The returned function infers AK from `asyncFunctions` keys
//   - ctx.arguments is typed as Args
//   - ctx.store / ctx.load are typed against S
//   - ctx.invokeAsync narrowed to declared AK union
//   - asyncFunctions is required (intersection forces it)

import { withStore } from '../utility/withStore.js';

type Args = { query: string };
type MyStore = { last: string; count: number };

const tool = withStore<Args, string, MyStore>()({
  name: 'search',
  description: 'd',
  execute: (ctx) => {
    const q: string = ctx.arguments.query;       // typed as Args
    ctx.store('last', q);                          // typed against MyStore
    ctx.store('count', 1);                         // typed
    ctx.invokeAsync('onDone');                     // narrowed: 'onDone'
    return 'ok';
  },
  asyncFunctions: {
    onDone: (ctx) => {
      const v: string | undefined = ctx.load('last');  // typed
      console.log(v);
    }
  }
});

console.log(tool);