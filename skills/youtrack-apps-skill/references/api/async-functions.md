# Async Functions

Async functions let scripts schedule work that should run after the current script finishes.

## Table of contents

- [Mental Model](#mental-model)
- [Structure](#structure)
- [Entry Points](#entry-points)
  - [`ctx.invokeAsync`](#ctxinvokeasync)
  - [Async HTTP Methods](#async-http-methods)
- [`ctx` In Async Functions](#ctx-in-async-functions)
- [Chaining and Constraints](#chaining-and-constraints)
- [Prerequisites](#prerequisites)
- [Caveats](#caveats)
- [Examples](#examples)
  - [Debounce On Change](#debounce-on-change)
  - [Retry](#retry)

## Mental Model

Think of an async function as a new execution that starts later.

- The current script schedules only one async operation.
- The current transaction commits.
- The async function runs in a fresh execution context and its own read-write transaction.
- Values that the async function uses must be loaded with `ctx.load('key')`.
- Each execution can schedule at most one next async call.

Async functions are not JavaScript callbacks. They are separate executions connected by the function name and the state that you explicitly store.

Use async functions when a script needs to:

- wait before doing work
- debounce repeated changes
- split a longer workflow into multiple small transactions
- retry or continue processing in a later step
- make an outbound HTTP request and handle its response after the current transaction commits

## Structure

Declare async functions in an `asyncFunctions` object on the same rule, HTTP handler, or tool that schedules them. They are invoked directly from a function.

`asyncFunctions` is a map of named functions:

- each key is the async function name
- each value is the function to run
- function names are passed as strings to `ctx.invokeAsync()`
- the function receives `ctx`

Use unique names inside `asyncFunctions`. It is a JavaScript object, so duplicate keys follow normal JavaScript behavior and the later value wins.

## Entry Points

Entry points are the places where async work starts. There are two ways to schedule async work.

### `ctx.invokeAsync`

Use `ctx.invokeAsync()` when you want to schedule a named async function directly.

```javascript
ctx.invokeAsync(functionName, delay, deduplicationKey);
```

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `functionName` | `string` | yes | Name of a function declared in the same `asyncFunctions` object. |
| `delay` | `number` | no | Delay before execution, in milliseconds. Defaults to `0`. |
| `deduplicationKey` | `string` | no | Replaces earlier pending calls with the same key for the same script entry. Use it for debounce behavior. |

Use `delay` when the follow-up work should happen later:
```javascript
ctx.invokeAsync('sendReminder', 60 * 60 * 1000); // 1 hour
```
Use `deduplicationKey` when repeated events should collapse into the latest scheduled call:
```javascript
ctx.store('issue', ctx.issue);
ctx.invokeAsync('recalculate', 30000, 'recalculate-' + ctx.issue.id);
```
If the same issue schedules `recalculate` several times with the same key before the delay expires, only the latest pending call should run.

### Async HTTP Methods

Use `Connection` async methods when a script needs to make an outbound HTTP request and handle the response later without keeping the current transaction open. These methods mirror their synchronous counterparts and take a final `handlerName` parameter that names a function in the same `asyncFunctions` object.

```javascript
const http = require('@jetbrains/youtrack-scripting-api/http');
const connection = new http.Connection('https://api.example.com');
connection.bearerAuth(ctx.settings.secretSetting);

ctx.store('issue', ctx.issue);
connection.postAsync('/events', null, {
  issue: ctx.issue.id
}, 'afterNotify');
```

The named handler receives the HTTP response as `ctx.response`. Do not assume that `ctx.response` exists in async functions scheduled with `ctx.invokeAsync()` or outside an async HTTP response handler.

```javascript
asyncFunctions: {
  afterNotify: (ctx) => {
    const issue = ctx.load('issue');
    const response = ctx.response;

    if (!issue || !response || !response.isSuccess) {
      console.error('Request failed', response && response.code, response && response.exception);
      return;
    }

    const data = response.json();
    issue.addComment('External service returned ' + data.id + '.');
  }
}
```

See the generated [`http` API reference](http.md#async-methods) for the available methods and their parameter signatures.

## `ctx` In Async Functions

Each async function receives a fresh `ctx` object with the same general shape as the function that scheduled it. It can include access to values such as `ctx.issue`, `ctx.currentUser`, requirement aliases, `ctx.store()`, `ctx.load()`, and `ctx.invokeAsync()`.

This is the same shape, not the same object. The original `ctx` belongs to one execution and one transaction. Async functions run later with a fresh context, so the handoff must happen through `ctx.store()` and `ctx.load()`.

Use `ctx.store(key, value)` before scheduling async work:

```javascript
ctx.store('issue', ctx.issue);
ctx.store('issueId', ctx.issue.id);
ctx.store('attempt', 1);
ctx.store('source', 'webhook');
```

Use `ctx.load(key)` inside the async function:

```javascript
const issue = ctx.load('issue');
const attempt = ctx.load('attempt') || 1;
```

Supported stored values:

- strings
- numbers
- booleans
- `null`
- YouTrack entity references

Entity references are not snapshots. If you store an issue and load it later, you get the current issue state at execution time. Store primitive values, such as IDs, names, or field values, when the async function needs the value as it was when scheduled.

Store everything the async function needs before the async invocation.

## Chaining and Constraints

Chaining means scheduling another async function from inside the async function that is currently running.

```javascript
asyncFunctions: {
  firstStep: function(ctx) {
    ctx.store('status', 'first-complete');
    ctx.invokeAsync('secondStep');
  },

  secondStep: function(ctx) {
    const status = ctx.load('status');
    // continue processing
  }
}
```

Use chaining for:

- retrying work after a delay
- splitting a process into several transactions
- calling an external service and then scheduling follow-up processing

Constraints:

- One execution can schedule only one async operation.
- If a later step stores the same key, that value overrides earlier values for the next steps.
- Async chains have a maximum length. The default limit is 10 hops.
- The default maximum delay is one week.
- A scheduled function can be skipped if the user, app, script, or required configuration is no longer valid when it is time to run.

## Prerequisites

Before invoking an async function, YouTrack validates:

- User is not banned. If the scheduling user was banned between scheduling and execution, the job is skipped.
- Entry configuration is enabled. The script must still be active.
- Plugin configuration is activated. The app must still be enabled and have required settings.

## Caveats

- Do not try to pass `ctx` into an async function.
- Do not expect stored entities to preserve old field values.
- Do not call `ctx.invokeAsync()` twice from the same execution.

## Examples

### Debounce On Change
```javascript
const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.rule = entities.Issue.onChange({
  title: 'Debounce on change',
  guard: function(ctx) {
    return ctx.issue.isChanged('summary');
  },
  action: function(ctx) {
    ctx.store('user', ctx.currentUser);
    ctx.invokeAsync('processLater', 2000, 'debounce-' + ctx.issue.id);
  },
  asyncFunctions: {
    processLater: function(ctx) {
      const user = ctx.load('user');
      ctx.issue.description = 'Processed by ' + user.login;
    }
  }
});
```
### Retry
```javascript
const entities = require('@jetbrains/youtrack-scripting-api/entities');

const MAX_ATTEMPTS = 3;
const RETRY_DELAY = 60 * 1000;

exports.rule = entities.Issue.onChange({
  title: 'Retry until description is set',
  guard: function(ctx) {
    return ctx.issue.isChanged('summary');
  },
  action: function(ctx) {
    ctx.store('issue', ctx.issue);
    ctx.store('attempt', 1);
    ctx.invokeAsync('checkDescription');
  },
  asyncFunctions: {
    checkDescription: function(ctx) {
      const issue = ctx.load('issue');
      const attempt = ctx.load('attempt') || 1;
      if (issue.description) {
        issue.addComment('Description is ready.');
        return;
      }
      if (attempt < MAX_ATTEMPTS) {
        ctx.store('issue', issue);
        ctx.store('attempt', attempt + 1);
        ctx.invokeAsync('checkDescription', RETRY_DELAY);
      } else {
        issue.addComment('Description was still empty after ' + attempt + ' attempts.');
      }
    }
  }
});
```
