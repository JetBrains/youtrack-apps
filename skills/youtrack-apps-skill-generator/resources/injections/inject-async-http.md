Use async HTTP methods when the script needs to make an outbound HTTP request and handle the response later, without keeping the current transaction open.
The async methods mirror the synchronous HTTP methods and add a final `handlerName` parameter. The handler name is the async function to call with the response.
```javascript
const http = require('@jetbrains/youtrack-scripting-api/http');
const conn = new http.Connection('https://api.example.com');
conn.bearerAuth(ctx.settings.secretSetting);
conn.postAsync('/webhook', null, {data: 'payload'}, 'onResponse');
```
The handler must be declared in `asyncFunctions`. Function names are passed as strings to async HTTP methods.
Do not assume `ctx.response` exists outside async HTTP response handlers.

#### `ctx.response` In HTTP Callbacks
`ctx.response` is available only when the async function is used as an HTTP response callback through `connection.getAsync()`, `connection.postAsync()`, and the other async HTTP methods.

```javascript
asyncFunctions: {
  onResponse: function(ctx) {
    const response = ctx.response;
    if (!response || !response.isSuccess) {
      console.error('Request failed', response && response.code, response && response.exception);
      return;
    }

    const data = response.json();
    console.log('Remote ID', data.id);
  }
}
```
#### `ctx` In Async Functions

Local variables are not accessible to responseHandler unlsess stored in `ctx`.
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

#### Example
```javascript
const entities = require('@jetbrains/youtrack-scripting-api/entities');
const http = require('@jetbrains/youtrack-scripting-api/http');

exports.rule = entities.Issue.onChange({
  title: 'Notify external service',
  action: function(ctx) {
    ctx.store('issue', ctx.issue);

    const conn = new http.Connection('https://api.example.com');
    conn.postAsync('/events', null, {
      issue: ctx.issue.id
    }, 'afterNotify');
  },
  asyncFunctions: {
    afterNotify: function(ctx) {
      const issue = ctx.load('issue');
      const response = ctx.response;

      if (!issue || !response || !response.isSuccess) {
        return;
      }

      issue.addComment('External service was notified.');
    }
  }
});
```
