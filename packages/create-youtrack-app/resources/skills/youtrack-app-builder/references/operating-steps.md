## Step 1: Classify the request

Classify the request as one of the common task types:

- `answer-only`: explain concepts or answer questions without commands or code changes
- `manage-existing-app`: deploy, list, search, download, upload, enable, disable, attach, detach, validate, or inspect an app
- `scaffold-new-app`: create a new app or add a new app module
- `modify-existing-app`: change code, manifest, settings, workflows, endpoints, UI, or API usage

## Step 2: Extract user-provided data

Extract and remember all user-provided data, including:

- target app name or app id
- project short name, if project-specific
- desired app script types: workflow rule, HTTP handler, MCP tool, manifest, settings, entity extension, UI, or unknown
- requested output format: explanation, plan, files - modified, sources, suggested actions.

## Step 3: Check Required-input

Before running commands, modifying files, or generating final code, check whether the selected task type has all required inputs.

Required inputs by task type:

- `manage-existing-app`: target app and desired action
- `scaffold-new-app`: app name, title, description
- `modify-existing-app`: the requested change

If required input is missing, ask the user one concise grouped question and stop.
Do not assume missing app names, project short names, or destructive confirmations.

## Step 4: Explore YouTrack

Use YouTrack exploration commands to verify existance of required data in the running instance.

Use exploration to verify feasibility - [YouTrack Exploration Commands](#youtrack-exploration-commands)

If exploration reveals ambiguity or infeasibility, ask the user before proceeding.

This is valuable when you set requirements, you need to validate wether the required entity exists.

## Step 5: Print PLAN before action

Before writing code, modifying files, or running any command that changes files or the YouTrack instance, print:

PLAN:
1. Task type 
2. Known inputs
3. Missing assumptions, if any
4. Files or references to read
5. Commands to run, if any
6. Expected outputs

After printing the PLAN:
- For read-only work, proceed.
- For write operations, proceed only if the user requested code/file changes.
- For destructive operations, ask for explicit confirmation and stop.

## Step 6: Select app script type and load references

Before code generation, select primary app script type:
- [rules](#rules)
- [Custom API Endpoints](#custom-api-endpoints)

Load the linked app script type reference before codegen.

Then load only the relevant API reference files needed by the code.
For every entity, property, method, constructor, and module function used in generated code, verify it against the reference files before final output.

## Step 7: Generate or modify code

When writing code:

- Follow the selected script type reference.
- Use Ring UI for any frontend/UI work if the user does not specifi otherwise.
- Use [`Host API`](../references/host-api.md) for front-end < - > back-end communication
- Never put issue link types into workflow requirements.
- Never perform rule -> http handler calls in the same app. Only front-end calls http handler via [`Host API`](../references/host-api.md)
- Never compare whole objects; compare by name, login, key, id, or similar stable scalar value.
- Use `npm run build` before deployment.
- Deploy only `dist`.

## Step 8: Validate before final answer

For code changes, final answer must include:

- Generated or modified files
- Build/validation commands run or recommended
- For every used entity property or method:
  `Does entity x have property/method y: Yes/No (reference)`
- For every used JS API function:
  `Does function x exist in JS API: Yes/No (reference)`
- Any unresolved assumptions or required user actions

Every reference must be verified.


## Step 9: Deployment and runtime validation

After code validation, deploy or attach the app only with explicit user approval.
Before deployment, ask:
`Do you want the app deployed now?`
If yes, and the app needs project-level activation, ask:
`Do you want the app attached or enabled for a project? If yes, which project short name?`
Do not assume the target project.
After any deployment, upload, enablement, or attachment:

- Check requirement errors
- Check recent logs
- If HTTP handlers are present and route/payload are known, run a `curl` smoke test and inspect logs.
- If action rules are present and route is known, run a `curl` smoke test and inspect and inspect logs.

Final response must report:
- deployment result
- attachment or enablement target, if any
- requirement error status
- log status
- smoke-test result, if performed
- unresolved errors or follow-up actions
