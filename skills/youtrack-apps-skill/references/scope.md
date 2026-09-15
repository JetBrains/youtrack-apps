# Project and Global scopes in YouTrack App

## What is scoped

- Backend modules (scripts): workflow rules, HTTP handlers, and MCP tools (AI tools)
- Widgets
- Settings
- Permissions

Scope is declared in the app sources. Changing it requires updating and uploading the app.

This document is about general **app scope**, which has two levels: project and global. Do not confuse it with the HTTP endpoint `scope` property. That property has five values: `ISSUE`, `ARTICLE`, and `PROJECT` belong to project app scope; `USER` and `GLOBAL` belong to global app scope.

## 1. App availability

After installation, project-level modules can be attached to and enabled for individual projects. Global modules are available across the YouTrack installation. This controls where the uploaded app is enabled; it does not change the scope declared by the app sources.

| Availability | Meaning |
| --- | --- |
| Global | The module works across the YouTrack installation and is not attached to individual projects. |
| Project | The module works only in projects where the app is attached and enabled. |

Availability determines where a module can run.

## 2. Workflow rule scope

Workflow rules are project-level. They run only in projects where the app is attached and enabled.

See [Rules](script-types.md#rules).

## 3. Widget scope

The widget's `extensionPoint` in `manifest.json` determines its context. Changing it requires updating and uploading the app.

```json
{
  "widgets": [{
    "key": "issue-panel",
    "extensionPoint": "ISSUE_BELOW_SUMMARY",
    "indexPath": "issue-panel/index.html"
  }]
}
```

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

## 4. HTTP endpoint scope

Set `scope` on each endpoint in the HTTP handler source. Changing it requires updating and uploading the app.

The table below maps the HTTP endpoint `scope` property to app scope.

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

| Scope | App scope | Meaning | Context property |
| --- | --- | --- | --- |
| `ISSUE` | Project | The request belongs to one issue. | `ctx.issue` |
| `ARTICLE` | Project | The request belongs to one article. | `ctx.article` |
| `PROJECT` | Project | The request belongs to one project. | `ctx.project` |
| `USER` | Global | The request belongs to one user outside project scope. | `ctx.user` |
| `GLOBAL` | Global | The request covers installation-wide behavior and has no scoped entity. | None |

An endpoint without `scope` is `GLOBAL`.

For a scoped endpoint, YouTrack resolves the entity and checks whether the caller can reach that context before the handler runs. Choose the narrowest scope that fits the operation. Reserve `GLOBAL` for operations with no issue, article, project, or user context, such as an external webhook.

All endpoints in one HTTP handler must have the same app scope. A handler may combine `ISSUE`, `ARTICLE`, and `PROJECT` endpoints because they are all project-level. It may combine `USER` and `GLOBAL` endpoints because both are global-level. It cannot combine the two groups; for example, one handler cannot contain both `ISSUE` and `USER` endpoints.

See [HTTP handler scope](script-types.md#scope-semantics).

## 5. MCP tool (AI tool) scope

MCP tools are global-level backend modules. They are available at the installation level rather than being attached to individual projects.

See [MCP tool](script-types.md#mcp-tool).

## 6. App settings scope

Set `x-scope` on each property in `settings.json`. Administrators configure the setting's value after installation, but they cannot change its declared scope without an updated app version.

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

| `x-scope` | Where it is configured | Runtime meaning |
| --- | --- | --- |
| `GLOBAL` | Once, by a system administrator | Global modules read the installation-level value. |
| `PROJECT` | Separately for each project | Project-level modules read the value for their project. |
| Omitted | Globally, with optional project overrides | A project uses its override when present and otherwise inherits the global value. |

The setting scope controls who configures the value and what `ctx.settings` returns at runtime. Global modules cannot read project values, so `PROJECT` works only for features that run in a project context. Leave out `x-scope` when the setting should support both a global default and project overrides.

See [App settings scope](app-persistance.md#choosing-scope).

## 7. Permissions

System administrators can manage all apps and app scopes.

Project administrators can:

- configure project-level app parts and attach apps to projects where they are project administrators;
- update an app's source only when it is attached exclusively to projects they administer;
- upload a new app that contains global-level modules, but the app is disabled automatically and can be enabled only by a system administrator.

If an app is attached to any project they do not administer, a project administrator cannot update its source.

## 8. Administration UIs

| Location | Purpose | Access |
| --- | --- | --- |
| **Administration → Apps** | Manages all apps globally. Global app settings, visibility, and enable/disable controls are available only here. Workflow apps are included. | Visible to system and project administrators; editable only by system administrators. |
| **Administration → Workflows** | Manages workflow apps globally. It shows apps with the **Workflow** tag, meaning apps that contain at least one workflow rule. This UI remains for backward compatibility; the same apps also appear under **Administration → Apps**. | Visible to system and project administrators; editable only by system administrators. |
| **Projects → _Project_ → Settings → Apps** | Manages project-level app setup for one project. | Editable by system administrators and administrators of that project. |
| **Projects → _Project_ → Settings → Workflows** | Manages workflow rules for one project. It shows only workflow rules provided by apps. | Editable by system administrators and administrators of that project. |

## 9. Where scopes meet

One app feature can involve several independently scoped parts. Their scopes determine where the feature is available, which settings it reads, and which permissions YouTrack checks.

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

## 10. References

- [Widget configuration and extension points](widgets.md)
- [HTTP handler scope](script-types.md#scope-semantics)
- [App settings scope](app-persistance.md#choosing-scope)
