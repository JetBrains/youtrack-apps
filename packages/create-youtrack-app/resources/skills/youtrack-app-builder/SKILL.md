---
name: youtrack-app-builder
description: Guides building, debugging, extending, and managing JetBrains YouTrack apps and workflows. Used when scaffolding, modifying, validating, uploading, downloading, enabling, disabling, or inspecting a YouTrack app, workflow rule, app endpoint, or manifest.
---

# YouTrack App Builder

# Mandatory Operating Steps

When this skill is loaded, always follow this [PROTOCOL](./references/operating-steps.md) in order for every YouTrack app task.
Do not skip, reorder, or silently complete steps.

For any task that involves code generation, file modification, app management commands, validation, deployment, or YouTrack instance inspection, maintain this checklist internally and expose the PLAN before acting. 

# App Management
Use app management when the request is about operating on existing YouTrack apps or scaffolding brand new apps.
Prompt user for target app, directory, project short name, and output format before running commands.

## YouTrack App CLI
Use the `youtrack-app` CLI for app lifecycle and inspection operations.

| Operation                          | Command                                                       |
|------------------------------------|---------------------------------------------------------------|
| List apps                          | `youtrack-app list`                                           |
| Upload an app package or directory | `youtrack-app upload <directory>`                             |
| Download an app                    | `youtrack-app download <app>`                                 |
| Validate an app directory          | `youtrack-app validate <directory>`                           |
| Search apps                        | `youtrack-app search <query> [--json]`                        |
| Show app info                      | `youtrack-app info <app> [--json]`                            |
| Delete an app                      | `youtrack-app delete <app> [--yes]`                           |
| Enable an app                      | `youtrack-app enable <app> [--project <project-short-name>]`  |
| Disable an app                     | `youtrack-app disable <app> [--project <project-short-name>]` |
| Attach an app to a project         | `youtrack-app attach <app> --project <project-short-name>`    |
| Detach an app from a project       | `youtrack-app detach <app> --project <project-short-name>`    |
| Show app logs                      | `youtrack-app logs <app> [--top N] [--json]`                  |
| Show requirement errors            | `youtrack-app requirement-errors <app> [--json]`              |

For app management final output, report the command that was run, the target app or directory, the important result, and
any follow-up command needed.

### YouTrack Exploration Commands

| Operation| Usage |
| --- | --- |
| Lists all projects by short name and ID. | `youtrack-app project-list` |
| Shows details for one project. Resolves by exact project ID, short name, or name, ignoring case. | `youtrack-app project-info <project>` |
| Lists custom fields configured for a project. Resolves the project by exact ID, short name, or name. | `youtrack-app project-fields <project>` |
| Lists user groups with IDs and user counts. | `youtrack-app group-list` |
| Prints IDs of users that are direct members of a user group. Resolves by exact group ID or name. | `youtrack-app group-members <group>` |
| Lists users with login, ID, and display name. | `youtrack-app user-list` |
| Shows details for one user. Resolves by exact user ID, login, name, or full name. | `youtrack-app user-info <user>` |

# Project and Module Scaffolding CLI

## Create YouTrack App commands
| Action                                                                                  | Command                                              |
|-----------------------------------------------------------------------------------------|------------------------------------------------------|
| Initialize a brand new buildable app                                                    | `create-youtrack-app --app-name [name] --title [app title] --description [app description] --vendor [vendor company] --vendor-url [website-url]`                                |
| Add a settings declaration                                                              | `create-youtrack-app settings init`                  |
| Add one or more properties to the setting schema created using the command listed above | `create-youtrack-app settings add`                   |
| Declare an extension property                                                           | `create-youtrack-app extension-property add`         |
| Add an HTTP handler                                                                     | `create-youtrack-app http-handler add`               |
| Add a workflow rule                                                                     | `create-youtrack-app rule add onChange notify-on-change` |
| View a list of available commands                                                       | `create-youtrack-app --help`                         |

## Creating inital app project
- Run `create-youtrack-app --app-name [name] --title [app title] --description [app description]`

## Workflow Rules
Syntax: `create-youtrack-app rule add <type> <name>`

- `<type>`: `onChange`, `onSchedule`, `action`, `stateMachine`, or `sla`
- `<name>`: lowercase dashed filename stem, for example `notify-on-change`
- Creates `src/backend/workflows/<name>.js`
- This command only scaffolds the classic workflow source file and does not update `manifest.json`.

## Deploying app
- Always run `npm run build` before deploying.
- App is always built into `dist`
- Always deploy `dist`

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
Load after selecting this surface and before
codegen: [references/surfaces/rules/on-change.md](references/surfaces/rules/on-change.md)

## Action Rule
Use when the user explicitly invokes behavior from a command, button, menu item, or bulk action. Best when the user
controls when the behavior runs, or when runtime `userInput` is required.
Load after selecting this surface and before
codegen: [references/surfaces/rules/action.md](references/surfaces/rules/action.md)

## On-Schedule Rule
Use for periodic background work over issues selected by a YouTrack search query. Best for maintenance, reminders,
escalations, cleanup, and recurring notifications that should not run during a save transaction.
Load after selecting this surface and before
codegen: [references/surfaces/rules/on-schedule.md](references/surfaces/rules/on-schedule.md)

