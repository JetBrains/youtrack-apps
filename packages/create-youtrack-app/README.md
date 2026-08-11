# Create YouTrack App

[![Build Status][ci-img]][ci-project] [![NPM Version][npm-img]][npm-page]

[![official JetBrains project](https://jb.gg/badges/official-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)

Apps in YouTrack let you add features, tools, and integrations that are not available out of the box.
They help you tailor YouTrack to your organization's needs, whether that means improving project management,
reporting, automation, or integrations with other tools in your software ecosystem.
To learn more about app development for YouTrack, please refer to our [Developer Portal](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-documentation.html).

## Quick Start

1. Create an empty directory for your app.
2. Run `npm create @jetbrains/youtrack-app`.
3. Follow the prompts in the generator. If you choose JavaScript, the initial project contains app metadata and build tooling only. Add rules, settings, entity extensions, widgets, and handlers when you need them.

For non-interactive app creation, pass the metadata as flags. The default type is `ts`, and dependencies are installed after scaffolding:

```bash
npx @jetbrains/create-youtrack-app \
  app init \
  --name my-youtrack-app \
  --title "My YouTrack App" \
  --description "Internal YouTrack app" \
  --vendor "My Company" \
  --vendor-url "https://example.com"
```

Use `--type ts` to create a TypeScript app with Enhanced DX, or `--type js` for the basic JavaScript app.
For a TypeScript app without the sample widget, add `--backend-only`.

## Adding Features to a Generated App

After you have generated an app, you may want to add more features. Add new features quickly with one of these commands:

| Action                                                                                                                 | Command |
|------------------------------------------------------------------------------------------------------------------------| --- |
| Add a [settings declaration](https://www.jetbrains.com/help/youtrack/devportal-apps/app-settings.html)                 | `npx @jetbrains/create-youtrack-app settings init` |
| Add one or more properties to the setting schema created using the command listed above                                | `npx @jetbrains/create-youtrack-app settings add` |
| Add another [widget](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-widgets.html)                         | `npx @jetbrains/create-youtrack-app widget add` |
| Declare an [extension property](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-extension-properties.html) | `npx @jetbrains/create-youtrack-app extension-property add` |
| Add an [HTTP handler](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html)        | `npx @jetbrains/create-youtrack-app http-handler add` |
| Add a typed HTTP endpoint (TypeScript Enhanced DX only)                                                               | `npx @jetbrains/create-youtrack-app endpoint add` |
| Add a classic workflow rule                                                                                           | `npx @jetbrains/create-youtrack-app rule add --type onChange --name notify-on-change` |
| View a list of available commands                                                                                      | `npx @jetbrains/create-youtrack-app --help` |

## App Skill Commands

The skill gives supported AI coding agents YouTrack app development guidance.
It is installed from the copy included with the CLI package.

| Command | Description |
| --- | --- |
| `npx @jetbrains/create-youtrack-app skill install` | Detects supported agents and lets you choose agents plus global or project installation. |
| `npx @jetbrains/create-youtrack-app skill status` | Shows global and project installation status. |

Supported agents are Claude Code, Codex CLI and Junie. Global installs use symlinks in the agent home config. Project installs use hard copies under the current directory. If the included skill is unavailable, installation fails with an explicit error.

## Classic Workflow Rules

**Syntax:** `npx @jetbrains/create-youtrack-app rule add --type <type> --name <name>`
- `<type>`: `onChange`, `onSchedule`, `action`, `stateMachine`, or `sla`
- `<name>`: lowercase dashed filename stem, for example `notify-on-change`
- JavaScript apps create `src/<name>.js`, beside handlers and shared helpers.
- TypeScript Enhanced DX apps create `src/workflows/<name>.ts`.

This command only scaffolds the classic workflow source file and does not update `manifest.json`.

Generated JavaScript apps use one build command. `npm run build` packages a backend-only app when `manifest.json` has no widgets, and runs the full widget build after widgets are added.

### Enhanced DX: NestJS-Style Code Generation

Apps created with **Enhanced DX (TypeScript)** include a simplified, NestJS-inspired code generation workflow:

#### Quick Commands

Generated Enhanced DX apps include `npm run generate` (or `npm run g` for short), using the same entity/action command shape:

**HTTP Handlers:**
```bash
npm run g -- http-handler add --scope global --path health                    # GET handler (default)
npm run g -- http-handler add --scope project --path users --method POST      # Override method
```

**Extension Properties:**
```bash
npm run g -- extension-property add --entity Issue --name customStatus              # string type (default)
npm run g -- extension-property add --entity Project --name rating --type integer   # Override type
npm run g -- extension-property add --entity Issue --name tags --type string --set  # Multi-value property
```

**App Settings:**
```bash
npm run g -- settings init --title "..." --description "..."  # Create settings schema
npm run g -- settings init                                     # Interactive mode
npm run g -- settings add                                      # Add property (interactive)
```

**Interactive Menu:**
```bash
npm run g                                             # Shows a menu for choosing what to generate
```

#### Syntax Reference

**HTTP Handler:** `npm run g -- http-handler add --scope <scope> [--path <path>] [--method METHOD] [--permissions PERMS]`
- `<scope>`: `global`, `project`, `issue`, `article`, or `user`
- `<path>`: Route path (can be nested with `/`)
- `--method`: `GET`, `POST`, `PUT`, `DELETE` (default: `GET`)
- `--permissions`: Comma-separated permissions (optional)

**Typed Endpoint:** `npx @jetbrains/create-youtrack-app endpoint add [--scope <scope>] [--path <path>] [--method METHOD] [--request-type TYPE] [--response-type TYPE] [--controller NAME]`
- TypeScript Enhanced DX apps only; omit the options for interactive prompts.
- `<scope>`: `global`, `issue`, `project`, or `custom`
- `<path>`: Route path below the selected scope
- `--method`: `GET`, `POST`, `PUT`, `DELETE` (default: `GET`)
- `--request-type` and `--response-type`: Type names or `never` (default: `never`)
- `--controller`: Existing exported controller name; omit to generate an inline handler

**Extension Property:** `npm run g -- extension-property add --entity <Entity> --name <name> [--type TYPE] [--set]`
- `<Entity>`: `Issue`, `User`, `Project`, or `Article`
- `<name>`: Property name (valid identifier)
- `--type`: `string`, `integer`, `float`, `boolean`, `Issue`, `User`, `Project`, or `Article` (default: `string`)
- `--set`: Makes it multi-value (optional)

**App Settings:** `npm run g -- settings init [--title TITLE] [--description DESC]`
- `init`: Initialize settings schema
  - With arguments, `--title` and `--description` create the schema directly.
  - Without args: interactive prompts for the title and description
- `add`: Adds a new property to an existing settings schema (interactive only)

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
