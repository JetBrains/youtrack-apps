// Regression fixture — JT-96765 AI tool authoring shapes.
//
// The typings module is type-only: there is no `defineAITool` runtime value.
//   - Plain tool (no async, no store): `{...} satisfies AITool<TArgs, TResult>`.
//   - Async/store tool: the `withStore<TArgs, TResult, S>()` curry (runtime
//     identity; AK inferred from `asyncFunctions`).
// Both shapes must compile.

import type { AITool } from '@jetbrains/youtrack-workflow-types/ai-tools';
import { withStore } from '../../utility/withStore.js';

type Args = { query: string };

// Plain tool: types arguments + result, no asyncFunctions.
const plain = {
  name: 'search',
  description: 'Search issues',
  execute: (ctx) => {
    const q: string = ctx.arguments.query; // arguments typed as Args
    return q;
  }
} satisfies AITool<Args, string>;
void plain;

// Async/store tool via the curry: store typed against S, AK inferred.
const withAsync = withStore<Args, string, { last: string }>()({
  name: 'search',
  description: 'Search issues',
  execute: (ctx) => {
    ctx.store('last', ctx.arguments.query);
    ctx.invokeAsync('onDone');
    return 'ok';
  },
  asyncFunctions: {
    onDone: (ctx) => {
      const v: string | undefined = ctx.load('last');
      void v;
    }
  }
});
void withAsync;
