# manifest.json

Each YouTrack app package must include a `manifest.json` file at the root of the package directory. The manifest describes the app itself and the modules it contributes, such as frontend widgets.

## Table of contents

- [Top-level fields](#top-level-fields)
- [YouTrack version compatibility](#youtrack-version-compatibility)
- [`vendor`](#vendor)
- [`widgets`](#widgets)
- [Marketplace upload validation](#marketplace-upload-validation)
  - [Manifest rules](#manifest-rules)
  - [YouTrack version range rules](#youtrack-version-range-rules)
  - [Widget rules](#widget-rules)
- [manifest.json Example](#manifestjson-example)

## Top-level fields

| Field | Type | Description |
|---|---|---|
| `$schema` | string | Schema URL for validating the YouTrack app manifest. Use `https://json.schemastore.org/youtrack-app.json`. |
| `name` | string | Required app identifier. Must be unique in a YouTrack installation and in JetBrains Marketplace. Uploading another app with the same `name` to the same YouTrack site overwrites the existing app version. |
| `title` | string | User-friendly app name shown in JetBrains Marketplace and the YouTrack UI. If omitted, YouTrack shows `name` instead. |
| `description` | string | App description shown on the Apps administration page and used as the JetBrains Marketplace description. |
| `version` | string | App package version in `major.minor.bugfix` format, for example `1.0.0`. Defaults to `0.0.0`. |
| `url` | string | Website for the app, such as a GitHub page, company page, or product landing page. Shown as the Plugin Site in JetBrains Marketplace. |
| `icon` | string | File name for the app icon. Store the file at the root level of the app package. |
| `iconDark` | string | File name for the dark-theme app icon. Store the file at the root level of the app package. If omitted, YouTrack uses `icon` for both light and dark themes. |
| `minYouTrackVersion` | string | Minimum YouTrack version that can run the app. If the target YouTrack installation is older than this value, upload or installation fails. JetBrains Marketplace uses this value to help users find apps compatible with their YouTrack Server installations. |
| `maxYouTrackVersion` | string | Maximum YouTrack version that can run the app. If the target YouTrack installation is newer than this value, upload or installation fails. |
| `changeNotes` | string | Description of changes in this app version. Displayed only in JetBrains Marketplace. Change notes can also be added or updated directly in Marketplace. |
| `vendor` | object | Vendor information. For apps uploaded directly to a YouTrack site, this metadata comes from the manifest. For Marketplace apps, Marketplace vendor profile data is used instead. |
| `aiToolPrefix` | string | Prefix for a custom MCP tool name. Needed only when the app package contains a script for a custom MCP tool. |
| `widgets` | array | Widget objects included in the app. Each widget represents a frontend extension embedded into the YouTrack UI as an iframe. |

## YouTrack version compatibility

When code uses APIs from `workflowJsStubs` or core modules, check the `@since` marker for every entity, method, and module API used. Set `minYouTrackVersion` to the lowest YouTrack version that includes all referenced APIs.

## `vendor`

| Field | Type | Description |
|---|---|---|
| `name` | string | Vendor name. |
| `url` | string | Vendor website URL. |
| `email` | string | Vendor contact email. |

## `widgets`

Each widget is a frontend extension rendered in a specific location in the YouTrack UI.

| Field | Type | Description |
|---|---|---|
| `key` | string | Required unique widget identifier within the app. |
| `name` | string | User-friendly widget name shown in app settings in YouTrack. Widget names must be unique within one app. |
| `description` | string | Widget description. Required for widgets embedded in the `HELPDESK_CHANNEL` extension point; optional for other extension points. |
| `guard` | string | JavaScript function that defines the condition for showing the widget. |
| `extensionPoint` | string | Required YouTrack UI location where the widget is embedded. |
| `indexPath` | string | Required path to the `index.html` file that defines the widget content and structure. |
| `iconPath` | string | Relative path to the widget icon inside the app package. Required for `HELPDESK_CHANNEL`; optional for `ARTICLE_OPTIONS_MENU_ITEM` and `ISSUE_OPTIONS_MENU_ITEM`. |
| `settingsSchemaPath` | string | Path to the JSON file that stores the settings schema for Markdown widgets. The file should be inside the folder that stores the code for the widget. |
| `permissions` | string[] | Permission identifiers required to view and use the widget. Depending on app scope, permissions can be checked globally or per project. |
| `expectedDimensions` | object | Expected widget dimensions in pixels. Supported attributes are integer `width` and `height`. Supported by all extension points except `MARKDOWN` and `DASHBOARD_WIDGET`; YouTrack rejects it for those two extension points. |
| `defaultDimensions` | object | Default widget dimensions. Supported only for `MARKDOWN` and `DASHBOARD_WIDGET`; YouTrack rejects it for other extension points. For `MARKDOWN`, use pixels or percentages, such as `"100px"` or `"40%"`. For `DASHBOARD_WIDGET`, use fractional dashboard grid units, such as `"8fr"`. |

## Marketplace upload validation

JetBrains Marketplace applies additional validation rules when an app package is uploaded. 

### Manifest rules

| Field | Marketplace upload rule |
|---|---|
| `name` | Required, must not be blank, must be at most 64 characters, and must match `^[a-z\d\-._]+$`. Only lowercase letters, digits, hyphens, periods, and underscores are allowed. |
| `title` | Required, must not be blank, and must be at most 64 characters. It may contain only letters, digits, spaces, and these characters: `. , + _ - / : ( ) # ' & [ ] |`. |
| `description` | Required and must not be blank. |
| `version` | Required and must not be blank. Marketplace upload validation checks only presence; it does not validate this app version . |
| `changeNotes` | Optional. If present, must be at most 65000 characters. |

### YouTrack version range rules

`minYouTrackVersion` and `maxYouTrackVersion` are optional.

| Rule | Meaning |
|---|---|
| `major <= 3000` | The major version component cannot be greater than `3000`. |
| `minor < 100` | The minor version component must be less than `100`. |
| `patch < 1000000` | The patch version component must be less than `1000000`. |
| `minYouTrackVersion <= maxYouTrackVersion` | The lower bound cannot be greater than the upper bound. |

If only one bound is supplied and parses successfully, these component-limit checks are skipped for that bound.

### Widget rules

| Field | Marketplace upload rule |
|---|---|
| `key` | Required only as a non-null value. Blank strings are not treated as missing. Non-null keys must match `^[a-z\d\-._]+$`, and keys must be unique across the widget list. If `key` is null, validation for that widget stops early and `indexPath` and `extensionPoint` are not checked. |
| `indexPath` | Required only as a non-null value. Blank strings pass validation. Marketplace upload validation does not check whether the path exists. |
| `extensionPoint` | Required only as a non-null value. Blank strings pass validation, and no enum validation is applied. |

## manifest.json Example

```json
{
  "$schema": "https://json.schemastore.org/youtrack-app.json",
  "name" : "sample-app",
  "title" : "Sample App",
  "description" : "App description",
  "version": "1.0.0",
  "url": "https://github.com/example/youtrack-app",
  "icon": "icon.svg",
  "iconDark": "icon.svg",
  "minYouTrackVersion": "2022.2.0",
  "maxYouTrackVersion": "2024.2.0",
  "changeNotes": "Version 0.0.1: Feature 1",
  "vendor": {
    "name": "JetBrains",
    "url": "jetbrains.com",
    "email": "support@jetbrains.com"
  },
  "widgets": [
    {
      "key": "fields-first",
      "name": "Sample Widget",
      "description": "Optional description for the issue view widget",
      "guard": "({entity}) => entity.fields.State?.value === 'Open'",
      "extensionPoint": "ISSUE_FIELD_PANEL_FIRST",
      "indexPath": "index.html",
      "iconPath": "icon.png",
      "settingsSchemaPath": "sample-widget-settings.json",
      "permissions": ["READ_USER"],
      "defaultDimensions": {
        "height": "40px",
        "width": "80%"
      },
      "expectedDimensions": {
        "height": "200",
        "width": "1000"
      }
    }
  ]
}
```