## State-Machine Rule
Use when one issue field must follow a constrained lifecycle with named states, allowed transitions, guards, actions,
and optional timers. Best when free-form field edits should be replaced by an explicit transition graph.
Load after selecting this surface and before
codegen: [references/surfaces/rules/state-machine.md](references/surfaces/rules/state-machine.md)

## SLA Rule
Use to define the set of time goals for tickets in a helpdesk project.
Load after selecting this surface and before
codegen: [references/surfaces/rules/sla.md](references/surfaces/rules/sla.md)

# Custom API Endpoints
Use endpoints when the app exposes callable backend behavior rather than workflow automation.

## HTTP Handler
Use for app-defined HTTP endpoints: webhook receivers, integration callbacks, health checks, or small APIs exposed by
the app.

Load after selecting this surface and before
codegen: [references/surfaces/custom-api-endpoints/http-handler.md](references/surfaces/custom-api-endpoints/http-handler.md)

## MCP Tools
Use when the app exposes a callable tool for YouTrack AI or an assistant runtime. Best for narrow, well-described
operations with structured inputs and outputs where the tool description controls when the AI calls it.

Load after selecting this surface and before
codegen: [references/surfaces/custom-api-endpoints/mcp-tool.md](references/surfaces/custom-api-endpoints/mcp-tool.md)

# Guidelines
Use guidelines as a must when writing code for any app surface.

## JS API usage
- You need to verify every part code against the `API Reference` files. Give special notice to entity properties and
  methods.
- Never put issue link types into requirements section for any chosen surface.
- For every entity property or method validate the reference file. Only listed reference files are allowed.
- Never compare whole objects, always compare by name, login, key, id or similar.

## Fron-end
- Whether user requests modification of the UI or a new component/s always use `Ring UI`.

## Logging
Use when deciding whether to log, what level/detail to log, and how to keep logs useful without exposing sensitive data.
Load when relevant before codegen: [references/guidelines/logging.md](references/guidelines/logging.md)

# API Reference
This is the main ground truth for the YouTrack JavaScript API. When a surface reference lists API areas, resolve them
here before writing code.

## Important concepts
- Async functions: [references/api/async-functions.md](references/api/async-functions.md). Load when working with
  deferred work. Contains the mental model, usage points, structure, constraints, prerequisites, and examples.
- [Set](references/api/set.md): Load when working with iteration over entities. YouTrack uses custom sets (not js sets)
  for multi-value collections. Contains properties, methods, and explanations.
- Requirements: [references/api/requirements.md](references/api/requirements.md). Load when you need to make sure
  entities exist in the YouTrack instance, or when code needs to retrieve required entities through `ctx`.
- Context: [references/api/ctx.md](references/api/ctx.md). Load when you need information about what is the `ctx` object
  and what it consist of.

## App persistence and settings
- App Settings: [references/settings.md](references/settings.md). Expose user-facing settings in the YouTrack admin UI
  for system and project administrators to configure the app. These settings are accessible from app code through
  `ctx.settings`. Load for information on required variables, scopes, lifecycle and structure.
- Extension Properties: [references/extension-properties.md](references/extension-properties.md). Load when the app
  needs app-owned persistent state, `entity-extensions.json`, `extensionProperties`, or `ctx.globalStorage`.

## Reading the API modules
The files in `references/api/` are the ground truth for module imports, top-level functions, and type details. Start
with the module file, then follow its `Types` links for detail pages that list constructors, properties, methods,
parameters, return values, and examples when available.

- Constructors: use entries under `## Constructors` as `new TypeName(args)` when the API explicitly documents a
  constructor.
- Properties: use entries under `## Properties` as `object.property`; check the listed type and whether the text says
  the value is readonly or optional.
- Methods: use entries under `## Methods` as `object.method(args)`; follow the parameter list and return text on that
  method.
- Functions: use entries under module `## Functions` after importing the module, for example
  `const workflow = require('@jetbrains/youtrack-scripting-api/workflow'); workflow.functionName(args);`.
- Types: use module `## Types` links to open the detailed page for entity objects, helper objects, and schemas.

### API Modules
| API area        | Ground-truth file                                                      | Runtime import in app code                                   |
|-----------------|------------------------------------------------------------------------|--------------------------------------------------------------|
| `date-time`     | [./references/api/date-time.md](./references/api/date-time.md)         | `require('@jetbrains/youtrack-scripting-api/date-time')`     |
| `entities`      | [./references/api/entities.md](./references/api/entities.md)           | `require('@jetbrains/youtrack-scripting-api/entities')`      |
| `http`          | [./references/api/http.md](./references/api/http.md)                   | `require('@jetbrains/youtrack-scripting-api/http')`          |
| `license`       | [./references/api/license.md](./references/api/license.md)             | `require('@jetbrains/youtrack-scripting-api/license')`       |
| `notifications` | [./references/api/notifications.md](./references/api/notifications.md) | `require('@jetbrains/youtrack-scripting-api/notifications')` |
| `search`        | [./references/api/search.md](./references/api/search.md)               | `require('@jetbrains/youtrack-scripting-api/search')`        |
| `strings`       | [./references/api/strings.md](./references/api/strings.md)             | `require('@jetbrains/youtrack-scripting-api/strings')`       |
| `workflow`      | [./references/api/workflow.md](./references/api/workflow.md)           | `require('@jetbrains/youtrack-scripting-api/workflow')`      |
