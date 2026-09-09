## Purpose

Use this protocol to keep YouTrack App work correct and safe without turning
routine tasks into ceremony. Keep the reasoning checklist internal. Apply steps
proportionally and communicate only information that helps the user follow,
verify, or unblock the work.

## Step 1: Understand the request

Classify the task internally when that helps choose tools and safeguards:

- `answer-only`: explain concepts or answer questions without commands or code changes
- `manage-existing-app`: deploy, list, search, download, upload, enable, disable, attach, detach, validate, or inspect an app
- `scaffold-new-app`: create a new app or add a new app module
- `modify-existing-app`: change code, manifest, settings, workflows, endpoints, UI, or API usage
- `release-or-publish-app`: prepare GitHub release automation, create a release, or submit a released app to JetBrains Marketplace

Do not print the classification.

## Step 2: Resolve inputs from context

Gather relevant inputs from the current request, recent conversation,
repository, manifest, and environment, including:

- target app name or app id
- app type for brand-new app scaffolding: TypeScript app with Enhanced DX (`--type ts`) or basic JavaScript app (`--type js`)
- project short name, if project-specific
- desired app script types: workflow rule, HTTP handler, MCP tool, manifest, settings, entity extension, UI, or unknown
- requested output: explanation, implementation, validation, deployment, or release;
- source repository remote and whether it is GitHub, when release readiness matters
- Marketplace listing/plugin id and intended channel, when publishing is requested

Prefer safe, obvious inference. Ask one concise question only when a missing
input would select a different app, host, project, destructive target, app type,
or publication destination. Do not request values already established in the
current task.

## Step 3: Check readiness proportionally

Check only the prerequisites required for the intended action:

- answer or review: source material;
- inspect: target app, repository, or instance;
- modify: requested behavior and existing project structure;
- scaffold: app identity, title, description, and app type;
- deploy: built package, target instance, and existing authorization;
- attach or enable: target app and project;
- release or publish: repository/release identity and destination.

Reuse successful environment and CLI checks from the same session. Verify a
CLI with `--help` only before first use of an unfamiliar command. Never print
tokens or secret settings.

## Step 4: Inspect only what informs the task

Inspect local files first for source changes. Explore the YouTrack instance when
runtime state, entities, requirements, settings, attachment, or deployment
feasibility matters. Do not contact the instance merely because the skill was
loaded.

## Step 5: Communicate without ceremony

Do not print a mandatory `PLAN` or checklist. Before tool work, a short natural
language update is enough. Mention an assumption only if it affects the result.
Share another update when the result changes, a check fails, user action is
needed, or work runs long.

Proceed directly with read-only work and requested file changes. Existing user
requests such as “fix”, “build”, “deploy”, “upload”, “attach to YAS”, or a clear
affirmative reply authorize their normal in-scope steps. Ask for confirmation
only for destructive or irreversible actions, a materially broader scope, or an
ambiguous external target.

## Step 6: Load targeted references

For source changes, identify the affected app area:
- [Rules](../SKILL.md#rules)
- [Custom API Endpoints](../SKILL.md#custom-api-endpoints)

Load only the directly relevant reference: the selected rule or handler type,
frontend/widget guidance for UI work, persistence guidance for storage work, and
the exact API sections for newly introduced or changed JS API usage. Follow
links further only when required to resolve an uncertainty.

## Step 7: Generate or modify code

When writing code:

- Follow the selected script type reference.
- For widget declaration, extension point, visibility, dimensions, or widget generator work, follow [`Widgets`](../references/widgets.md).
- For frontend/UI implementation work, follow [`Frontend`](../references/frontend.md).
- Never put issue link types into workflow requirements.
- Never perform rule -> http handler calls in the same app. Only frontend widgets call HTTP handlers, following [`Frontend`](../references/frontend.md).
- Never compare whole objects; compare by name, login, key, id, or similar stable scalar value.
- Use `npm run build` before deployment.
- Deploy only `dist`.

## Step 8: Validate in proportion to risk

Use the smallest meaningful validation set:

- documentation or metadata only: formatting, links, schema, or focused checks;
- backend logic: focused tests plus lint/type/build checks appropriate to risk;
- frontend behavior: focused tests, lint/build, and visual or live smoke testing
  when layout or host integration matters;
- app package or manifest: build and `youtrack-app app validate`;
- deployment: build first and upload only `dist`.

Verify newly introduced or changed YouTrack JS API usage against the reference,
but do not emit a line-by-line API audit in the final answer unless the user
asks for it or a non-obvious compatibility decision matters.

Run the release-readiness check only when release, distribution, or Marketplace
publication is in scope. Do not add release work to an ordinary code or deploy
task.


## Step 9: Deployment and runtime validation

Deploy, attach, enable, disable, or publish only when the user requested that
action. A direct request or affirmative answer in the current conversation is
sufficient; do not ask for the same approval again. Ask for a project only when
attachment or project enablement is needed and the target cannot be resolved
unambiguously from the request or established context.
After any deployment, upload, enablement, or attachment:
- Check requirement errors
- Check recent logs

Report only the relevant outcome:
- deployment result
- attachment or enablement target, if any
- requirement error status
- log status
- smoke-test result, if performed
- unresolved errors or required follow-up actions.

Keep the final response concise. Do not repeat the full plan, command transcript,
unchanged settings, or checks that add no confidence for the requested outcome.
