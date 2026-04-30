# YouTrack App Generator

[![Build Status][ci-img]][ci-project] [![NPM Version][npm-img]][npm-page]

[![official JetBrains project](https://jb.gg/badges/official-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)

Apps in YouTrack let you add new features, tools, and integrations that aren't available out of the box.
They can help you customize YouTrack to fit your organization's specific needs, improving your project management, 
reporting, automation, or integrating with other tools in your software ecosystem.
To learn more about app development for the YouTrack platform, please refer to our [Developer Portal](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-documentation.html).

## Quick Start

1. Prepare an empty directory for your app
2. Run the command `npm create @jetbrains/youtrack-app`
3. Follow the prompts provided by the generator

## Adding Features to a Generated App

After you have generated an app, you may want to add more features. Add new features quickly with one of these commands:

| Action                                                                                                                 | Command |
|------------------------------------------------------------------------------------------------------------------------| --- |
| Add a [settings declaration](https://www.jetbrains.com/help/youtrack/devportal-apps/app-settings.html)                 | `npx @jetbrains/create-youtrack-app settings init` |
| Add one or more properties to the setting schema created using the command listed above                                | `npx @jetbrains/create-youtrack-app settings add` |
| Add another [widget](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-widgets.html)                         | `npx @jetbrains/create-youtrack-app widget add` |
| Declare an [extension property](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-extension-properties.html) | `npx @jetbrains/create-youtrack-app extension-property add` |
| Add an [HTTP handler](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html)        | `npx @jetbrains/create-youtrack-app http-handler add` |
| View a list of available commands                                                                                      | `npx @jetbrains/create-youtrack-app --help` |

### Enhanced DX: NestJS-Style Code Generation

For apps created with **Enhanced DX (TypeScript)**, a simplified, NestJS-inspired code generation workflow is available:

#### Quick Commands

Generated Enhanced DX apps include `npm run generate` (or `npm run g` for short), which supports smart positional arguments:

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
  - Without args: Interactive prompts for title and description
- `add`: Add a new property to an existing settings schema (interactive only)
- **Aliases:** `settings`, `setting`, `s`


### Contributing

To test locally, run one of the package.json scripts like `npm run widget`. This generator uses [Hygen](https://www.hygen.io/docs/generators) under the hood.

Local development tip: if you want to run your local generator instead of the published package, link it and use the binary directly:

- `cd packages/create-youtrack-app && npm install && npm link`
- Run `create-youtrack-app` (or `npm exec @jetbrains/create-youtrack-app` inside a project where you first ran `npm link @jetbrains/create-youtrack-app`).

Run `npm test` to check basic generation workflow.

#### Caveats
While Hygen is a powerful tool for generating files, it isn't ideal for working with JSON files. 
This means JSON manipulation can be a challenge. 
To address this issue, we have added a `injectJsCallback.js` file. 
This file contains a helper function that can be used to create custom JS actions instead of simply rendering files. 
An example that demonstrates the use of this function can be found in the `_templates/settings/init/index.js` file.


[ci-project]: https://teamcity.jetbrains.com/project/JetBrainsUi_YouTrackApps_CreateYouTrackApp
[ci-img]:  https://teamcity.jetbrains.com/app/rest/builds/buildType:JetBrainsUi_YoutrackApps_Checks/statusIcon.svg
[npm-img]: https://img.shields.io/npm/v/@jetbrains/create-youtrack-app
[npm-page]: https://www.npmjs.com/package/@jetbrains/create-youtrack-app
