## Purpose

Use this protocol to complete YouTrack App work safely without adding ceremony
to routine tasks. Keep the checklist internal. Scale the steps to the work, and
share only information that helps the user understand, verify, or unblock it.

## Step 1: Understand the request

When it helps you choose the right tools and safeguards, classify the task
internally:

- `answer-only`: explain concepts or answer questions without commands or code changes
- `manage-existing-app`: deploy, list, search, download, upload, enable, disable, attach, detach, validate, or inspect an app
- `scaffold-new-app`: create a new app or add a new app module
- `modify-existing-app`: change code, manifest, settings, workflows, endpoints, UI, or API usage
- `release-or-publish-app`: prepare GitHub release automation, create a release, or submit a released app to JetBrains Marketplace

Do not print the classification.

## Step 2: Resolve inputs from context

Use the request, recent conversation, repository, manifest, and environment to
identify the inputs that matter:

- target app name or app id
- app type for brand-new app scaffolding: TypeScript app with Enhanced DX (`--type ts`) or basic JavaScript app (`--type js`)
- project short name, if project-specific
- desired app script types: workflow rule, HTTP handler, MCP tool, manifest, settings, entity extension, UI, or unknown
- requested output: explanation, implementation, validation, deployment, or release
- source repository remote and whether it is GitHub, when release readiness matters
- Marketplace listing/plugin id and intended channel, when publishing is requested

Make safe, obvious inferences. Ask one concise question only if a missing value
could change the app, host, project, destructive target, app type, or
publication destination. Do not ask for information already established in the
current task.

## Step 3: Check readiness proportionally

Check only the prerequisites needed for the action:

- answer or review: source material;
- inspect: target app, repository, or instance;
- modify: requested behavior and existing project structure;
- scaffold: app identity, title, description, and app type;
- deploy: built package, target instance, and existing authorization;
- attach or enable: target app and project;
- release or publish: repository/release identity and destination.

Reuse successful environment and CLI checks from the current session. Before
using an unfamiliar command, verify the CLI with `--help`. Never print tokens
or secret settings.

## Step 4: Inspect only what informs the task

For source changes, inspect local files first. Access the YouTrack instance
only when runtime state, entities, requirements, settings, attachment, or
deployment feasibility matters. Do not contact the instance just because the
skill is loaded.

## Step 5: Communicate without ceremony

Do not print a mandatory `PLAN` or checklist. Before using tools, give a short,
natural-language update. Mention assumptions only when they affect the result.
Send another update if the result changes, a check fails, user action is needed,
or the work takes a while.

Proceed directly with read-only work and requested file changes. Requests such
as “fix”, “build”, “deploy”, “upload”, or “attach to YAS”, as well as a clear
affirmative reply, authorize their normal in-scope steps. Ask for confirmation
only before destructive or irreversible work, a materially broader scope, or an
ambiguous external target.

## Step 6: Load targeted references

For source changes, first identify the affected app area:

- [Rules](../SKILL.md#rules)
- [Custom API Endpoints](../SKILL.md#custom-api-endpoints)

Load only the references you need: the selected rule or handler type,
frontend/widget guidance for UI work, persistence guidance for storage work,
and the exact API sections for new or changed JS API usage. Follow additional
links only when they resolve an uncertainty.

## Step 7: Generate or modify code

When writing code:

- Follow the reference for the selected script type.
- For widget declaration, extension point, visibility, dimensions, or widget generator work, follow [`Widgets`](../references/widgets.md).
- For frontend/UI implementation work, follow [`Frontend`](../references/frontend.md).
- Do not put issue link types in workflow requirements.
- Do not make rule -> HTTP handler calls within the same app. Only frontend widgets call HTTP handlers; follow [`Frontend`](../references/frontend.md).
- Do not compare whole objects. Compare a stable scalar value such as name, login, key, or id.
- Use `npm run build` before deployment.
- Deploy only `dist`.

## Step 8: Validate in proportion to risk

Use the smallest validation set that provides meaningful confidence:

- documentation or metadata only: formatting, links, schema, or focused checks;
- backend logic: focused tests plus lint/type/build checks appropriate to risk;
- frontend behavior: focused tests, lint/build, and visual or live smoke testing
  when layout or host integration matters;
- app package or manifest: build and `youtrack-app app validate`;
- deployment: build first and upload only `dist`.

Check new or changed YouTrack JS API usage against the reference. Do not include
a line-by-line API audit in the final response unless the user asks for one or a
non-obvious compatibility decision matters.

Run the release-readiness check only when release, distribution, or Marketplace
publication is in scope. Do not add release work to an ordinary code or deploy
task.


## Step 9: Deployment and runtime validation

Deploy, attach, enable, disable, or publish only when the user requests it. A
direct request or affirmative answer in the current conversation is enough; do
not ask for the same approval again. Ask for a project only when attachment or
project enablement is needed and the target is not clear from the request or
established context.

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

Keep the final response concise. Do not repeat the full plan, command transcript,
unchanged settings, or checks that add no confidence for the requested outcome.
