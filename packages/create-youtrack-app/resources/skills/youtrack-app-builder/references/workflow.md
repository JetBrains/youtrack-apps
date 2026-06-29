## Step 1: Classify the request

Classify the request as exactly one primary task type:

- `answer-only`: explain concepts or answer questions without commands or code changes
- `inspect-instance`: read YouTrack instance/project/app information
- `manage-existing-app`: list, search, download, upload, enable, disable, attach, detach, validate, inspect, or delete an app
- `scaffold-new-app`: create a new app or add a new app module
- `modify-existing-app`: change code, manifest, settings, workflows, endpoints, UI, or API usage
- `deploy-app`: build, validate, upload, enable, attach, or otherwise deploy app output

Also classify risk:

- `read-only`
- `writes-files`
- `changes-youtrack-instance`
- `destructive`

## Step 2: Extract user-provided data

Extract and remember all user-provided data, including:

- target app name or app id
- working directory or app directory
- project short name, if project-specific
- desired app surface: workflow rule, HTTP handler, MCP tool, manifest, settings, UI, or unknown
- desired rule type: onChange, action, onSchedule, stateMachine, SLA, or unknown
- requested output format: explanation, plan, patch, files, commands, or deployed result
- constraints, examples, field names, groups, users, issue links, schedules, permissions, and acceptance criteria

## Step 3: Required-input gate

Before running commands, modifying files, or generating final code, check whether the selected task type has all required inputs.

Required inputs by task type:

- `inspect-instance`: the object to inspect, unless the request is a broad list command such as listing all projects, apps, users, or groups
- `manage-existing-app`: target app or search query, except for pure list/search operations
- `scaffold-new-app`: app name, title, description, and target directory or confirmation to create in the current directory
- `modify-existing-app`: app directory and the requested change
- `deploy-app`: app directory, deployment target, and project short name when project-specific
- `destructive`: explicit user confirmation immediately before the destructive command

If required input is missing, ask the user one concise grouped question and stop.
Do not assume missing app names, directories, project short names, or destructive confirmations.

## Step 4: Explore YouTrack only when needed

Use YouTrack exploration commands only after Step 3 passes, except for broad read-only discovery commands.

Use exploration to verify feasibility - [YouTrack Exploration Commands](../SKILL.md/#youtrack-exploration-commands)

If exploration reveals ambiguity or infeasibility, ask the user before proceeding.

## Step 5: Print PLAN before action

Before writing code, modifying files, or running any command that changes files or the YouTrack instance, print:

PLAN:
1. Task type and risk level
2. Known inputs
3. Missing assumptions, if any
4. Files or references to read
5. Commands to run, if any
6. Expected outputs
7. Rollback or safety note for risky operations

After printing the PLAN:
- For read-only work, proceed.
- For writes-files, proceed only if the user requested code/file changes.
- For changes-youtrack-instance or destructive operations, ask for explicit confirmation and stop.

## Step 6: Select app surface and load references

Before code generation, select primary app surfaces:
- [rules](../SKILL.md/#rules)
- [Custom API Endpoints](../SKILL.md/#custom-api-endpoints)

Load the linked surface reference before codegen.

Then load only the relevant API reference files needed by the code.
For every entity, property, method, constructor, and module function used in generated code, verify it against the reference files before final output.

## Step 7: Generate or modify code

When writing code:

- Follow the selected surface reference.
- Use Ring UI for any frontend/UI work.
- Never put issue link types into workflow requirements.
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

If a reference was not checked, say so clearly and do not claim the code is verified.