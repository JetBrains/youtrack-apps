# App architecture and access

Use this reference to choose a package component and reason about its runtime and access boundaries.

## Component model

| Goal | Component | Runtime and invocation |
| --- | --- | --- |
| Add UI at a supported location | Widget | Sandboxed browser iframe declared in `manifest.json`; communicate through the Host API. |
| React to changes, expose an action, or run scheduled work | Workflow rule | Restricted backend GraalJS runtime; exported as `exports.rule` or `exports.stateMachine` and invoked by the workflow engine. |
| Serve a widget backend, integration, or webhook | HTTP handler | Restricted backend runtime; exported as `exports.httpHandler` and invoked through an app endpoint. |
| Expose an operation to MCP clients | Custom MCP tool | Restricted backend runtime; exported as `exports.aiTool` and invoked through the YouTrack MCP server. |
| Share backend logic | Utility module | Evaluated when another backend module imports it with `require()`. |

Prefer an app for new functionality that combines widgets, handlers, settings, extension properties, MCP tools, workflow
rules, or Marketplace distribution. A pure workflow is suitable for automation alone. Import clients are a separate
migration mechanism even though they share the underlying package storage and backend infrastructure.

## Authentication and authorization

- Backend app scripts run inside YouTrack and need no extra credentials to use the exposed JavaScript APIs.
- Host API calls from a widget are authenticated as the current user. `host.fetchYouTrack()` remains subject to the target
  REST endpoint's permissions. External REST calls made outside the Host API need the API's normal authentication.
- Uploading a custom app requires global **Update Project** or system **Low-level Admin Write**. Installing or updating a
  Marketplace app requires **Low-level Admin Write**. Attaching project-level modules requires **Update Project** in the
  affected project.
- App visibility is an additional global or project-level user/group restriction; it does not replace module permission
  checks.
- Widget `permissions` affect whether the widget is shown. When several keys are listed, holding any one is sufficient.
  Do not treat visibility as authorization for requests made by the widget; every called API enforces its own permissions.
- Before an HTTP handler runs, YouTrack checks app availability, scoped-entity visibility, and declared endpoint
  permissions. The JavaScript API does not automatically permission-filter arbitrary entity lookups performed afterward.
- MCP tools can access only data available to the authenticated MCP caller.
- Pure workflow rules are trusted project automation and are not limited to the triggering user's permissions. Treat this
  as delegated administrator authority and validate user-controlled actions explicitly when needed.

Keep these boundaries separate: widget visibility, Host/REST authorization, handler scope and permissions, MCP caller
permissions, workflow authority, and app visibility are complementary checks, not interchangeable ones.
