# Create YouTrack App

[![Build Status][ci-img]][ci-project] ![NPM Version](https://img.shields.io/npm/v/@jetbrains/create-youtrack-app)

[![official JetBrains project](https://jb.gg/badges/official-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)

[this is Work in progress]

supported commands for now:
 - `hygen init manifest` - to create `manifest.json` file
 - `hygen init settings` - to create `settings.json` file
 - `hygen widget add` - to create widget directory, and add widget to `settings.json` file
 - `hygen property add` - to create extension property

### Development

To test locally, run `npm exec .`

## Documentation
https://www.hygen.io/docs/generators - Hygen is used for the documentation

## Caveats
Hygen is quite powerful tool for generation files, but it is not perfect for the working with the JSON files. So, some JSON manipulation can be tricky. To prevent this, there is a `injectJsCallback.js` file where is a helper function that can be called to create custom JS actions instead of file rendering. Example of usage `_templates/settings/index.js` file.

### TODO:

 - [x] update the code to use this as external tool
 - [x] permissions in `widget.add`
 - [ ] possibly rewrite `property add` to JSON-based approach
 - [ ] full list of the extension properties entities
 - [ ] creation of http handlers
 - [x] TypeScript support (at least widgets/handlers/extension-propertioes should be added to `app.d.ts` file)
 - [x] `React` + `ring-ui` support in widget templates
 - [ ] wording review
 - [ ] testing
 - [ ] documentation


[ci-project]: https://teamcity.jetbrains.com/project/JetBrainsUi_YouTrackApps_CreateYouTrackApp
[ci-img]:  https://teamcity.jetbrains.com/app/rest/builds/buildType:JetBrainsUi_YoutrackApps_Checks/statusIcon.svg
