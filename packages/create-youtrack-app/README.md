# YouTrack App Generator

[![Build Status][ci-img]][ci-project] [![NPM Version][npm-img]][npm-page]

[![official JetBrains project](https://jb.gg/badges/official-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)

Apps in YouTrack let you add features, tools, and integrations that are not available out of the box.
They help you tailor YouTrack to your organization's needs, whether that means improving project management,
reporting, automation, or integrations with other tools in your software ecosystem.
To learn more about app development for YouTrack, please refer to our [Developer Portal](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-documentation.html).

## Quick Start

1. Create an empty directory for your app.
2. Run `npm create @jetbrains/youtrack-app`.
3. Follow the prompts in the generator.

## Adding Features to a Generated App

After you have generated an app, you may want to add more features. Add new features quickly with one of these commands:

| Action                                                                                                                 | Command |
|------------------------------------------------------------------------------------------------------------------------| --- |
| Add a [settings declaration](https://www.jetbrains.com/help/youtrack/devportal-apps/app-settings.html)                 | `npx @jetbrains/create-youtrack-app settings init` |
| Add one or more properties to the setting schema created using the command listed above                                | `npx @jetbrains/create-youtrack-app settings add` |
| Add another [widget](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-widgets.html)                         | `npx @jetbrains/create-youtrack-app widget add` |
| Declare an [extension property](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-extension-properties.html) | `npx @jetbrains/create-youtrack-app extension-property add` |
| Add an [HTTP handler](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html)        | `npx @jetbrains/create-youtrack-app http-handler add` |
| Install or update the YouTrack app builder skill for Codex and Claude                                                 | `npx @jetbrains/create-youtrack-app skill install --agent both` |
| View a list of available commands                                                                                      | `npx @jetbrains/create-youtrack-app --help` |

## Agent Skill

The generator also ships the `youtrack-app-builder` agent skill for AI coding agents that support local skill folders.
Use it to give Codex or Claude YouTrack app development guidance for manifests, workflows, HTTP handlers, settings and extension properties.

Install the skill:

```bash
npx @jetbrains/create-youtrack-app skill install
```

Update an existing install from the version bundled with the current package:

```bash
npx @jetbrains/create-youtrack-app skill update
```

Check whether the skill is installed:

```bash
npx @jetbrains/create-youtrack-app skill status
```

By default, `install`, `update`, and `status` target both Codex and Claude.
Use `--agent codex`, `--agent claude`, or `--agent both` to choose a target:

```bash
npx @jetbrains/create-youtrack-app skill install --agent codex
npx @jetbrains/create-youtrack-app skill update --agent claude
npx @jetbrains/create-youtrack-app skill status --agent both
```

The command installs the skill into these folders:

| Agent  | Install path |
|--------| --- |
| Codex  | `~/.agents/skills/youtrack-app-builder` |
| Claude | `~/.claude/skills/youtrack-app-builder` |

Each install writes `.youtrack-skill-install.json` in the target skill folder with the source package version, install timestamp, and target agent.

### Agent Skill Sync Contract

The bundled skill is refreshed by `.github/workflows/update-agent-skill.yml`.
Required source directory contents:

- `SKILL.md` at the root of `source_path`.
- Any optional skill files that should be published with the package, such as `agents/openai.yaml`, `references/`, `scripts/`, or `assets/`.

Do not include local install state in the source directory, such as `.youtrack-skill-install.json`; that file is written only when users run `skill install` or `skill update`.

The dispatch payload must use this shape:

```json
{
  "event_type": "update-youtrack-agent-skill",
  "client_payload": {
    "source_repo": "owner/repository",
    "source_ref": "main",
    "source_path": "path/to/skill",
    "target_branch": "main"
  }
}
```

Payload fields:

| Field | Required | Description |
|-------|----------|-------------|
| `source_repo` | Yes | GitHub repository in `owner/repository` form. |
| `source_ref` | Yes | Branch, tag, or commit SHA to check out from the source repository. |
| `source_path` | Yes | Relative path inside the source repository. Absolute paths and `..` segments are rejected. |
| `target_branch` | No | Branch in this repository to update. Defaults to `main`. |

When triggered, the workflow checks out the source repository and replaces `packages/create-youtrack-app/resources/skill/youtrack-app-builder` with the contents of `source_path`.
If files changed, it commits directly to `target_branch`.

If the source repository is private, configure `SKILL_SYNC_TOKEN` in this repository with permission to read the source repository and push to the target branch.
For public source repositories, the default GitHub token is sufficient for checkout, but direct pushes still require this repository's workflow permissions to allow `contents: write`.

### Enhanced DX: NestJS-Style Code Generation

Apps created with **Enhanced DX (TypeScript)** include a simplified, NestJS-inspired code generation workflow:

#### Quick Commands

Generated Enhanced DX apps include `npm run generate` (or `npm run g` for short), with support for smart positional arguments:

**HTTP Handlers:**
```bash
npm run g -- handler global/health                    # GET handler (default)
npm run g -- handler project/users --method POST      # Override method
npm run g -- h issue/comments --method POST --permissions read-issue,update-issue
```

**Extension Properties:**
```bash
npm run g -- property Issue.customStatus              # string type (default)
npm run g -- property Comment.rating --type integer   # Override type
npm run g -- p Issue.tags --type string --set         # Multi-value property
```

**App Settings:**
```bash
npm run g -- settings init --title "..." --description "..."  # Create settings schema
npm run g -- settings init                                     # Interactive mode
npm run g -- settings add                                      # Add property (interactive)
npm run g -- s init --title "My Settings" --description "..."  # Short alias
```

**Interactive Menu:**
```bash
npm run g                                             # Shows a menu for choosing what to generate
```

#### Syntax Reference

**HTTP Handler:** `npm run g -- handler <scope>/<path> [--method METHOD] [--permissions PERMS]`
- `<scope>`: `global`, `project`, `issue`, `article`, or `user`
- `<path>`: Route path (can be nested with `/`)
- `--method`: `GET`, `POST`, `PUT`, `DELETE` (default: `GET`)
- `--permissions`: Comma-separated permissions (optional)
- **Aliases:** `handler`, `h`

**Extension Property:** `npm run g -- property <Entity>.<name> [--type TYPE] [--set]`
- `<Entity>`: `Issue`, `User`, `Project`, or `Article`
- `<name>`: Property name (valid identifier)
- `--type`: `string`, `integer`, `float`, `boolean`, `Issue`, `User`, `Project`, or `Article` (default: `string`)
- `--set`: Makes it multi-value (optional)
- **Aliases:** `property`, `prop`, `p`

**App Settings:** `npm run g -- settings init [--title TITLE] [--description DESC]`
- `init`: Initialize settings schema
  - With args: `--title` and `--description` create the schema directly (useful for tests)
  - Without args: interactive prompts for the title and description
- `add`: Adds a new property to an existing settings schema (interactive only)
- **Aliases:** `settings`, `setting`, `s`


### Contributing

To test locally, run one of the package.json scripts like `npm run widget`. This generator uses [Hygen](https://www.hygen.io/docs/generators) under the hood.

Local development tip: if you want to run your local generator instead of the published package, link it and use the binary directly:

- `cd packages/create-youtrack-app && npm install && npm link`
- Run `create-youtrack-app` (or `npm exec @jetbrains/create-youtrack-app` inside a project where you first ran `npm link @jetbrains/create-youtrack-app`).

Run `npm test` to verify the basic generation workflow.

#### Caveats
While Hygen is a powerful tool for generating files, it isn't ideal for working with JSON files. 
This means JSON manipulation can be a challenge. 
To address this issue, we have added a `injectJsCallback.js` file. 
This file contains a helper function that can be used to create custom JS actions instead of simply rendering files. 
You can find an example demonstrating the use of this function in the `_templates/settings/init/index.js` file.


[ci-project]: https://teamcity.jetbrains.com/project/JetBrainsUi_YouTrackApps_CreateYouTrackApp
[ci-img]:  https://teamcity.jetbrains.com/app/rest/builds/buildType:JetBrainsUi_YoutrackApps_Checks/statusIcon.svg
[npm-img]: https://img.shields.io/npm/v/@jetbrains/create-youtrack-app
[npm-page]: https://www.npmjs.com/package/@jetbrains/create-youtrack-app
