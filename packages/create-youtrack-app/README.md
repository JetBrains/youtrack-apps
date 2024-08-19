# Create YouTrack App
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

 - [ ] update the code to use this as external tool
 - [ ] permissions in `widget.add`
 - [ ] possibly rewrite `property add` to JSON-based approach
 - [ ] full list of the extension properties entities
 - [ ] creation of http handlers
 - [ ] TypeScript support (at least widgets/handlers/extension-propertioes should be added to `app.d.ts` file)
 - [ ] `React` + `ring-ui` support in widget templates
 - [ ] wording review
 - [ ] testing
 - [ ] documentation
