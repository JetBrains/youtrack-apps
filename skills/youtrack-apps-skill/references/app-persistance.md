# App Persistence

Contains app settings and extension properties.

## Types

- [App Settings](#app-settings)
- [Extension Properties](#extension-properties)

## App Settings

`settings.json` declares configurable app values. It is the contract between the app developer and the YouTrack administrator: the app exposes settings, the administrator provides values globally or per project, and scripts read the resolved values through `ctx.settings`.

### Structure

`settings.json` is placed at the app package root. YouTrack validates the file as JSON Schema and adds YouTrack-specific extensions.
Root fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | string | yes | The value of this field must always be `object`. |
| `title` | string | no | Title shown on the app Settings tab. You can use this title to give app users more information about the settings that this app allows to configure.|
| `description` | string | no | Help text shown under the title. You can use this description to give app users more details and context about the settings that this app allows to configure. |
| [`properties`](#properties) | object | yes | An object that contains definitions of app settings. |
| `required` | string[] | no | An array of setting names that must be configured before the app can become active in the relevant context. See [Required Settings](#required-settings). |

#### Properties

Each app setting is declared as a field of the `properties` object. The key is the setting name, and the value is an object that defines the setting. YouTrack apps support property parameters from JSON Schema Draft 07 plus YouTrack-specific extensions.

**Main setting parameters**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | yes | Setting name shown in the YouTrack UI. |
| `description` | string | no | Description shown in the UI under the setting. |
| `type` | string | yes | Setting value type. Allowed values: `string`, `integer`, `number`, `boolean`, `array`, `object`. `array` and `object` represent YouTrack core entities. |
| `format` | string | no | Expected value format. Use [`secret`](#secrets) for hidden credentials; `date` displays a calendar picker. |
| `x-entity` | string | no | YouTrack-specific parameter for `array` and `object` settings that refers to a core YouTrack entity. Supported entities: `Issue`, `Article`, `Project`, `User`, `UserGroup`. |
| [`x-scope`](#choosing-scope)| string | no | YouTrack-specific parameter that restricts configuration level. Use `GLOBAL` for global-only settings, `PROJECT` for project-only settings, or omit it when the setting should be configurable at both levels. |
| `default` | any | no | Default value used when the setting has not been configured. |

#### *Additional parameters*:

| Parameter | Type | Description |
| --- | --- | --- |
| `enum` | Array.<any> | Closed list of values the user can choose from. |
| `exclusiveMaximum` | number | Exclusive upper limit for `integer` and `number` settings. |
| `exclusiveMinimum` | number | Exclusive lower limit for `integer` and `number` settings. |
| `items` | object | Required for `array` settings. Contains a reference to a core YouTrack entity. |
| `maximum` | number | Inclusive upper limit for `integer` and `number` settings. |
| `maxLength` | integer | Maximum length for `string` settings. |
| `minimum` | number | Inclusive lower limit for `integer` and `number` settings. |
| `minItems` | integer | Minimum item count for `array` settings. Combine with root `required` to require a non-empty array. |
| `minLength` | integer | Minimum length for `string` settings. |
| `multipleOf` | number | Value is valid only when division by this number results in an integer. Must be greater than `0`; applies to `integer` and `number` settings. |

### Choosing Scope

Before generating settings, decide the scope for each setting. Do not add `x-scope` to every setting by
default.

Use `GLOBAL` when the value is read by global-level modules, such as global-scope HTTP handlers, MCP tools, or shared app
services. These modules do not have access to project settings. Use global settings when one system administrator should
configure the integration once for the whole YouTrack installation.

Use `PROJECT` when the value is read only by project-level modules, such as workflow rules attached to a project, and each
project is allowed to have its own configuration.

Omit `x-scope` only when both of these are true:
- a global default is useful, and
- project administrators are allowed to override that exact setting for their own project.

If `x-scope` is omitted, a system administrator can set a global value, and a project administrator can set a
project-specific value. In a project execution context, the project value overrides the global value when both are
configured.

Then check ownership. If a YouTrack administrator should configure the value once for the whole installation, it is global. If each project administrator should decide the value for their own project, it is project-scoped.

Scope affects where the setting can be configured and how `ctx.settings` is resolved at runtime.


### Settings Context

`ctx.settings` is resolved from the script execution context.

Apps can have global modules and project-level modules. Global modules, such as HTTP handler endpoints with `global` or `user` scope and MCP tools, cannot be attached to a project. They always execute in the app's global context, so `ctx.settings` contains global setting values. Global settings are configured by a system administrator.

Project-level modules, such as workflow rules, require the app to be attached to a project. They execute in that project's context, so `ctx.settings` contains project-level setting values for that project. Project settings are configured by a project administrator, and can also be configured by a system administrator on that project.

Project context inherits from global context. If a setting has a project-specific value, `ctx.settings.<settingName>` returns that value. If the project does not override the setting, `ctx.settings.<settingName>` falls back to the global value.

### Required Settings

The root `required` array lists settings that must have values before the app can become active in a context.
Required settings are checked at the level where the app is activated:
- Required global settings block global app activation until a system administrator sets them.
- Required project settings block activation on a specific project until a project administrator, or a system administrator on that project, sets them.
- Empty required fields on the project level leave that project's app configuration incomplete.

A setting `default` does not satisfy `required`. If a setting is listed in `required`, it must be explicitly configured in the relevant context before that context can become active.

Mark a setting as required when the app cannot perform its primary behavior without it. For external integrations, the
credential is usually required, for example `apiToken`.

Do not mark optional behavior, filters, labels, toggles, default assignees, or tuning knobs as required unless missing
values would make activation misleading or broken. Prefer code defaults for optional values.

For GitHub-like integrations:
- Required in most apps: API token or app credential; repository or organization when the app cannot infer it safely.

### Lifecycle

Setting values are tied to the app declaration and are not versioned.

- Deleting the app deletes all setting values owned by that app.
- If `settings.json` no longer declares a setting, existing values for that setting are deleted.
- If an app update keeps the same setting name but changes its type, old values for that setting are lost.

### Secrets

Declare secrets as strings with `format: "secret"`:
```json
{
  "title": "API Key",
  "type": "string",
  "format": "secret"
}
```
Once a secret has been stored, no one else can read it anywhere in YouTrack. The real value is used only in the [http](./api/http.md) package when it is needed to authenticate an HTTP request, namely:
- Bearer token authentication flows.
```javascript
connection.bearerAuth(ctx.settings.secretSetting);
```
- Basic token authentication.
- `addHeader` and `setHeader` methods.
```javascript
connection.addHeader('My-Token-Header', ctx.settings.secretToken);
```
- Query parameters in methods
```javascript
connection.getSync(url, { apiKey: ctx.settings.apiKey });
```

### Security

Do not make `baseUrl` a configurable setting when requests to that URL use a token or other secret. If one administrator
sets a token and another administrator can change `baseUrl`, they can point the app to a malicious server and steal the
token when the app sends the next authenticated request.

Prefer a hardcoded trusted service URL. If the URL truly must vary, expose only fixed trusted choices and keep the URL and
its secret under the same `x-scope`.

### Usage

Use `ctx.settings.<settingName>` in workflow rules, HTTP handlers, MCP tools, and other app scripts.
```javascript
const http = require('@jetbrains/youtrack-scripting-api/http');

exports.httpHandler = {
  endpoints: [
    {
      method: 'POST',
      path: '/test',
      handle: (ctx) => {
        const connection = new http.Connection('https://example.com/api');
        connection.bearerAuth(ctx.settings.secretSetting);
        connection.addHeader('Content-Type', 'application/json');
        return connection.postSync('/test', {}, { enabled: ctx.settings.booleanSetting });
      }
    }
  ]
};
```
### DOs and DON'Ts

DO:
- Mark required settings in the root `required` array when missing values should block activation in that context.
- Mark token settings required when the app's primary integration cannot work without them.
- Pick `x-scope` from where the setting is read and who may safely control it, not just from the data type.
DON'T:
- Add `x-scope` to every setting automatically. Omit it only when project-level overrides are intentional and safe.
- Expect project overrides in global-level modules. They never run with a project context.
- Use lowercase scope values in generated schemas; the documented values are `GLOBAL` and `PROJECT`.
- Try to log `secret` settings, those are only accessible in http methods and can't be seen in logs.

### Example

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "App Settings",
  "description": "Here you can provide values for the app settings",
  "required": ["secretSetting"],
  "properties": {
    "stringSetting": {
      "title": "Name",
      "type": "string",
      "minLength": 1
    },
    "booleanSetting": {
      "title": "Enabled",
      "type": "boolean"
    },
    "integerSetting": {
      "title": "Global Limit",
      "type": "integer",
      "x-scope": "GLOBAL"
    },
    "numberSetting": {
      "title": "Project Threshold",
      "type": "number",
      "x-scope": "PROJECT"
    },
    "secretSetting": {
      "title": "API Key",
      "type": "string",
      "format": "secret"
    },
    "arraySetting": {
      "title": "Users",
      "type": "array",
      "items": {
        "x-entity": "User",
        "type": "object"
      }
    },
    "userSetting": {
      "title": "Default User",
      "type": "object",
      "x-entity": "User"
    }
  }
}
```

## Extension Properties

`entity-extensions.json` declares app-owned persistent properties on YouTrack entities. Use extension properties for mutable app state.
Scripts access declared values through `entity.extensionProperties` or by using the `findByExtensionProperties()` method on the target type.
```javascript
ctx.issue.extensionProperties.stringProp = 'value';
const current = ctx.issue.extensionProperties.stringProp;
ctx.globalStorage.extensionProperties.cacheKey = 'value';
```
An app can access only the extension properties it declares.

### Structure

Place `entity-extensions.json` at the app package root.
```json
{
  "entityTypeExtensions": [
    {
      "entityType": "Issue",
      "properties": {
        "stringProp": {
          "type": "string"
        },
        "issueProp": {
          "type": "Issue"
        },
        "issuesProp": {
          "type": "Issue",
          "multi": true
        }
      }
    }
  ]
}
```

Declaration fields:

| Field | Type | Notes |
| --- | --- | --- |
| `entityTypeExtensions` | object[] | List of entity types extended by this app. |
| `entityType` | string | Workflow/API entity type to extend. |
| `properties` | object | Map of extension-property names to declarations. |

Property fields:

| Field | Type | Notes |
| --- | --- | --- |
| `type` | string | Required. Use `string`, `integer`, `float`, `boolean`, or a YouTrack entity type supported by the Workflow API. |
| `multi` | boolean | Optional. Only for YouTrack entity references. Defaults to `false`; omit it for single-value properties. When `true`, the property returns a YouTrack `Set`. |

### Supported Targets

The exact set of entity types is [entities](./api/entities.md). Target entity must have the `findByExtensionProperties` method.

Some commong targets are:
- [`Issue`](./api/entities.md#issue)
- [`Project`](./api/entities.md#project)
- [`User`](./api/entities.md#user)
- [`UserGroup`](./api/entities.md#usergroup)

### Lifecycle

Extension property values are tied to the app declaration and are not versioned.

- Deleting the app deletes all extension property values owned by that app.
- If `entity-extensions.json` no longer declares a property, existing values for that property are deleted.
- If an app update keeps the same property name but changes its type, old values for that property are lost.

### App Global Storage

Use `AppGlobalStorage` for per-app global data that is not tied to a regular YouTrack entity.

```json
{
  "entityTypeExtensions": [
    {
      "entityType": "AppGlobalStorage",
      "properties": {
        "globalCounter": {
          "type": "integer"
        },
        "globalIssuesSet": {
          "type": "Issue",
          "multi": true
        }
      }
    }
  ]
}
```

Scripts access it through `ctx.globalStorage`:

```javascript
ctx.globalStorage.extensionProperties.globalCounter =
  (ctx.globalStorage.extensionProperties.globalCounter || 0) + 1;
ctx.globalStorage.extensionProperties.globalIssuesSet.add(ctx.issue);
```

### Usage

Regular entity access:

```javascript
ctx.issue.extensionProperties.stringProp = 'value';
const value = ctx.issue.extensionProperties.stringProp;
```

> **Quirk:** You can store JSON objects in extension properties, but only by stringifying them into a `string` property first. This is a common pattern in apps.

```javascript
ctx.issue.extensionProperties.stringProp = JSON.stringify({
  status: 'synced',
  externalId: 'CRM-42'
});

const stored = JSON.parse(ctx.issue.extensionProperties.stringProp || '{}');
```

Entity lookup access:
```javascript
const entities = require('@jetbrains/youtrack-scripting-api/entities');

const issue = entities.Issue.findById('DEMO-1');
const value = issue.extensionProperties.stringProp;
```
Search issues by extension properties with `search.search`:
```javascript
const search = require('@jetbrains/youtrack-scripting-api/search');

const found = search.search(ctx.issue.project, {
  query: 'State: Open',
  extensionPropertiesQuery: {
    stringProp: 'value'
  }
}, ctx.currentUser);
```

### DOs and DON'Ts

DO:
- Use extension properties for app-owned mutable state on entities.
- Use `AppGlobalStorage` for app-owned state that is global to the app.
- Use YouTrack entity references when the value should stay connected to an exact entity.

DON'T:
- Store administrator configuration in extension properties; use [App Settings](#app-settings).
- Store secrets in extension properties; there is no `secret` extension-property type.
- Expect an app to read extension properties declared by another app.
