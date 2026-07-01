// Regression fixture — JT-96565 finding 3.
//
// `ctx.response` is the incoming HTTP response, populated by the runtime only
// when a function runs as an async HTTP-response callback. It must not appear on
// the synchronous `action` context, where it is always absent. `store` / `load`
// / `invokeAsync` share the same runtime gate (an async-enabled rule) and stay
// available in both the sync action and the async functions.
//
// Generics are fully explicit so R is a concrete requirement type rather than
// the default catch-all index — that is what makes the absence of `response`
// on the sync context observable.

import { Issue } from '@jetbrains/youtrack-workflow-types/workflowTypeScriptStubs';

const requirements = { Stage: { type: 'string' } } as const;

Issue.onChange<typeof requirements, 'onResponse', { url: string }>({
  requirements,
  action: (ctx) => {
    ctx.store('url', 'https://example.com'); // available in sync action
    ctx.invokeAsync('onResponse');
    // @ts-expect-error response is only available inside async callbacks
    void ctx.response;
  },
  asyncFunctions: {
    onResponse: (ctx) => {
      void ctx.load('url'); // available in async function
      void ctx.response; // populated for HTTP-response callbacks
    }
  }
});
