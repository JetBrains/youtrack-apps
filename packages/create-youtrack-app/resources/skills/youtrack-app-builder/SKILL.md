---
name: youtrack-app-builder
description: Guides building, debugging, extending, and managing JetBrains YouTrack apps and workflows. Used when scaffolding, modifying, validating, uploading, downloading, enabling, disabling, or inspecting a YouTrack app, workflow rule, app endpoint, or manifest.
metadata:
  version: 1.0.3
  YouTrackVersion: 2026.3.2907
---

# YouTrack App Builder

# Required Environment

Verify these requirements once near the start of the session before using this skill for YouTrack app work.

| Requirement | How to verify |
| --- | --- |
| Node.js `>= 24` | Run `node --version`. Node is required because both scaffolding and app management run through Node-based CLIs and npm scripts. |
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

# App Management
Use app management when the request is about operating on existing YouTrack apps or scaffolding brand new apps.
Prompt user for target app, directory, project short name, and output format before running commands.

## YouTrack App CLI
Use the `youtrack-app` CLI for app lifecycle and inspection operations.  

Look at `youtrack-app --help` for all available commands.

For app management final output, report the command that was run, the target app or directory, the important result, and
any follow-up command needed.

### YouTrack Exploration Commands

- `youtrack-app` exposed YouTrack instance exploration commands. 

# Project and Module Scaffolding CLI

## Create YouTrack App commands

- `create-youtrack-app --help` shows all scaffolding and app validating commands.

## Creating initial app project
- Run `create-youtrack-app --app-name [name]`.
- `--app-name` is the only required flag for non-interactive app creation. The CLI can derive `title` and `description`; vendor metadata can be added or corrected later in `manifest.json`.
- Treat `[name]` as a package/library name that identifies the app, not as the user-facing app title. Use lowercase ASCII words separated by hyphens and match the safe package-name regex `/^[a-z][a-z0-9-]*$/`, for example `sla-reminder` or `issue-sync`. Do not use spaces, underscores, or uppercase characters.
- Add `--title [app title]` and `--description [app description]` only when those values are already known. Always go with default `js` scaffold.

## Workflow Rules
Syntax: `create-youtrack-app rule add <type> <name>`

- `<type>`: `onChange`, `onSchedule`, `action`, `stateMachine`, or `sla`
- `<name>`: lowercase dashed filename stem, for example `notify-on-change`
- This creates `src/backend/workflows/<name>.js`.
- This command only scaffolds the classic workflow source file and does not update `manifest.json`, which means any manifest wiring or app script type declaration still has to be handled separately when needed.

## Deploying App
Deploying means uploading the validated production build from the local app project into the target YouTrack instance.
It creates or updates the installed app whose package name is `manifest.json` `name`. Deployment does not mean "publish
to Marketplace"; it changes the app installed in the configured YouTrack site.

| Command | What it does | What to expect |
|---|---|---|
| `npm run build` | Builds the app and usually runs `youtrack-app validate dist` as part of the generated build script. | A fresh `dist` directory is created. If validation fails, fix the build or manifest errors before uploading. |
| `youtrack-app validate dist` | Validates the already-built app directory. | Use this when validation was not part of the build or when you want an explicit pre-upload check. |
| `youtrack-app upload dist` | Uploads the build output to YouTrack. | The app is created or updated on the configured YouTrack instance. Upload `dist`, not the source directory. |

Before deploying, confirm the CLI is pointed at the intended instance. The `youtrack-app` CLI can read
`YOUTRACK_HOST` and `YOUTRACK_API_TOKEN` from the environment.

After upload, check what happened:

| Command | What it checks | What to do with the result |
|---|---|---|
| `youtrack-app info <app> [--json]` | Confirms the uploaded app exists and shows its package name, title, version, and status. | Use the package name from `manifest.json` as `<app>`. If the app is missing, re-check the upload target and CLI credentials. |
| `youtrack-app requirement-errors <app> [--json]` | Shows missing fields, projects, groups, users, or other requirements. | Fix the YouTrack data or app requirements before expecting workflows to run correctly. |
| `youtrack-app logs <app> [--top N] [--json]` | Shows recent runtime logs from the app. | Use after a smoke test or user action to confirm the app code actually executed. |
| `youtrack-app enable <app> [--project <project-short-name>]` | Enables the app globally or in one project. | Run when the uploaded app is installed but not active where it needs to run. |
| `youtrack-app attach <app> --project <project-short-name>` | Attaches a project-scoped app to a project. | Run when the app must be available in a specific project context. |

Next steps after deployment:
- If the app has settings, configure them in YouTrack or use the settings CLI before testing behavior.
- If the app is project-scoped, attach and enable it for the target project.
- Trigger the relevant behavior: edit an issue for an on-change rule, run the custom command for an action rule, call the
  endpoint for an HTTP handler, or open the widget location for a widget.
- Check `youtrack-app logs <app> [--top N]` and `youtrack-app requirement-errors <app>` after the smoke test.

# Manifest
Use for app identity which is `name` and package metadata like  `title`, `description`, `vendor`, `version`. Also use it
when widgets must be declared.
Load for all fields: [references/manifest.md](references/manifest.md)

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

Load after selecting this scrip type and before
codegen: [references/script-types.md#http-handler](references/script-types.md#http-handler)

## MCP Tools
Use when the app exposes a callable tool for YouTrack AI or an assistant runtime. Best for narrow, well-described
operations with structured inputs and outputs where the tool description controls when the AI calls it.

Load after selecting this script type and before
codegen: [references/script-types.md#mcp-tool](references/script-types.md#mcp-tool)

# Guidelines
Use guidelines as a must when writing code for any app script type.

## JS API usage
- You need to verify every part code against the `API Reference` files. Give special notice to entity properties and
  methods.
- Never put issue link types into requirements section for any chosen script type.
- For every entity property or method validate the reference file. Only listed reference files are allowed.
- Never compare whole objects, always compare by name, login, key, id or similar.

## Front-end
- Whether user requests modification of the UI or a new component/s always use `Ring UI` if the user does not specify otherwise.
- When connecting front-end and back-end read [Host API](./references/host-api.md)

## Logging
Use when deciding whether to log, what level/detail to log, and how to keep logs useful without exposing sensitive data.
Load when relevant before codegen: [references/guidelines/logging.md](references/guidelines/logging.md)

# API Reference
This is the main ground truth for the YouTrack JavaScript API. When a script type reference lists API areas, resolve them
here before writing code.

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
- Properties: use entries under `## Properties` as `object.property`; check the listed type and whether the text says the value is readonly or optional.
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
