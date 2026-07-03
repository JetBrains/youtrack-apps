// Regression fixture — JT-96565 rule factory generics (R-first, additive).
//
// Rule factories keep the published R-first shape: static onChange<R, AK, S>,
// where AK and S are trailing defaulted params. This is additive over the
// shipped `@jetbrains/youtrack-workflow-types` (`onChange<R>`): existing code
// that names only the requirements keeps working, and ctx requirement typing is
// preserved. Store/async typing lives behind the `withStore` curry, not the
// factory generics.
//
// TypeScript turns off inference for the remaining params once any type arg is
// supplied, so use one of these forms:
//   - No explicit generics: R and AK inferred from `requirements` /
//     `asyncFunctions`; the store stays loosely typed.
//   - Requirements only (`onChange<R>`): the published shape — requirement
//     context typed, store/async left at defaults.
//   - All three explicit (`onChange<R, AK, S>`): requirements, async keys, and
//     store schema all typed.

import { Issue, User } from '@jetbrains/youtrack-workflow-types/workflowTypeScriptStubs';

const requirements = { Assignee: { type: 'user' } } as const;

// Full inference: requirement context is typed; the store stays loose.
Issue.onChange({
  requirements,
  action: (ctx) => {
    void ctx.Assignee;
  }
});

// Published shape — requirements as the single generic (back-compat). The
// requirement context must stay typed; `MyRequirements` must NOT be consumed as
// the store schema (the store stays loose).
type MyRequirements = { Assignee: { type: 'user' } };
Issue.onChange<MyRequirements>({
  requirements,
  action: (ctx) => {
    void ctx.Assignee;        // requirement context, not store
    ctx.store('anything', 1); // store loose: arbitrary key accepted
  }
});

// All generics explicit (R-first): requirements + async keys + store schema.
Issue.onChange<typeof requirements, 'onDone', { count: number }>({
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

// Store schema with an entity value type round-trips (entity references are
// preserved by the runtime).
Issue.onChange<typeof requirements, 'onDone', { owner: User }>({
  requirements,
  action: (ctx) => { ctx.store('owner', ctx.currentUser); ctx.invokeAsync('onDone'); },
  asyncFunctions: { onDone: (ctx) => { void ctx.load('owner'); } }
});

// A store schema whose value type cannot survive the runtime round-trip
// (a nested object) must be rejected by the `AsyncStoreValue` constraint.
// @ts-expect-error - { ts: number } is not an AsyncStoreValue
Issue.onChange<typeof requirements, 'onDone', { payload: { ts: number } }>({
  requirements,
  action: (ctx) => { ctx.invokeAsync('onDone'); },
  asyncFunctions: { onDone: () => {} }
});
