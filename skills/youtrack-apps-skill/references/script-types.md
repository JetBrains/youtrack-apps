# Script Types

Contains rule types and custom API endpoints.

## Types

- [Rules](#rules)
  - [On-change rule](#on-change-rule)
  - [Action rule](#action-rule)
  - [On-schedule rule](#on-schedule-rule)
  - [State-machine rule](#state-machine-rule)
  - [SLA rule](#sla-rule)
- [Custom API endpoints](#custom-api-endpoints)
  - [HTTP handler](#http-handler)
  - [MCP tool](#mcp-tool)

## Rules

Use rules for YouTrack automation that runs from issue/article changes, explicit user commands, schedules, constrained lifecycle transitions, or helpdesk SLA policy goals.

### On-change rule

#### Overview

Targets: `Issue` or `Article`.

#### Pre-requisites

- what entity change should trigger the rule
- what exact field, link, creation, or removal event matters
- whether the trigger is a plain change, a specific transition, or added/removed elements in a set-like property
- what condition should gate the rule
- what concrete data must exist in the instance
- what exact requirement type each referenced field needs
- whether the request is actually feasible as onChange

#### Anatomy

Generate an `exports.rule = entities.<Target>.onChange({...})` file for targets.

Required authoring shape:

- optional `title` - Human-readable title. The title is only visible in the administrative interface.
- `guard` - A function that determines the conditions for executing the rule. If the guard condition is not met, the action specified in the rule is not applied.
- `action` - The actions that should be applied to each issue.
- `requirements` - The list of entities that are required for the rule to execute without errors. This property ensures that rules can be attached to projects safely.
- optional `runOn` - Determines which issue events trigger the on-change rule. Default is on update. Options: change - triggered on issue change, removal - triggered on issue deletion.

#### Context

- `ctx` object received in `action(ctx)` and `guard(ctx)` exposes:
  1. The issue which is changed.
  2. The user who initiated this change.

#### Generation rules

Prefer requirement field handles for custom field delta checks and value checks.

```js
guard: (ctx) => {
  return ctx.issue.fields.becomes(ctx.State, ctx.State.Fixed);
},
requirements: {
  State: {
    type: entities.State.fieldType,
    Fixed: {}
  }
}
```

Use `becomesReported` for first report/create behavior.

```js
guard: (ctx) => {
  return ctx.issue.becomesReported;
}
```

Use `isReported` for general non-draft issue behavior.

```js
guard: (ctx) => {
  return ctx.issue.isReported &&
    ctx.issue.isChanged('description');
}
```

Use direct `isChanged` checks for built-in scalar properties.

```js
guard: (ctx) => {
  return ctx.issue.isChanged('description');
}
```

Compare entities by ids, logins, or names.

```js
guard: (ctx) => {
  return ctx.issue.fields.Assignee &&
    ctx.issue.fields.Assignee.login === 'jane.doe';
},
requirements: {
  Assignee: {
    type: entities.User.fieldType
  }
}
```

Use `runOn` only when the rule must react to removal/change only or intentionally restrict normal change behavior.

```js
runOn: {
  removal: true
},
guard: (ctx) => {
  return ctx.issue.isReported;
}
```

If creating an issue as a side effect, create a real reported issue unless the user asks for draft behavior.

```js
action: (ctx) => {
  const issue = new entities.Issue(ctx.currentUser, ctx.issue.project, 'Follow-up');
  issue.description = 'Created by workflow';
}
```

#### DON'Ts

- Do not put broad searches, large scans, remote calls, or expensive loops in `guard` or `action` because onChange rule runs inside of one request api transaction.
- Do not expect a rule to re-fire in the same transaction after it has already executed.
- Do not mutate unrelated entities unless the request explicitly needs that side effect.

### Action rule

#### Overview

Targets supported: `Issue`, `IssueComment`, `IssueAttachment`, `Article`, `ArticleComment`, `ArticleAttachment`.

#### Pre-requisites

Make sure to satisfy the following before generating code:

- what the user-triggered action should do
- how the user is expected to invoke it
- what entity the action applies to
- whether extra user input is needed
- what concrete instance data must exist
- what exact requirement type each referenced field needs
- whether the request is actually feasible as action

#### Anatomy

Generate an `exports.rule = entities.<Target>.action({...})` file for one supported target.

Required authoring shape:

- `title` - A human-readable title. The title is used as the label for the item in the list of available actions in the Show more menu of the issue.
- `command` - The text that is used for the custom command. When this command is applied to one or more issues, the actions that are defined in this rule are executed. Each action rule must have its unique command.
- optional `guard` - The condition that determines when the action rule is enabled. If the guard condition is not met, the custom command cannot be applied to an issue.
- `action` - The changes that should be applied to each of the issues that are selected when the command is applied. Accepts only one parameter `ctx`.
- optional `userInput` - The input that this action rule requires from the user.
- optional `requirements` - The list of entities that are required for the rule to execute without errors. This property ensures that rules can be attached to projects safely.

#### Generation rules

Choose a clear and unique `command`; prefer lowercase ASCII text that is easy to call from REST or command parsing.

```js
title: 'Request QA review',
command: 'request-qa-review'
```

Use `userInput` only for one runtime value selected or entered at execution time.

```js
userInput: {
  type: entities.Project,
  description: 'Select target project'
}
```

Use value/entity types in `userInput.type`.

```js
userInput: {
  type: entities.User,
  description: 'Select reviewer'
}

userInput: {
  type: entities.ProjectVersion,
  description: 'Select fix version'
}
```

Use primitive field types only for entered scalar values.

```js
userInput: {
  type: entities.Field.integerType,
  description: 'Enter story points'
}
```

Create or clone real issues by default unless the user asks for drafts.

```js
const followUp = new entities.Issue(ctx.currentUser, ctx.issue.project, 'Follow-up');
followUp.description = 'Created from ' + ctx.issue.id;
ctx.issue.links['relates to'].add(followUp);
```

#### Context

- `ctx` object received in `action(ctx)` and `guard(ctx)` exposes:
  1. The issue on which a corresponding command is executed.
  2. The user who executed the command.

#### DON'Ts

- Do not use broad searches, large scans, or expensive loops unless explicitly required.
- Do not use dynamic or localized command text when the action must be easy to test from REST.
- Do not assume the action can be triggered by app id; execution is by action command/name in project context.

### On-schedule rule

#### Overview

Target: `Issue`.

#### Pre-requisites

- what volume or breadth the rule likely touches
- what issues should be processed
- what each matching issue should have changed
- what concrete instance data must exist
- what exact requirement type each referenced field needs
- whether the request is actually feasible as onSchedule

#### Anatomy

Generate an `exports.rule = entities.Issue.onSchedule({...})` JavaScript file.

Required shape:

- optional `title` - Human-readable title. The title is only visible in the administrative interface.
- selective `search` - A search query that determines which issues are processed by this rule or a function that recalculates a search string every time the rule is triggered.
- Quartz `cron` - The schedule for applying the rule, specified as a Java cron expression.
- optional `guard` - A function that determines the conditions for executing the rule.
- `action` - The actions that should be applied to each issue that matches the search condition.
- `requirements` - The list of entities that are required for the rule to execute without errors. This property ensures that rules can be attached to projects safely.
- optional `muteUpdateNotifications` - A flag that determines whether update notifications are sent for changes applied by this rule.
- optional `modifyUpdatedProperties` - A flag that determines whether the changes applied by this rule will update the value for the updated and updated by properties in the issue.

#### Context

- `ctx` object received in `action(ctx)` and `guard(ctx)` exposes:
  1. The issue which matches the search criteria.
  2. A dedicated Workflow User, which is a system user with a full set of permissions.

#### Generation rules

##### Runtime

- There is no global `onSchedule`. Scheduled processing is per attached project only.
- The action is applied only to issues that both match `search` and belong to the project the rule is attached to.
- Avoid broad searches plus aggressive schedules.
- Make `search` as selective as the YouTrack query syntax allows, then use `guard` only for additional selection that cannot be expressed in search.

##### Search

- The query can combine attribute filters, keywords, and free text.
- When you use a function, reference it by name. For example, `search: getSearchExpression`.
- Encode all stated issue selection criteria in `search` when YouTrack query syntax can express them.
- Prefer `search: 'Unresolved Type: Bug'` over `search: 'Unresolved'` plus `if (ctx.issue.fields.Type.name === 'Bug')`.
- Use braces for values with spaces, for example `State: {In Progress}`.
- For multi-word custom field names:
  - after `has:`, wrap the field name in braces, for example `has: {Due Date}`, `has: -{Fix versions}`
  - before `:`, write the field name normally, for example `Due Date: .. Today`, `Fix versions: {2026.1}`
- Use `has:` when you mean field presence or absence:
  - field is present: `has: {Due Date}`
  - field is missing: `has: -{Due Date}`
  - multi-value field has any value: `has: {Fix versions}`
  - multi-value field is empty: `has: -{Fix versions}`
- To match a specific value in a multi-value field, use the field filter form, for example `Fix versions: {2026.1}`.
- Common query forms:
  - field filters like `Priority: Critical`, `Type: Bug`, `has: -Assignee`
  - tag filters like `tag: spam` or `tag: {hidden}`
  - date ranges like `updated: * .. {minus 30d}`
  - ID filters like `#ABC-123` or `issue id: ABC-123`
- Free-text terms use the same plain issue-list search, for example `important issue`.
- If processing order matters, add `sort by:` explicitly, for example `sort by: updated asc`.
- Do not add `sort by:` unless the behavior actually depends on processing order.
- `search` may be a string or a function that returns a string.
- If `search` is a function, treat it as project/search context, not issue context.
- Prefer a static search string.
- Do not add unrelated filters in `search`. Add `#Unresolved`, `Type: ...`, `tag: ...`, or other narrowing when those criteria are requested or required by the stated behavior.

##### Cron / Quartz

- Treat `cron` as Quartz format.
- Keep the cron human-readable and use the least frequent schedule that still satisfies the request.
- Common Quartz examples:
  - `0 * * * * ?` = every minute
  - `0 0/5 * * * ?` = every 5 minutes
  - `0 0 * * * ?` = every hour
- If the user did not ask for a tight cadence, prefer a slower safe cadence over a noisy frequent one. Always ask for frequency if not mentioned explicitly.
- Add one short inline comment on the `cron` line that explains the schedule in plain English, for example `cron: '0 0 * * * ?', // every hour`.

#### DON'Ts

- Never omit `search`.
- Do not write broad `search: ""`.
- Do not assume the rule runs globally across all projects in one pass.
- Never add extra search restrictions that were not requested.
- Do not add frequent crons.

### State-machine rule

#### Overview

Target: `Issue`.
A state-machine owns one single-value lifecycle field. States are field values; transitions are named events.

#### Pre-requisites

- exact managed field name
- exact state value names
- one initial state per machine
- transitions: source state, event name, target state
- which transitions need `guard`, `action`, or `after`
- required side effects in `onEnter`, `onExit`, and transition actions
- required fields, values, users, groups, tags, projects, or links
- REST test path: command or state-machine field event POST

#### Anatomy

```js
const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.rule = entities.Issue.stateMachine({
  title: '<short name>',
  fieldName: '<managed field>',
  states: {
    '<StateName>': {
      initial: true,
      onEnter: (ctx) => {},
      onExit: (ctx) => {},
      transitions: {
        '<eventName>': {
          targetState: '<StateName>',
          guard: (ctx) => true,
          action: (ctx) => {},
          after: 60 * 1000
        }
      }
    }
  },
  typeFieldName: '<type field>',
  alternativeMachines: {
    '<TypeValue>': {
      '<StateName>': {
        initial: true,
        transitions: {}
      }
    }
  },
  requirements: {}
});
```

#### Context

- `ctx` object received in instant actions exposes:
  1. The issue where the controlled field is changed.
  2. The user who changed the value of the controlled field.
- `ctx` object received in `after` actions exposes:
  1. The issue where the value of the controlled field is equal to the value specified for the action.
  2. A dedicated Workflow User, which is a system user with a full set of permissions.

#### Generation rules

- Mark exactly one `initial: true` in every machine and sub-machine.
- Include `transitions: {}` on terminal states.
- Every transition needs `targetState`.
- State names and `targetState` must match real bundle values.
- Prefer short lowercase transition names like `start`, `fix`, `reopen`.
- `guard` must return a boolean.
- Execution order is source `onExit`, transition `action`, target `onEnter`.
- Self-transitions also run exit/action/enter; keep them idempotent.
- Declare requirements for fields and fixed entities used in guards/actions.

##### Runtime

- Timer events are not scheduled for drafts or deleted issues.
- Per-type machines keep the current state only if it exists in the new effective machine; otherwise they reset to the new initial state.
- Old scheduled state-machine events for the same issue and machine are removed on state changes.
- Errors in guard/action/onEnter/onExit roll back the transaction.

#### DON'Ts

- Do not set `typeFieldName` equal to the managed field.
- Do not omit transitions or `targetState`.
- Do not put slow searches, remote calls, or heavy loops inside guards or transition hooks.
- Do not invent state values, transition names, or field types from vague prompts.

### SLA rule

#### Overview

An SLA policy rule defines the set of time goals for tickets in a helpdesk project. The `Issue.sla` method exports an object that is interpreted as an SLA policy rule.

#### Anatomy

SLA rules support the following properties:

- `title` - A human-readable title. This title is visible in the list of SLA rules in the helpdesk project settings.
- `guard` - The condition that determines when the SLA rule is applied to a ticket.
- `onEnter` - The changes that should be applied to the ticket when the SLA policy starts applying to it.
- `action` - The changes that should be applied to the ticket.
- `onBreach` - The changes that should be applied to the ticket when one of the SLA goals is breached. In the `ctx.breachedField` parameter of this function, YouTrack stores the timer custom field where the time goal has been breached for this ticket.
- `requirements` - The list of entities that are required for the rule to execute without errors.

#### Sample SLA policy rule

This SLA is applied to tickets with the Type field set to Incident. YouTrack performs the following actions:

1. YouTrack checks the comments to the ticket and determines whether it has any comments from agents.
2. If the ticket does not have any comments from agents and if the SLA goals field is set to the High value, the value for the First reply field is set to 3 hours.
3. If the ticket becomes resolved, the SLA cycle ends and the First reply field is cleared.
4. When the SLA goal is breached, the responsible agent receives a notification that a high-priority ticket is overdue.

```js
const entities = require('@jetbrains/youtrack-scripting-api/entities');

const REPLY_TIME_IN_MIN = 3 * 60; // 3 hours
const SLA_CALENDAR = entities.Calendar24x7.instance();

exports.rule = entities.Issue.sla({
  title: 'First Reply SLA for High Priority Incidents',
  guard: (ctx) => {
    const issue = ctx.issue;
    return (issue.isReported || issue.becomesReported) && issue.fields.is(ctx.Type, ctx.Type.Incident);
  },
  onEnter: (ctx) => {
    configureBreach(ctx);
  },
  action: (ctx) => {
    const issue = ctx.issue;
    if (issue.becomesResolved) {
      issue.fields[ctx.firstReply.name] = null;
      return;
    }
    if (issue.isChanged('comments') || issue.isChanged(ctx.slaTargetField)) {
      configureBreach(ctx);
    }
  },
  onBreach: (ctx) => {
    const responsiblePerson = ctx.issue.fields.Assignee ? ctx.issue.fields.Assignee : ctx.project.owner;
    responsiblePerson.notify(
      'First reply is overdue for the ticket {0}',
      ctx.issue.id,
      'Please pay attention to the {0} high-priority incident pending a reply.',
      ctx.issue.id,
      true
    );
  },
  requirements: {
    Type: {
      type: entities.EnumField.fieldType,
      name: 'Type',
      Incident: {
        name: 'Incident'
      }
    },
    slaTargetField: {
      type: entities.EnumField.fieldType,
      name: 'Priority',
      High: {
        name: 'High'
      }
    },
    firstReply: {
      type: entities.Field.dateTimeType,
      name: 'First Reply'
    },
    Assignee: {
      type: entities.User.fieldType,
      name: 'Assignee'
    }
  }
});

function configureBreach(ctx) {
  const issue = ctx.issue;
  const isAgentComment = (comment) => {
    return comment.author.login !== ctx.issue.reporter.login && comment.isVisibleTo(ctx.issue.reporter);
  };
  const hasAgentComments = setToArray(ctx.issue.comments).some(isAgentComment);

  if (!hasAgentComments && issue.is(ctx.slaTargetField, ctx.slaTargetField.High)) {
    ctx.issue.fields[ctx.firstReply.name] = ctx.issue.afterMinutes(
      ctx.issue.created,
      REPLY_TIME_IN_MIN,
      SLA_CALENDAR,
      true
    );
  } else {
    ctx.issue.fields[ctx.firstReply.name] = null;
  }
}

function setToArray(set) {
  const arr = [];
  set.forEach(it => arr.push(it));
  return arr;
}
```

## Custom API endpoints

Use endpoints when the app exposes callable backend behavior rather than workflow automation.

### HTTP handler

#### Pre-requisites


- the narrowest usable scope: prefer `ISSUE`, `ARTICLE`, or `PROJECT`; use `GLOBAL` only when there is no project/entity context. Scoped endpoints give security and permission checks before handler code runs, provide the scoped entity directly on `ctx`, and can be called from widgets with scoped app access instead of passing an issue ID through the endpoint contract. Use `GLOBAL` only for true system-level endpoints, such as external webhooks with no project or entity context. Project-level scopes are attachable to projects.
- the route(s): method and path per endpoint
- payload and response shape
- permission requirements not already covered by the selected scope, especially for global handlers

#### Anatomy

Generate an `exports.httpHandler = { endpoints: ... }` file.

Required shape:

- `exports.httpHandler`
- one endpoint object or an `endpoints` array
- endpoint `method` - The HTTP method that the endpoint implements.
- endpoint `path` - The relative path for accessing the endpoint.
- optional `scope` - The scope entity of the endpoint. Prefer setting it when possible. A scoped endpoint gives the
  handler the scoped entity on `ctx` and lets YouTrack reject inaccessible entities/projects before code runs.
- optional `permissions` - The list of additional permissions to check when someone calls the endpoint with the given
  method.
- endpoint `handle(ctx)` - The function that YouTrack invokes when someone calls the endpoint with the given method.
- optional top-level `requirements` - The list of entities that are required for the script to execute without errors.

#### [Context](api/ctx.md)

- The handle function receives a context object as its only argument. This object provides access to:
  1. `ctx.currentUser` - The current user who calls the endpoint. This property is an alias for `entities.User.current`.
  2. `ctx.settings` - The app settings configured according to the app's settings schema.
  3. `ctx.globalStorage` - The global storage object provisioned for the app.
  4. `ctx.request` - The HTTP request object.
  5. `ctx.response` - The HTTP response object.
  6. `ctx.issue`, `ctx.project`, `ctx.article`, `ctx.user` - The scope-specific entity for endpoints that use the corresponding scope. For example, an endpoint with `scope: 'ISSUE'` receives `ctx.issue`.

#### Request and response objects

##### Request

`ctx.request` exposes the incoming method, paths, headers, URL parameters, and body.

| Property | Type | Description |
| --- | --- | --- |
| `body` | `string` | The request body. |
| `bodyAsStream` | `Object` | A byte stream representation of the request body. |
| `headers` | `Array.<{name: String, value: String}>` | A collection of request headers. |
| `path` | `string` | The relative path to the endpoint. Equals `endpoint.path`. |
| `fullPath` | `string` | The full path to the endpoint. |
| `method` | `string` | The HTTP method used by the request: `GET`, `POST`, `PUT`, or `DELETE`. |
| `parameterNames` | `Array.<String>` | An array of the URL parameter names. |

Request functions:

| Function | Return type | Description |
| --- | --- | --- |
| `json()` | `JSON` | Returns the request body in JSON format. |
| `getParameter(name)` | `string` | Returns the URL parameter by its name. |
| `getParameters(name)` | `Array.<String>` | Returns all URL parameters with the name as an array of strings. |

##### Response

`ctx.response` builds the response returned by the app endpoint.

Response properties:

| Property | Type | Description |
| --- | --- | --- |
| `body` | `string` | The response body. If an exception occurs during processing, the response body is empty (`null`). |
| `bodyAsStream` | `Object` | A byte stream representation of the response body. If an exception occurs during processing, the property is empty (`null`). |
| `code` | `number` | The HTTP status code assigned to the response. If an exception occurs during processing, the property is empty. The default is `200`. |

Response functions:

| Function | Return type | Description |
| --- | --- | --- |
| `json(object)` | | Adds the `Content-Type: application/json` HTTP header to the response returned to the client. The response is presented as a JSON string. |
| `text(string)` | `string` | Adds the `Content-Type: text/plain` HTTP header to the response returned to the client. The response is presented as a string. |
| `addHeader(header, value)` | `Response object` | Adds an HTTP header to the response. Passing `null` as the value removes the corresponding header. If more than one header with the same name is passed, only the last one persists. |

#### Generation rules

##### Scope semantics

- Prefer scoped endpoints over globals. Main reason: security. Scoped endpoints let YouTrack apply entity/project access
  and declared endpoint permissions before handler code runs. Project-level scoped endpoints are available only when the
  app is attached to the corresponding project and the module is active.
- Use the narrowest scope that matches the endpoint:
  - `ISSUE`: when the operation is about one issue.
  - `ARTICLE`: when the operation is about one article.
  - `PROJECT`: when the operation is about one project or project-level app behavior.
  - `USER`: only when the operation is explicitly about one user and is not project-scoped.
  - `GLOBAL`: only for system-level endpoints with no project, issue, article, or user context.
- If `scope` is omitted, it is `GLOBAL`. Do not omit `scope` accidentally.
- Scoped endpoints expose the scope-related entity on `ctx`, for example `ctx.issue`, instead of requiring the handler to
  accept an issue ID in URL params and resolve it separately.
- `ISSUE`: binds the endpoint to one issue, exposes `ctx.issue`, and inherits issue visibility before code runs.
- `ARTICLE`: binds the endpoint to one article, exposes `ctx.article`, and inherits article visibility before code runs.
- `PROJECT`: binds the endpoint to one project, exposes `ctx.project`, and is reachable only in projects where the app is attached and the module is active.
- `USER`: user/global-level endpoint that exposes `ctx.user` and does not inherit project visibility.
- `GLOBAL`: app-level endpoint that is not tied to one entity and does not inherit project/entity visibility.
- `ISSUE`, `ARTICLE`, and `PROJECT` are project-level scopes.
- `USER` and `GLOBAL` are global-level scopes.
- Project-level scopes are attachable: project-level handlers become reachable only in projects where the app is
  attached and the module is active.
- Global-level handlers start working at the system level once the app/module is active. Attaching the app to a project does not make them project-scoped.
- Global-level HTTP handler modules require system-admin-level app management permissions.
- Project-level HTTP handler modules can be managed by project admins with project update permissions.
- Because of this separation, one handler file must stay within one scope family.

##### Security and visibility

- Prefer scoped endpoints because they provide the first access-control boundary. For example, use `scope: 'ISSUE'`
  instead of accepting an arbitrary issue ID when the endpoint is intended to work on the current issue.
- Scoped handlers resolve to `404` before code runs when the caller cannot access the scoped entity or project.
- Project-level handlers can also resolve to `404` when the app is not attached, the module is inactive, or visibility settings hide it in that project.
- The workflow JavaScript API does not automatically filter arbitrary entity lookups by the HTTP request user's permissions.
- Calls such as `entities.Issue.findById(...)` can return an issue that `ctx.currentUser` is not allowed to view.
- Before returning data from entities loaded in handler code, check visibility with the entity security API, for example `issue.isVisibleTo(ctx.currentUser)`.
- If the loaded entity is not visible to the requester, return `404` or `403` and do not include entity data in the response.

##### Routing and authoring

- Keep one handler file within one scope family: do not mix `GLOBAL`/`USER` with `ISSUE`/`ARTICLE`/`PROJECT`.
- Use exact method/path routing; keep paths simple and stable.
- For widget-to-backend calls, prefer app access to a scoped handler instead
  of adding issue IDs or project IDs to the endpoint payload when the widget already has the entity/project context.
- HTTP handlers extend YouTrack's REST API. Third-party services can call them as webhook URLs.
- For webhooks that are not tied to one YouTrack entity or project, use a `GLOBAL` endpoint.
- The external URL is built from the app `name`, the handler file name without `.js`, and the endpoint `path`.
- Endpoint URL shapes:
  - `ISSUE`: `<host>/api/issues/<issueId>/extensionEndpoints/<app>/<handler>/<endpoint>`
  - `ARTICLE`: `<host>/api/articles/<articleId>/extensionEndpoints/<app>/<handler>/<endpoint>`
  - `PROJECT`: `<host>/api/admin/projects/<projectId>/extensionEndpoints/<app>/<handler>/<endpoint>`
  - `USER`: `<host>/api/users/<userId>/extensionEndpoints/<app>/<handler>/<endpoint>`
  - `GLOBAL`: `<host>/api/extensionEndpoints/<app>/<handler>/<endpoint>`
- Return only the data the caller should see.

#### DON'Ts

- Do not generate `exports.rule`.
- Do not mix global-level and project/entity-level scopes in one handler file.
- Do not expose sensitive data from a global handler without explicit protection.
- Do not return data from entities loaded by ID/search before checking visibility for `ctx.currentUser`.

### MCP tool

#### Pre-requisites

- exact tool purpose
- exact app package name and optional `aiToolPrefix`
- final published tool name expected by REST/MCP
- input arguments and JSON schema
- output shape and optional output schema
- whether the tool reads or mutates YouTrack data
- required permissions for the current user
- whether long-running work should use `asyncFunctions`

#### Anatomy

```js
const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.aiTool = {
  name: 'get_issue_content',
  description: 'Returns information about an issue by its ID',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: {
        type: 'string',
        description: 'The readable issue ID (e.g. TEST-1234)'
      }
    },
    required: ['issueId']
  },
  annotations: {
    title: 'Get issue content',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false
  },
  execute: (ctx) => {
    const issue = entities.Issue.findById(ctx.arguments.issueId);
    return {
      id: issue.id,
      description: issue.description,
      state: issue.fields.State,
      assignee: issue.fields.Assignee?.login,
      project: {
        name: issue.project.name,
        key: issue.project.key
      }
    };
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The readable issue ID'
      },
      description: {
        type: 'string',
        description: 'The issue description'
      }
    },
    required: ['id']
  }
};
```

#### [Context](api/ctx.md)

- `ctx` provides `ctx.arguments` from the input schema. It does not provide `ctx.issue`, `ctx.article`, or `ctx.user`; resolve entities from arguments in code.
- For JS API issue lookup, accept and use readable issue IDs such as `DEMO-123`. `entities.Issue.findById(...)` uses the
  visible/readable ID. Do not use REST-only `idReadable` in code.

#### Generation rules

- Required fields: `name` and `execute`.
- Use stable lowercase snake_case name.
- Custom published names are prefixed: `<manifest.aiToolPrefix or packageName>_<name>`.
- Add description and argument descriptions; empty descriptions make poor MCP tools.
- Add `inputSchema` unless the tool truly takes no arguments.
- `inputSchema` root type must be object or array.
- Access arguments through `ctx.arguments`.
- Use `annotations.readOnlyHint: true` only for tools that do not mutate data.
- Use `annotations.subset` for filtering groups like issue or article.

#### Exposing custom tools

- Custom MCP tools are global system-level app modules.
- After upload, tools are available to users across projects, but each execution uses the permissions of the authenticated user working with the MCP connection.
- Include app package names in the MCP endpoint URL: `/mcp?customToolPackages=app-name1,app-name2`.
- Use the manifest `name` value in `customToolPackages`.

#### Runtime notes

- Tools run as the authenticated current user.
- Thrown errors are returned as tool errors, not successful content.
- `null` and `undefined` results become empty content.

#### DON'Ts

- Do not use root schema types like string, number, or boolean.
- Do not omit properties for object schemas or items for array schemas.
- Do not put slow external work directly in execute; schedule async work instead.
