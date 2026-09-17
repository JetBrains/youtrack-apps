# Project and global scope in YouTrack apps

## What is scoped

- Backend modules (scripts): workflow rules, HTTP handlers, and MCP tools (AI tools)
- Widgets
- Settings
- Permissions

Scope is set in the source and fixed for each uploaded app version. To change it, update the source and upload a new version.

YouTrack has two scope levels: project and global. Scope belongs to each app component, so one app can contain both project-level and global components.

## 1. App availability

Project-level modules become available when the app is attached to and enabled for a project. Global modules work across the YouTrack installation and are not attached to individual projects.

Attaching a mixed-scope app attaches only its project-level components. It does not change the declared scope of any component.

| Availability | Meaning |
| --- | --- |
| Global | The component works across the YouTrack installation. |
| Project | The component works only in projects where the app is attached and enabled. |

Disabling an app globally also disables its project-level components.

## 2. Workflow rule scope

Workflow rules are project-level. They run only in projects where the app is attached and enabled.

See [Rules](script-types.md#rules).

## 3. Widget scope

The widget's `extensionPoint` in `manifest.json` determines the HTTP handler scope available to scoped `fetchApp` calls and the widget's app scope.

```json
{
  "widgets": [{
    "key": "issue-panel",
    "extensionPoint": "ISSUE_BELOW_SUMMARY",
    "indexPath": "issue-panel/index.html"
  }]
}
```

| Context | Extension-point examples | HTTP handler scope | App scope |
| --- | --- | --- | --- |
| Issue | `ISSUE_BELOW_SUMMARY`, `ISSUE_OPTIONS_MENU_ITEM` | `ISSUE` | Project |
| Article | `ARTICLE_BELOW_SUMMARY`, `ARTICLE_OPTIONS_MENU_ITEM` | `ARTICLE` | Project |
| Project | `PROJECT_SETTINGS`, `PROJECT_TAB` | `PROJECT` | Project |
| Helpdesk | `HELPDESK_CHANNEL` | `PROJECT` | Project |
| User | `USER_CARD`, `USER_PROFILE_SETTINGS` | `USER` | Global |
| Global UI and content | `MAIN_MENU_ITEM`, `ADMINISTRATION_MENU_ITEM`, `DASHBOARD_WIDGET`, `MARKDOWN` | `GLOBAL` | Global |

The HTTP handler scope controls which scoped endpoint the widget can call with `host.fetchApp(..., {scope: true})`. The endpoint must declare the scope associated with the widget's extension point. Call a `GLOBAL` endpoint without `scope: true`.

App scope controls availability. A widget with project app scope appears only when the app is attached to and enabled for that project. A widget with global app scope becomes available in its UI location as soon as the app is enabled and visible to the current user.

See [Widget configuration and extension points](widgets.md).

## 4. HTTP endpoint scope

Each endpoint declares `scope` in the HTTP handler source. The value is fixed until the app is updated and uploaded again. `scope` is case insensitive.

The table below maps the HTTP endpoint `scope` property to component scope. 

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

| Scope | Component scope | Meaning | Context properties |
| --- | --- | --- | --- |
| `ISSUE` | Project | The request belongs to one issue. | `ctx.issue` |
| `ARTICLE` | Project | The request belongs to one article. | `ctx.article` |
| `PROJECT` | Project | The request belongs to one project. | `ctx.project` |
| `USER` | Global | The request belongs to one user outside project scope. | `ctx.user` |
| `GLOBAL` | Global | The request has no scoped entity. | None |

If `scope` is omitted, the endpoint is `GLOBAL`.

For endpoints tied to an issue, article, project, or user, YouTrack resolves the entity and checks whether the caller can access it before the handler runs. Use the narrowest scope that fits the operation. Use `GLOBAL` for operations with no entity context, such as an external webhook.

Every endpoint in an HTTP handler must belong to the same scope family. A project-level handler can combine `ISSUE`, `ARTICLE`, and `PROJECT` endpoints. A global-level handler can combine `USER` and `GLOBAL` endpoints. One handler cannot combine the two groups, such as `ISSUE` and `USER`.

See [HTTP handler scope](script-types.md#scope-semantics).

## 5. MCP tool (AI tool) scope

MCP tools are global-level backend modules. They are available across the installation when the app is globally active and are not attached to individual projects.

Each tool call still uses the permissions of the authenticated user.

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
| `GLOBAL` | Once, by a system administrator | Global and project contexts read the installation-level value. |
| `PROJECT` | Separately for each project | Only that project's context reads the value. |
| Omitted | Globally, with optional project overrides | A project uses its override when present and otherwise inherits the global value. |

Setting scope controls who can configure the value and what `ctx.settings` returns. Global modules cannot read project-only values because they have no project context. Omit `x-scope` when a setting needs a global default with project overrides.

Setting scope does not change the scope of a widget or backend module.

See [App settings scope](app-persistence.md#choosing-scope).

## 7. Permissions

System administrators can manage global configuration and every project configuration.

Project administrators can:

- configure project-level app parts and attach apps to projects they administer;
- update a custom app's source only when it has no global components and they have app-content access in every attached project;
- upload a new app with global-level modules. YouTrack disables the app automatically, and only a system administrator can enable it.

## 8. Administration UIs

| Location | Purpose | Access |
| --- | --- | --- |
| Administration → Apps | Manages all apps globally. Global app settings, visibility, and enable/disable controls are available only here. It also lists workflow apps. | Visible to system and project administrators. Global configuration requires a system administrator. Package actions follow app-content permissions. |
| Administration → Workflows | Manages workflow apps globally. It shows apps with the Workflow tag, which means they contain at least one workflow rule. This UI remains for backward compatibility; the same apps also appear under Administration → Apps. | Visible to system and project administrators. Package actions follow app-content permissions. |
| Projects → _Project_ → Settings → Apps | Manages app setup for one project. | Editable by system administrators and administrators of that project. |
| Projects → _Project_ → Settings → Workflows | Manages workflow rules for one project and shows only rules provided by apps. | Editable by system administrators and administrators of that project. |

Prefer the CLI when reading or changing app settings. Use `youtrack-app app settings` to read values and `youtrack-app app settings-set` to update them. Both commands support global and project settings. See [Updating app settings](app-persistence.md#updating-settings).

## 9. Where scopes meet

One feature may involve several scoped parts. Together, their scopes determine where the feature is available, which settings it reads, and which permissions YouTrack checks.

### Widget, app availability, and endpoint

A widget's extension point determines both paths:

```text
widget extension point -> HTTP handler scope -> scoped fetchApp endpoint
                       -> app scope          -> widget availability
```

An issue widget uses an `ISSUE_*` extension point, so `host.fetchApp(..., {scope: true})` calls an `ISSUE` endpoint and the backend receives the issue through `ctx.issue`. Its app scope is project, so the widget appears only when the app is attached to and enabled for the issue's project.

### Endpoint and settings

The endpoint's execution context determines which settings it can read.

| Endpoint scope | Settings available through `ctx.settings` |
| --- | --- |
| `ISSUE`, `ARTICLE`, `PROJECT` | Project-only values for that project, global-only values, and inherited or overridden values without `x-scope`. |
| `USER`, `GLOBAL` | Global-only values and global values without `x-scope`. |

A global endpoint cannot use a project-only setting because it has no project context from which to select a value.

## 10. References

- [Widget configuration and extension points](widgets.md)
- [HTTP handler scope](script-types.md#scope-semantics)
- [App settings scope](app-persistence.md#choosing-scope)
