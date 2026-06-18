// Regression fixture — JT-96765 finding 1.
//
// `defineAITool<TArgs, TResult>({...})` (no async functions, no store schema)
// is the original public shape. The async-surface sync replaced it with a
// single overload that requires `S`, `AK`, and an `asyncFunctions` block, so
// plain tools stopped compiling. Both shapes must compile.

import { defineAITool } from '@jetbrains/youtrack-workflow-types/ai-tools';

type Args = { query: string };

// Plain tool: two type args, no asyncFunctions.
const plain = defineAITool<Args, string>({
  name: 'search',
  description: 'Search issues',
  execute: (ctx) => {
    const q: string = ctx.arguments.query; // arguments typed as Args
    return q;
  }
});
void plain;

// Async/store tool: the narrowing overload still works alongside it.
const withAsync = defineAITool<Args, string, { last: string }, 'onDone'>({
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