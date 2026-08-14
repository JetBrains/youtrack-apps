---
name: youtrack-apps-skill
description: Guides building, debugging, extending, and managing JetBrains YouTrack apps and workflows. Used when scaffolding, modifying, validating, uploading, downloading, enabling, disabling, or inspecting a YouTrack app, workflow rule, app endpoint, or manifest.
metadata:
  version: 1.0.0
  YouTrackVersion: 2026.2.18243
---

# YouTrack App Builder

# Required Environment

Verify these requirements once near the start of the session before using this skill for YouTrack app work.

| Requirement | How to verify |
| --- | --- |
| Node.js `>= 20.18.0` | Run `node --version`. Node is required because both scaffolding and app management run through Node-based CLIs and npm scripts. |
| npm | Run `npm --version`. Use the version bundled with Node.js `>= 24`, unless the app project declares a stricter version. |
| npx | Run `npx --version`. Use the version bundled with npm, unless the app project declares a stricter version. |
| `create-youtrack-app` CLI | Run `create-youtrack-app --help`. If missing, read [references/cli-setup.md](references/cli-setup.md). |
| `youtrack-app` CLI | Run `youtrack-app --help`. If missing, read [references/cli-setup.md](references/cli-setup.md). Commands that contact YouTrack also require a target host (`YOUTRACK_HOST`) and API token (`YOUTRACK_API_TOKEN`). If token variables are not in environment then read the article on how to obtain the token and instruct the user: [Manage Permanent Tokens](https://www.jetbrains.com/help/youtrack/server/manage-permanent-token.html#obtain-permanent-token). Never print token values. |

If required tooling is missing and cannot be installed in the current environment, ask the
user before continuing with a reduced local-only workflow.

# Mandatory Operating Steps

When this skill is loaded, always follow this [PROTOCOL](./references/operating-steps.md) in order for every YouTrack app task.
Do not skip, reorder, or silently complete steps.

For any task that involves code generation, file modification, app management commands, validation, deployment, or YouTrack instance inspection, maintain this checklist internally and expose the PLAN before acting. 

# App Type Selection
Use this distinction when initializing a new app, adding generated modules, or deciding which file layout and build
scripts to follow in an existing app. The generator exposes this choice as `--type js` and `--type ts`; feature commands
infer the app type from the existing project.

TypeScript app (`--type ts`) means a TypeScript app with Enhanced DX such as: file-based backend routing, generated API types, typed widget client code, dev validation, watch upload, or frontend hot reload. Enhanced DX improves the developer experience.

JavaScript app (`--type js`) means a basic JavaScript app. Use it for simple JavaScript workflows or automations, when
the existing app is already JavaScript, or when the user wants a minimal JavaScript project without Enhanced DX.

For a new app, ask which type the user wants before scaffolding. For an existing app, follow the current project
structure and do not mix JavaScript app and TypeScript app patterns unless the user explicitly asks to migrate or
recreate the app.

# App Management
Use the CLIs according to the task:
- `create-youtrack-app` creates app source files and adds modules to a local project.
- `youtrack-app` manages installed apps and instance data in YouTrack.

Before running a command, confirm only the inputs that matter for that command: local directory, target app, project short
name, YouTrack host/token, and output format.

## Command Discovery

Run either CLI with `--help` before using an unfamiliar command; the installed CLI is the source of truth. Keep these
command families in mind when exploring a request:

- `create-youtrack-app`: `app init`, `rule add`, `http-handler add`, `settings init|add`,
  `extension-property add`, and `widget add`.
- `youtrack-app`: app lifecycle/configuration (`upload`, `download`, `validate`, `list`, `info`, `scripts`, settings,
  enablement, logs, and requirement errors); instance exploration (`project`, `field`, `tag`, `group`, and `user`);
  and `rest request` for an authenticated raw REST call. Use `--json` or `--yaml` when structured output helps.

## YouTrack App CLI
Use `youtrack-app --help` for current commands and options.

Use `youtrack-app` for installed app and instance operations: validate or upload a local build, download an installed app,
list/search/inspect apps, read scripts, configure settings, enable/disable or attach/detach apps, check requirement
errors, read logs, inspect projects, fields, users, groups, or tags, and make an authenticated raw REST request.

Do not use it to scaffold new source files.

### REST Requests for Exploration and Testing

Use `youtrack-app rest request` for a relative YouTrack REST path. It uses the configured host/token; inspect first and
make state-changing calls only when requested. For an app HTTP handler, call its published URL, for example:

```bash
youtrack-app rest request \
  --path "/api/extensionEndpoints/<app>/<handler>/<endpoint>" \
  --method POST --header "Content-Type:application/json" --body '{"event":"ping"}'
```

That example is for a global handler. Use the scoped URL shapes in
[HTTP Handler](references/script-types.md#routing-and-authoring) for issue, article, project, or user handlers.

To invoke an installed action rule, submit its `command` with raw REST issue IDs (not `DEMO-123`):

```bash
youtrack-app rest request --path "/api/commands" --method POST \
  --body '{"query":"request-qa-review","issues":[{"id":"2-123"}]}'
```

# Project and Module Scaffolding CLI

## Create YouTrack App CLI

Use `create-youtrack-app --help` for current generator commands and options.

Use `create-youtrack-app` to create a new app project or add local modules: workflow rules, HTTP handlers, settings,
extension properties and widgets.
After scaffolding, review generated files, manifest wiring, requirements, and the relevant script type reference before
editing or deploying.

## Deploying App
Deploying means validating and uploading the local app build to a target YouTrack instance. It creates or updates the
installed app whose package name is `manifest.json` `name`.

Deployment does not publish to Marketplace. It only changes the app installed in the configured YouTrack site.

After deployment, you can verify the installed app via `youtrack-app` CLI:
- Check `info` and `requirement-errors`.
- Configure settings or project attachment/enabled state when needed.
- Check app logs or script logs while testing behavior.

# Manifest
Use for app identity which is `name` and package metadata like  `title`, `description`, `vendor`, `version`. Also use it
when widgets must be declared.
Load for all fields: [references/manifest.md](references/manifest.md)

# Frontend
Use frontend for React widget implementation: component files, Ring UI, host registration, widget-to-backend calls,
frontend build order, and UI dev loops. A YouTrack app frontend is one or more widgets rendered inside a live YouTrack
instance at declared extension points. 
Load for frontend implementation: [references/frontend.md](references/frontend.md)

## Widgets
A widget is a custom object that you can embed in one of the dedicated extension points in the YouTrack UI. Widget is not a standalone SPA: no client router, no owned `ReactDOM.render`, and no localhost-only render.
Load for widget configuration: [references/widgets.md](references/widgets.md)

## Host API
Use for information on how to wire widgets to backend, or how to wire widgets with YouTrack. Load [references/host-api.md](./references/host-api.md )

# Rules
Use rules for YouTrack automation that runs from issue/article changes, explicit user commands, schedules, or
constrained lifecycle transitions.

## On-Change Rule
Use when logic should run automatically as an issue or article is created, edited, reported, removed, or has a relevant
field/link changed. Best for save-time validation and reactive side effects that must happen in the same transaction.
Load after selecting this script type and before
codegen: [references/script-types.md#on-change-rule](references/script-types.md#on-change-rule)

## Action Rule
Use when the user explicitly invokes behavior from a command, button, menu item, or bulk action. Best when the user
controls when the behavior runs, or when runtime `userInput` is required.
Load after selecting this script type and before
codegen: [references/script-types.md#action-rule](references/script-types.md#action-rule)

## On-Schedule Rule
Use for periodic background work over issues selected by a YouTrack search query. Best for maintenance, reminders,
escalations, cleanup, and recurring notifications that should not run during a save transaction.
Load after selecting this script type and before
codegen: [references/script-types.md#on-schedule-rule](references/script-types.md#on-schedule-rule)

## State-Machine Rule
Use when one issue field must follow a constrained lifecycle with named states, allowed transitions, guards, actions,
and optional timers. Best when free-form field edits should be replaced by an explicit transition graph.
Load after selecting this script type and before
codegen: [references/script-types.md#state-machine-rule](references/script-types.md#state-machine-rule)

## SLA Rule
Use to define the set of time goals for tickets in a helpdesk project.
Load after selecting this script type and before
codegen: [references/script-types.md#sla-rule](references/script-types.md#sla-rule)

# Custom API Endpoints
Use endpoints when the app exposes callable backend behavior rather than workflow automation.

## HTTP Handler
Use for app-defined HTTP endpoints: webhook receivers, integration callbacks, health checks, or small APIs exposed by
the app.

Load after selecting this script type and before
codegen: [references/script-types.md#http-handler](references/script-types.md#http-handler)

## MCP Tools
Use when the app exposes a callable tool for YouTrack AI or an assistant runtime. Best for narrow, well-described
operations with structured inputs and outputs where the tool description controls when the AI calls it.

Load after selecting this script type and before
codegen: [references/script-types.md#mcp-tool](references/script-types.md#mcp-tool)

# Guidelines
Use guidelines as a must when writing code for any app type.

## UI Styles
Always load this for rules on what to do when styling widgets. 
[references/guidelines/styles.md](references/guidelines/styles.md)

## Code style
- In generated backend JavaScript/TypeScript, prefer arrow functions (`(ctx) => { ... }`) for callbacks, handlers,
  predicates, and local helper expressions. Use `function` declarations only for named helpers.

## JS API usage
- You need to verify every part code against the `API Reference` files. Give special notice to entity properties and
  methods.
- Never put issue link types into requirements section for any chosen script type.
- For every entity property or method validate the reference file. Only listed reference files are allowed.
- Never compare whole objects, always compare by name, login, key, id or similar.
- Issue IDs are different in the JS API and the native YouTrack REST API:
  - In the YouTrack JS API, use `Issue.id`. It is the readable issue ID, for example `DEMO-123`. There is no `Issue.idReadable`
    property in the JS API.
  - In the native YouTrack REST API, response and request body `id` values are raw IDs, for example `2-123` and there is an `idReadable` field.

## Logging
Use when deciding whether to log, what level/detail to log, and how to keep logs useful without exposing sensitive data.
Load when relevant before codegen: [references/guidelines/logging.md](references/guidelines/logging.md)

# API Reference
This is the main ground truth for the YouTrack JavaScript API. When a script type reference lists API areas, resolve them
here before writing code.

## Search guidance

Before opening large reference files, search for the exact type, property, method, function, or concept first, then open
around the matching lines. Useful patterns:

```bash
# Find high-value entity sections and common entity members.
rg -n "^### (Issue|Project|User|Set)$|^##### (fields|isVisibleTo|findByExtensionProperties)$" references/api/entities.md

# Find settings, extension properties, persistence lookup, and async invocation usage across references.
rg -n "ctx\\.settings|extensionProperties|findByExtensionProperties|invokeAsync" references

# Replace placeholders with the exact API symbol to locate its module documentation.
rg -n "functionName|methodName|propertyName" references/api
```

## Important concepts
- Async functions: [references/api/async-functions.md](references/api/async-functions.md). Load when working with
  deferred work. Contains the mental model, usage points, structure, constraints, prerequisites, and examples.
- [Set](references/api/entities.md#set): Load when working with iteration over entities. YouTrack uses custom sets (not js sets)
  for multi-value collections. Contains properties, methods, and explanations.
- Requirements: [requirements](references/api/entities.md#requirements). Load when you need to make sure
  entities exist in the YouTrack instance, or when code needs to retrieve required entities through `ctx`.
- Context: [references/api/ctx.md](references/api/ctx.md). Load when you need information about what is the `ctx` object
  and what it consist of.

## App persistence and settings
- App Settings: [references/app-persistance.md#app-settings](references/app-persistance.md#app-settings). Expose user-facing settings in the YouTrack admin UI
  for system and project administrators to configure the app. These settings are accessible from app code through
  `ctx.settings`. Load for information on required variables, scopes, lifecycle and structure.
- Extension Properties: [references/app-persistance.md#extension-properties](references/app-persistance.md#extension-properties). Load when the app
  needs app-owned persistent state, `entity-extensions.json`, `extensionProperties`, or `ctx.globalStorage`.

## Reading the API modules

The files in `references/api/` are the ground truth for module imports, top-level functions, and type details. Start with the module file, then follow its `Types` links for detail pages that list constructors, properties, methods, parameters, return values, and examples when available.

- Constructors: use entries under `## Constructors` as `new TypeName(args)` when the API explicitly documents a constructor.
- Properties: use entries under `## Properties` as `object.property`; check the listed type and whether the text says the value is readonly. Also, property is optional if the properety description says so.
- Methods: use entries under `## Methods` as `object.method(args)`; follow the parameter list and return text on that method.
- Functions: use entries under module `## Functions` after importing the module, for example `const workflow = require('@jetbrains/youtrack-scripting-api/workflow'); workflow.functionName(args);`.
- Types: use module `## Types` links to open the detailed page for entity objects, helper objects, and schemas.

### API Modules

| API area | Ground-truth file | Runtime import in app code |
| --- | --- | --- |
| `date-time` | [./references/api/date-time.md](./references/api/date-time.md) | `require('@jetbrains/youtrack-scripting-api/date-time')` |
| `entities` | [./references/api/entities.md](./references/api/entities.md) | `require('@jetbrains/youtrack-scripting-api/entities')` |
| `http` | [./references/api/http.md](./references/api/http.md) | `require('@jetbrains/youtrack-scripting-api/http')` |
| `license` | [./references/api/license.md](./references/api/license.md) | `require('@jetbrains/youtrack-scripting-api/license')` |
| `notifications` | [./references/api/notifications.md](./references/api/notifications.md) | `require('@jetbrains/youtrack-scripting-api/notifications')` |
| `search` | [./references/api/search.md](./references/api/search.md) | `require('@jetbrains/youtrack-scripting-api/search')` |
| `strings` | [./references/api/strings.md](./references/api/strings.md) | `require('@jetbrains/youtrack-scripting-api/strings')` |
| `workflow` | [./references/api/workflow.md](./references/api/workflow.md) | `require('@jetbrains/youtrack-scripting-api/workflow')` |
