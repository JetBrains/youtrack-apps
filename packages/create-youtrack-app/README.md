# Create YouTrack App

[![Build Status][ci-img]][ci-project] [![NPM Version][npm-img]][npm-page]

[![official JetBrains project](https://jb.gg/badges/official-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)

YouTrack App is an App that can be installed into JetBrains YouTrack to customize it even more. See [documentation](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-documentation.html).

## Quick Start

1. Prepare an empty directory for your App
2. Run `npm create @jetbrains/youtrack-app`
3. Follow the prompts

## Adding more features to generated App

Once App is generated, one may need to add more features. See list of awailable commands:

* `npx @jetbrains/create-youtrack-app --help` to see list of possible commands
* `npx @jetbrains/create-youtrack-app settings init` to add a [settings declaration](https://www.jetbrains.com/help/youtrack/devportal-apps/app-settings.html)
* `npx @jetbrains/create-youtrack-app settings add` to add one more property into Settings, created by command above
* `npx @jetbrains/create-youtrack-app widget add` to add one more [widget](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-extension-points.html)
* `npx @jetbrains/create-youtrack-app extension-property add` to declare [extension property](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-extension-properties.html)
* `npx @jetbrains/create-youtrack-app http-handler add` to add an [HTTP handler](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html)

### Development

To test locally, run one of the package.json scripts like `npm run widget`. This generator uses [Hygen](https://www.hygen.io/docs/generators) udner the hood.

Run `npm test` to check basic generation workflow.

## Caveats
Hygen is quite powerful tool for generation files, but it is not perfect for the working with the JSON files. So, some JSON manipulation can be tricky. To prevent this, there is a `injectJsCallback.js` file where is a helper function that can be called to create custom JS actions instead of file rendering. Example of usage `_templates/settings/index.js` file.

### TODO:

 - [x] update the code to use this as external tool
 - [x] permissions in `widget.add`
 - [ ] possibly rewrite `settings add` to JSON-based approach
 - [ ] full list of the extension properties entities
 - [x] creation of http handlers
 - [x] TypeScript support (at least widgets/handlers/extension-propertioes should be added to `app.d.ts` file)
 - [x] `React` + `ring-ui` support in widget templates
 - [ ] wording review
 - [ ] testing
 - [ ] documentation


[ci-project]: https://teamcity.jetbrains.com/project/JetBrainsUi_YouTrackApps_CreateYouTrackApp
[ci-img]:  https://teamcity.jetbrains.com/app/rest/builds/buildType:JetBrainsUi_YoutrackApps_Checks/statusIcon.svg
[npm-img]: https://img.shields.io/npm/v/@jetbrains/create-youtrack-app
[npm-page]: https://www.npmjs.com/package/@jetbrains/create-youtrack-app
