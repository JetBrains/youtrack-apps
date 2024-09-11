# YouTrack App Generator

[![Build Status][ci-img]][ci-project] [![NPM Version][npm-img]][npm-page]

[![official JetBrains project](https://jb.gg/badges/official-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)

Apps in YouTrack let you add new features, tools, and integrations that aren't available out of the box.
They can help you customize YouTrack to fit your organization's specific needs, improving your project management, 
reporting, automation, or integrating with other tools in your software ecosystem.
To learn more about app development for the YouTrack platform, please refer to our [Develeper Portal](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-documentation.html).

## Quick Start

1. Prepare an empty directory for your app
2. Run the command `npm create @jetbrains/youtrack-app`
3. Follow the prompts provided by the generator

## Adding Features to a Generated App

After you have generated an app, you may want to add more features. Add new features quickly with one of these commands:

| Action | Command |
| --- | --- |
| Add a [settings declaration](https://www.jetbrains.com/help/youtrack/devportal-apps/app-settings.html) | `npx @jetbrains/create-youtrack-app settings init` |
| Add one or more properties to the setting scheme created using the command listed above | `npx @jetbrains/create-youtrack-app settings add` |
| Add another [widget](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-extension-points.html) | `npx @jetbrains/create-youtrack-app widget add` |
| Declare an [extension property](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-extension-properties.html) | `npx @jetbrains/create-youtrack-app extension-property add` |
| Add an [HTTP handler](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html) | `npx @jetbrains/create-youtrack-app http-handler add` |
| View a list of available commands | `npx @jetbrains/create-youtrack-app --help` |


### Сontributing

To test locally, run one of the package.json scripts like `npm run widget`. This generator uses [Hygen](https://www.hygen.io/docs/generators) under the hood.

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
