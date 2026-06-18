// Regression fixture — JT-96565 rule factory generics (S-first design).
//
// Rule factories lead with the store schema: static onChange<S, R, AK>,
// matching the app factories where S precedes AK (defineHttpHandler<S, AK>,
// defineAITool<…, S, AK>). The factory threads the generics into
// RuleProperties<R, AK, S> by name, so the consumer-facing shape stays R-first.
//
// TypeScript turns off inference for the remaining params once any type arg is
// supplied, so use one of two forms:
//   - No explicit generics: R and AK are inferred from `requirements` /
//     `asyncFunctions`; the store stays loosely typed.
//   - All three explicit: store, requirements, and async keys are all typed.
// (Naming only the store would drop R and AK to their defaults.)

import { Issue } from '@jetbrains/youtrack-workflow-types/workflowTypeScriptStubs';

const requirements = { Assignee: { type: 'user' } } as const;

// Full inference: requirement context is typed; the store stays loose.
Issue.onChange({
  requirements,
  action: (ctx) => {
    void ctx.Assignee;
  }
});

// All generics explicit: store schema typed alongside requirements + async keys.
Issue.onChange<{ count: number }, typeof requirements, 'onDone'>({
  requirements,
  action: (ctx) => {
    void ctx.Assignee;          // requirement context
    ctx.store('count', 1);      // typed against the store schema
    ctx.invokeAsync('onDone');  // narrowed to the declared async key
  },
  asyncFunctions: {
    onDone: (ctx) => {
      const v: number | undefined = ctx.load('count');
      void v;
    }
  }
});
