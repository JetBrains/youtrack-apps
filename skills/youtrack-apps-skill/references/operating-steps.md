## Purpose

This protocol is a guide. Routine requests should not follow the protocol.
Keep the checklist internal and share only what helps the user understand, verify, or unblock the work.

## Step 1: Understand the request

Classify the task internally only when the distinction changes the tools or
safeguards you need:

- `answer-only`: explain concepts or answer questions without commands or code changes
- `manage-existing-app`: deploy, list, search, download, upload, enable, disable, attach, detach, validate, or inspect an app
- `scaffold-new-app`: create a new app or add a new app module
- `modify-existing-app`: change code, manifest, settings, workflows, endpoints, UI, or API usage
- `release-or-publish-app`: prepare GitHub release automation, create a release, or submit a released app to JetBrains Marketplace

Do not print the classification.

## Step 2: Resolve inputs from context

Use the request and any already-known context. Inspect the repository, manifest,
or environment only when they answer a question that matters to the action:

- target app name or app id
- app type for brand-new app scaffolding: TypeScript app with Enhanced DX (`--type ts`) or basic JavaScript app (`--type js`)
- project short name, if project-specific
- requested output: explanation, implementation, validation, deployment, or release
- source repository remote and whether it is GitHub, when release readiness matters
- Marketplace listing/plugin id and intended channel, when publishing is requested

Ask concise question only if missing information blocks work. Do not ask for information already established
in the current task.

## Step 3: Inspect only what informs the task

For source changes, inspect local files first. Access the YouTrack instance
when runtime state, entities, requirements, settings, attachment, or deployment
feasibility matters. Do not inspect it by default or because the skill is
loaded.

## Step 4: Generate or modify code

When writing code:

- Follow the reference for the selected script type.
- For widget declaration, extension point, visibility, dimensions, or widget generator work, follow [`Widgets`](../references/widgets.md).
- For frontend/UI implementation work, follow [`Frontend`](../references/frontend.md).
- Do not put issue link types in workflow requirements.
- Do not make rule -> HTTP handler calls within the same app. Only frontend widgets call HTTP handlers; follow [`Frontend`](../references/frontend.md).
- Do not compare whole objects. Compare a stable scalar value such as name, login, key, or id.
- For a widget, determine whether its extension point has a project context before choosing an endpoint or settings scope. Follow [`Widgets`](../references/widgets.md#scope-and-project-context).
- Use `npm run build` before deployment.
- Deploy only `dist`.

## Step 5: Validate in proportion to risk

Use the smallest validation set that provides meaningful confidence:

- documentation or metadata only: formatting, links, schema, or focused checks;
- backend logic: focused tests plus lint/type/build checks appropriate to risk;
- frontend behavior: focused tests, lint/build, and visual or live smoke testing
  when layout or host integration matters;
- app package or manifest: build and `youtrack-app app validate`;

Run the release-readiness check only when release, distribution, or Marketplace
publication is in scope. Do not add release work to an ordinary code or deploy
task.

## Step 6: Deployment and runtime validation

Deploy, attach, enable, disable, or publish only when the user requests it. A
direct request or affirmative answer in the current conversation is enough; do
not ask for the same approval again.

After a deployment, upload, enablement, or attachment, check:
- requirement errors
- recent logs

Report only what is relevant:
- deployment result
- attachment or enablement target, if any
- requirement error status
- log status
- smoke-test result, if performed
- unresolved errors or required follow-up actions.

Keep the final response concise.
