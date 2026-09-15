# Project and global scope in YouTrack apps

## What is scoped

- Backend modules (scripts): workflow rules, HTTP handlers, and MCP tools (AI tools)
- Widgets
- Settings
- Permissions

App scope is set in the source and fixed for each uploaded version. To change it, update the source and upload a new version.

Here, **app scope** has two levels: project and global.
## 1. App availability

Project-level modules become available when the app is attached to and enabled for a project. Global modules work across the YouTrack installation. Attaching an app to a project does not change its declared scope.

| Availability | Meaning |
| --- | --- |
| Global | The module works across the YouTrack installation and is not attached to individual projects. |
| Project | The module works only in projects where the app is attached and enabled. |

## 2. Workflow rule scope

Workflow rules are project-level. They run only in projects where the app is attached and enabled.

See [Rules](script-types.md#rules).

## 3. Widget scope

The widget's `extensionPoint` in `manifest.json` sets its context.

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

The extension point controls where YouTrack mounts the widget and which host context it receives. Widgets with a project context appear only in projects where the app is attached and enabled.

Endpoints declare their backend scope independently of the widget's location.

See [Widget configuration and extension points](widgets.md).

## 4. HTTP endpoint scope

Each endpoint declares `scope` in the HTTP handler source. The value is fixed until the app is updated and uploaded again.

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

If `scope` is omitted, the endpoint is `GLOBAL`.

For endpoints tied to an issue, article, project, or user, YouTrack resolves the entity and checks whether the caller can access it before the handler runs. Use the narrowest scope that fits the operation. Use `GLOBAL` for operations with no issue, article, project, or user context, such as an external webhook.

Every endpoint in an HTTP handler must belong to the same app scope. A project-level handler can combine `ISSUE`, `ARTICLE`, and `PROJECT` endpoints. A global-level handler can combine `USER` and `GLOBAL` endpoints. One handler cannot combine the two groups, such as `ISSUE` and `USER`.

See [HTTP handler scope](script-types.md#scope-semantics).

## 5. MCP tool (AI tool) scope

MCP tools are global-level backend modules. They run across the installation and are not attached to individual projects.

See [MCP tool](script-types.md#mcp-tool).

## 6. App settings scope

Each property in `settings.json` declares its scope with `x-scope`. Administrators can edit the value after installation. Changing `x-scope` requires a new app version.

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

Setting scope controls who can configure the value and what `ctx.settings` returns. Global modules read only global values. Project-level modules can read values for their project. Omit `x-scope` when a setting needs a global default with project overrides.

See [App settings scope](app-persistance.md#choosing-scope).

## 7. Permissions

System administrators can manage every app and app scope.

Project administrators can:

- configure project-level app parts and attach apps to projects they administer;
- update an app's source only when the app is attached exclusively to projects they administer;
- upload a new app with global-level modules. YouTrack disables the app automatically, and only a system administrator can enable it.

## 8. Administration UIs

| Location | Purpose | Access |
| --- | --- | --- |
| Administration → Apps | Manages all apps globally. Global app settings, visibility, and enable/disable controls are available only here. It also lists workflow apps. | Visible to system and project administrators; editable only by system administrators. |
| Administration → Workflows | Manages workflow apps globally. It shows apps with the Workflow tag, which means they contain at least one workflow rule. This UI remains for backward compatibility; the same apps also appear under Administration → Apps. | Visible to system and project administrators; editable only by system administrators. |
| Projects → _Project_ → Settings → Apps | Manages app setup for one project. | Editable by system administrators and administrators of that project. |
| Projects → _Project_ → Settings → Workflows | Manages workflow rules for one project and shows only rules provided by apps. | Editable by system administrators and administrators of that project. |

## 9. Where scopes meet

One feature may involve several scoped parts. Together, their scopes determine where the feature is available, which settings it reads, and which permissions YouTrack checks.

### Widget, app availability, and endpoint

A widget calling its backend follows this path:

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
