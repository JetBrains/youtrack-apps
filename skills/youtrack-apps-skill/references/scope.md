# Project and Global scopes in YouTrack App

## Table of contents

1. [App availability](#1-app-availability)
2. [Widget scope](#2-widget-scope)
3. [HTTP endpoint scope](#3-http-endpoint-scope)
4. [App settings scope](#4-app-settings-scope)
5. [Entity extensions](#5-entity-extensions)
6. [Where scopes meet](#6-where-scopes-meet)
   - [Widget, app availability, and endpoint](#widget-app-availability-and-endpoint)
   - [Endpoint and settings](#endpoint-and-settings)
   - [Endpoint and entity extensions](#endpoint-and-entity-extensions)
7. [References](#7-references)

In a YouTrack app, scope is the context in which a feature appears, runs, reads configuration, or stores data. Each of these is configured separately, so a single feature will often have several related scopes. App persistence spans two of these surfaces: app settings hold administrator configuration, while entity extensions hold data managed by the app.

## 1. App availability

### Where it is configured

App availability is configured in YouTrack after installation. Project-level modules are attached to and enabled for individual projects. Global modules are enabled for the whole YouTrack installation.

### Options

| Availability | Meaning |
| --- | --- |
| Global | The module works across the YouTrack installation and is not attached to individual projects. |
| Project | The module works only in projects where the app is attached and enabled. |

Workflow rules and `ISSUE`, `ARTICLE`, and `PROJECT` HTTP endpoints are project-level. `GLOBAL` and `USER` HTTP endpoints are global-level.

Availability determines where a module can run.

See [HTTP handler scope](script-types.md#scope-semantics).

## 2. Widget scope

### Where it is configured

Set the widget's `extensionPoint` in `manifest.json`.

```json
{
  "widgets": [{
    "key": "issue-panel",
    "extensionPoint": "ISSUE_BELOW_SUMMARY",
    "indexPath": "issue-panel/index.html"
  }]
}
```

### Options

| Context | Extension-point examples | Meaning |
| --- | --- | --- |
| Issue | `ISSUE_BELOW_SUMMARY`, `ISSUE_OPTIONS_MENU_ITEM` | The widget runs for one issue and its project. |
| Article | `ARTICLE_BELOW_SUMMARY`, `ARTICLE_OPTIONS_MENU_ITEM` | The widget runs for one article and its project. |
| Project | `PROJECT_SETTINGS`, `PROJECT_TAB` | The widget runs for one project. |
| User | `USER_CARD`, `USER_PROFILE_SETTINGS` | The widget runs for one user. |
| Global UI | `MAIN_MENU_ITEM`, `ADMINISTRATION_MENU_ITEM`, `DASHBOARD_WIDGET` | The location is not tied to a project entity. |
| Other host context | `HELPDESK_CHANNEL`, `MARKDOWN` | YouTrack supplies the relevant Helpdesk or content context. |

The extension point controls where YouTrack mounts the widget and which host context it receives. A widget in a project context also requires the app to be attached to and enabled for that project.

Backend scope is configured on the endpoint, not inferred from the widget's location.

See [Widget configuration and extension points](widgets.md).

## 3. HTTP endpoint scope

### Where it is configured

Set `scope` on each endpoint in an HTTP handler.

```javascript
exports.httpHandler = {
  endpoints: [{
    method: 'POST',
    path: 'sync',
    scope: 'ISSUE',
    handle: (ctx) => {
      // ctx.issue is the issue from the endpoint URL.
    }
  }]
};
```

### Options

| Scope | Meaning | Context property |
| --- | --- | --- |
| `ISSUE` | The request belongs to one issue. | `ctx.issue` |
| `ARTICLE` | The request belongs to one article. | `ctx.article` |
| `PROJECT` | The request belongs to one project. | `ctx.project` |
| `USER` | The request belongs to one user outside project scope. | `ctx.user` |
| `GLOBAL` | The request covers installation-wide behavior and has no scoped entity. | None |

An endpoint without `scope` is `GLOBAL`.

For a scoped endpoint, YouTrack resolves the entity and checks whether the caller can reach that context before the handler runs. Choose the narrowest scope that fits the operation. Reserve `GLOBAL` for operations with no issue, article, project, or user context, such as an external webhook.

See [HTTP handler scope](script-types.md#scope-semantics).

## 4. App settings scope

### Where it is configured

Set `x-scope` on each property in `settings.json`.

```json
{
  "type": "object",
  "properties": {
    "apiToken": {
      "title": "API token",
      "type": "string",
      "format": "secret",
      "x-scope": "PROJECT"
    }
  }
}
```

### Options

| `x-scope` | Where it is configured | Runtime meaning |
| --- | --- | --- |
| `GLOBAL` | Once, by a system administrator | Global modules read the installation-level value. |
| `PROJECT` | Separately for each project | Project-level modules read the value for their project. |
| Omitted | Globally, with optional project overrides | A project uses its override when present and otherwise inherits the global value. |

The setting scope controls who configures the value and what `ctx.settings` returns at runtime. Global modules cannot read project values, so `PROJECT` works only for features that run in a project context. Leave out `x-scope` when the setting should support both a global default and project overrides.

See [App settings scope](app-persistance.md#choosing-scope).

## 5. Entity extensions

### Where it is configured

Set `entityType` in `entity-extensions.json`. Code reads and writes the declared property through that entity's `extensionProperties`.

```json
{
  "entityTypeExtensions": [{
    "entityType": "Issue",
    "properties": {
      "externalId": { "type": "string" }
    }
  }]
}
```

### Options

| Storage owner | Access | Meaning |
| --- | --- | --- |
| `Issue` | `issue.extensionProperties` | One value per issue. |
| `Article` | `article.extensionProperties` | One value per article. |
| `Project` | `project.extensionProperties` | One value per project. |
| `User` | `user.extensionProperties` | One value per user. |
| Other supported entity | `entity.extensionProperties` | One value per entity instance. |
| `AppGlobalStorage` | `ctx.globalStorage.extensionProperties` | One value for the app installation. |

The `entityType` selects the owner of the stored state. Endpoint scope does not change that ownership. For example, an `ISSUE` endpoint may update issue state, project state, or app-global state when the app declares those properties.

Use extension properties for state maintained by the app. Use app settings for values supplied by an administrator.

See [Entity extensions](app-persistance.md#extension-properties).

## 6. Where scopes meet

### Widget, app availability, and endpoint

These scopes form the path from the UI to the backend:

```text
widget extension point -> app available in that context -> endpoint scope
```

An issue widget uses an `ISSUE_*` extension point. The app must be attached to and enabled for the issue's project. An `ISSUE` endpoint then gives the backend access to that issue through `ctx.issue`.

### Endpoint and settings

The endpoint's execution context determines which settings it can read.

| Endpoint scope | Settings available through `ctx.settings` |
| --- | --- |
| `ISSUE`, `ARTICLE`, `PROJECT` | Project values, plus inherited global values for settings without `x-scope`. |
| `USER`, `GLOBAL` | Global values only. |

A global endpoint cannot use a project-only setting because it has no project context from which to select a value.

### Endpoint and entity extensions

Endpoint scope provides the primary entity for a request. The entity extension target identifies the owner of stored data.

- An `ISSUE` endpoint commonly stores issue state on `ctx.issue.extensionProperties`.
- A `PROJECT` endpoint commonly stores project state on `ctx.project.extensionProperties`.
- A `GLOBAL` endpoint commonly stores shared state on `ctx.globalStorage.extensionProperties`.

These combinations are conventions, not restrictions. When an endpoint loads another entity, check that the current user can access it before returning its data.

## 7. References

- [Widget configuration and extension points](widgets.md)
- [HTTP handler scope](script-types.md#scope-semantics)
- [App settings scope](app-persistance.md#choosing-scope)
- [Entity extensions](app-persistance.md#extension-properties)
