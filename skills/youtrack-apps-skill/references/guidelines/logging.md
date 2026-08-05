# Guideline: logging

Use `console` methods for YouTrack app logs.
Logs are a key part of app development and debugging. Keep a minimal number of logs in place, but include enough context to iterate over app behavior when something is uncertain.

## Available methods

- `console.log`
- `console.info`
- `console.warn`
- `console.error`
- `console.fatal`

`console.log()` is the default choice and maps to INFO.

## When to log

- Log uncertain states that need runtime confirmation.
- Log potentially complex branches, transformations, or integration steps.
- Log failures with enough context to identify the affected operation or entity.
- Prefer a few useful checkpoints over many low-value logs.

## Examples

```js
console.log('Issue changed', ctx.issue.id);
console.info('Import step finished');
console.warn('Missing optional field:', fieldName);
console.error('Failed to process issue:', ctx.issue.id);
```

Log stable field values instead of whole native objects:

```js
console.log('Issue:', ctx.issue.id, ctx.issue.summary);
```

## Keep logs small

- Log short context: ids, names, status codes, branch names, and error messages.
- Do not log secrets, tokens, passwords, auth headers, or large payloads.
- Avoid heavy logging in loops; logging is synchronous.
- Logs are kept in a bounded in-memory cache and are lost on restart.
