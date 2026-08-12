# youtrack-apps-tools

[![Build Status][ci-img]][ci-project] ![NPM Version](https://img.shields.io/npm/v/@jetbrains/youtrack-apps-tools)
[![official JetBrains project](https://jb.gg/badges/official-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)

The **@jetbrains/youtrack-apps-tools** package provides CLI utilities for managing YouTrack apps from an external code editor.
It lets you write and update JavaScript apps in your preferred development environment,
and also ships the Vite plugins and runtime helpers used by apps created from the TypeScript Enhanced DX template.

## Quick Start

To use this package, install and run [Node.js](https://nodejs.org/en/).
Node.js includes npm, which you use to install this package.
Next, install the **@jetbrains/youtrack-apps-tools** package in your development environment.
The easiest way to get started is to install it globally with the following command:

`npm install -g @jetbrains/youtrack-apps-tools`

If you prefer to install it as a dependency in your development environment, run:

`npm install --save-dev @jetbrains/youtrack-apps-tools`

## Utility Scripts

The package includes scripts for synchronizing local changes with your YouTrack. The following commands are available:

- `youtrack-app app upload [--directory DIR] [--open]`
- `youtrack-app app download --app <app> [--output DIR] [--overwrite]`
- `youtrack-app app validate [--directory DIR] [--manifest FILE] [--schema FILE]`
- `youtrack-app --version`
- `youtrack-app app list [--skip N] [--limit N]`
- `youtrack-app app info --app <app>`
- `youtrack-app app scripts --app <app> --file-key <file-key>`
- `youtrack-app app usages --app <app> [--skip N] [--limit N]`
- `youtrack-app app settings --app <app> [--project <project-short-name>]`
- `youtrack-app app settings-set --app <app> [--project <project-short-name>] [--settings <json>] [--enabled <true|false>]`
- `youtrack-app tag search [--query <query>] [--project <project-short-name>] [--skip N] [--limit N]`
- `youtrack-app field values --project <project-short-name> --field <field> [--query <query>] [--skip N] [--limit N]`
- `youtrack-app app visibility --app <app> [--project <project-short-name>]`
- `youtrack-app app enable --app <app> [--project <project-short-name>]`
- `youtrack-app app disable --app <app> [--project <project-short-name>]`
- `youtrack-app app attach --app <app> --project <project-short-name>`
- `youtrack-app app detach --app <app> --project <project-short-name>`
- `youtrack-app app logs --app <app> [--limit N]`
- `youtrack-app app logs --app <app> --script <script> [--skip N] [--limit N]`
- `youtrack-app app requirement-errors --app <app>`
- `youtrack-app project list [--skip N] [--limit N]`
- `youtrack-app project info --project <project>`
- `youtrack-app project fields --project <project>`
- `youtrack-app project apps --project <project> [--skip N] [--limit N]`
- `youtrack-app group list [--query <query>] [--skip N] [--limit N]`
- `youtrack-app group members [--group <group>] [--skip N] [--limit N]`
- `youtrack-app user list [--query <query>] [--skip N] [--limit N]`
- `youtrack-app user info --user <user>`
- `youtrack-app app delete --app <app> [--yes]`
- `youtrack-app rest request --path <path> [--method METHOD] [--body JSON] [--header name:value]`

### Using Environment Variables

`youtrack-app` also reads the following environment variables:

- `YOUTRACK_HOST` - Your YouTrack instance URL.
- `YOUTRACK_API_TOKEN` - Your permanent token for accessing the YouTrack API.

Configure these variables once, or pass `--host` and `--token` to each command. If you provide both environment variables and command-line arguments, the command-line arguments take precedence.

### Language Support

The CLI is English-only. It does not provide an internationalization API or translation catalogs for apps.

### Raw REST API

`youtrack-app rest request --path <path> [--method METHOD] [--body JSON] [--header name:value] --host --token`

This command makes an authenticated request to a relative path on the configured YouTrack host. The method defaults to `GET`; `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, and `OPTIONS` are supported. Include query parameters in the path, for example:

`youtrack-app rest request --path '/api/issues?query=for:me'`

Use `--body` for a JSON request body and repeat `--header name:value` to add request headers. Successful JSON responses are printed as formatted JSON, or as YAML with `--yaml`. Non-JSON responses are printed as text. HTTP errors are reported with their status and response description.

### Pagination

List-style commands fetch the first 50 results by default. This applies to `app list`, `app usages`, `project apps`, `field values`, `tag search`, `app logs` with `--script`, `project list`, `group list`, `group members` without `--group`, and `user list`.


Use these flags to page through list results:

| Option | Description |
| ------ | :---------- |
| `--skip N` | Start at result offset `N`. |
| `--limit N` | Request up to `N` results. |

For example, `youtrack-app app list --skip 100 --limit 50` requests up to 50 results starting at offset 100.


When text output is truncated, the CLI prints a hint such as `Showing 50 apps. Use --skip 50 --limit 50 for more.`
For JSON and YAML output, list-style commands return an object with `items` and `pagination` metadata:

```json
{
  "items": [],
  "pagination": {
    "skip": 0,
    "limit": 50,
    "returned": 50,
    "nextSkip": 50,
    "hasMore": true
  }
}
```

Skip and limit pagination is intended for browsing. For synchronization against changing datasets, resource-specific cursor, timestamp, or ID filters are more stable when available.

### List

`youtrack-app app list --host --token [--skip N] [--limit N]`

This command lists apps available in your YouTrack. To use it, specify the following parameters:

| Parameter | Description                                                                                                                                                                               |
| --------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| host      | The base URL of your YouTrack. For YouTrack Cloud, include the trailing `/youtrack`.                                                                                    |
| token     | A permanent token that grants access to YouTrack. You can create one in your YouTrack profile, on the **Account Security** tab. |

### Download

`youtrack-app app download --app <app> --host --token [--output DIR] [--overwrite]`

This command downloads the referenced app from your YouTrack.

If you do not specify a directory with the `output` parameter, a directory named `<appName>` is created in the current working directory,
and the app files are extracted there. Otherwise, the app is downloaded into the directory specified by the `output` parameter.

You also need to provide `--host` and `--token` to authenticate with YouTrack.

Use `--overwrite` to replace an existing directory with the same name.

### Upload

`youtrack-app app upload [--directory DIR] --host --token [--open]`

This command uploads the app from `dist` by default, or from the directory specified with `--directory`.
First, it checks the target directory for a `manifest.json` or `package.json` file that contains the app name.
If neither file is present, or if neither specifies the app name, the directory name is used.

Provide `--host` and `--token` to authenticate with YouTrack.

Use `--open` to open the app settings in the browser after the upload is complete.

### Validate

`youtrack-app app validate [--directory DIR] [--manifest FILE] [--schema FILE]`

This command validates the app's `manifest.json` from the specified directory, or the file specified with `--manifest`, against the [YouTrack App JSON schema][json-schema].
The directory defaults to `dist`.
You can also use `--schema` to provide a custom schema file.
When both `directory` and `--manifest` are provided, the manifest file is used.

### Info

`youtrack-app app info --app <app> --host --token`

This command shows bounded app details, including enabled state, marketplace metadata, widgets, pluggable object summaries, and file keys for content that can be fetched separately.
The app is resolved by app ID or package name.

### Scripts

`youtrack-app app scripts --app <app> --file-key <file-key> --host --token`

This command shows exactly one manifest, settings, entity extension, or script file from an installed app.
The app is resolved by app ID or package name. The `file-key` argument is required and is listed by `youtrack-app app info --app <app>`.
Use `manifest`, `settings`, or `entityExtensions` for app files. For scripts, pass the script ID exactly as shown in the module list, for example `150-238`.
This command intentionally uses plain text output; structured-output flags are not accepted for file-content retrieval.

### Usages

`youtrack-app app usages --app <app> --host --token [--skip N] [--limit N]`

This command lists project usage records for an installed app, including the usage ID, project, enabled state, active state, broken state, missing-settings state, and nested requirement problems reported by pluggable object usages.
The app is resolved by app ID or package name.

### Settings

`youtrack-app app settings --app <app> --host --token [--project <project-short-name>]`

This command reads app settings. The app argument is resolved by app ID or package name.
Without `--project`, it reads the global app configuration.
With `--project`, it reads the app configuration for the project identified by short name.

`youtrack-app app settings-set --app <app> --host --token [--project <project-short-name>] [--settings <json>] [--enabled <true|false>]`

This command updates app settings. The app argument is resolved by app ID or package name.
Without `--project`, `--settings` is written as `globalSettings`.
With `--project`, `--settings` is written as `projectSettings`.
The settings value must be a JSON string, for example `--settings '{"apiUrl":"https://api.example.test"}'`.
Pass secret masks such as `<***>` back unchanged to keep existing masked secret values.

### Tag Search

`youtrack-app tag search [--query <query>] --host --token [--project <project-short-name>] [--skip N] [--limit N]`

This command searches visible usable tags by query. With `--project`, it returns project-relevant tag suggestions for the project identified by short name.

### Field Values

`youtrack-app field values --project <project-short-name> --field <field> [--query <query>] --host --token [--skip N] [--limit N]`

This command searches and paginates actual custom-field values for a project. Use it instead of `project fields` when a field has more values than the schema lists. The project is resolved by exact ID or short name, and `--field` accepts a project custom field ID, field ID, field name, or localized field name.

### Visibility

`youtrack-app app visibility --app <app> --host --token [--project <project-short-name>]`

This command shows read-only app visibility settings. Without `--project`, it reads global app visibility. With `--project`, it reads project-scoped app visibility.

### Enable and Disable

`youtrack-app app enable --app <app> --host --token [--project <project-short-name>]`

`youtrack-app app disable --app <app> --host --token [--project <project-short-name>]`

These commands enable or disable an installed app. Without `--project`, they update the global app configuration.
With `--project`, they update the app configuration for the project identified by short name.
The app is resolved by app ID or package name.

### Attach and Detach

`youtrack-app app attach --app <app> --project <project-short-name> --host --token`

`youtrack-app app detach --app <app> --project <project-short-name> --host --token`

These commands attach an app to a project or detach it from a project. The project is resolved by short name before the app usages are updated.
The app is resolved by app ID or package name.

### Logs

`youtrack-app app logs --app <app> [--limit N] --host --token`

`youtrack-app app logs --app <app> --script <script> [--skip N] [--limit N] --host --token`

This command prints app log entries. Use `--limit` to limit the number of returned entries.
The app is resolved by app ID or package name.

When `script` is provided, this command prints paged log entries for that script, module, or rule. The script argument is a script, module, or rule name or ID. `--skip` is supported only with `--script`; `--limit` limits app or script logs.

### Requirement Errors

`youtrack-app app requirement-errors --app <app> --host --token`

This command prints only requirement errors reported for an app from broken pluggable object usages. Use `usages <app>` when you need the errors merged into the project usage view.
The app is resolved by app ID or package name.

### Projects

`youtrack-app project list --host --token [--skip N] [--limit N]`

This command lists projects in your YouTrack by short name and ID.

`youtrack-app project info --project <project> --host --token`

This command shows project details. The project is resolved by exact project ID or short name/key, ignoring case.

`youtrack-app project fields --project <project> --host --token`

This command returns the issue-fields JSON schema for a project, including field definitions and required fields. Allowed-value lists may be capped; use `field values` to find actual custom-field values. The project is resolved by exact project ID or short name/key, ignoring case.

`youtrack-app project apps --project <project> --host --token [--skip N] [--limit N]`

This command lists apps attached to a project, including the project app configuration ID and enabled/active/settings state.

### User Groups

`youtrack-app group list [--query <query>] --host --token [--skip N] [--limit N]`

This command lists user groups with their IDs. When `query` is provided, the list is filtered by group text. When omitted, all visible groups are listed.

`youtrack-app group members [--group <group>] --host --token [--skip N] [--limit N]`

This command prints the IDs of users that are direct members of a user group. When `group` is provided, it is resolved first as a direct group ID, then by exact group ID or name, ignoring case. When omitted, the command lists direct members for each group in the current page; `--skip` and `--limit` apply only in this mode.

### Users

`youtrack-app user list [--query <query>] --host --token [--skip N] [--limit N]`

This command lists users with login, ID, and display name. When `query` is provided, the list is filtered by user text. When omitted, all visible users are listed.

`youtrack-app user info --user <user> --host --token`

This command shows user details. The user is resolved first as a direct user ID, then by exact user ID, login, name, or full name, ignoring case.

Text output is used by default. Commands that return structured data support `--json` and `--yaml` (`--yml` is an alias). Upload, download, validation, script, settings-update, and app scope-changing commands intentionally reject these flags.

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | Other failure |
| `2` | Usage or validation failure |
| `3` | Authentication or authorization failure |
| `4` | Requested resource was not found |

### Delete

`youtrack-app app delete --app <app> --host --token [--yes]`

Danger: this command permanently deletes the installed app and everything app-related from YouTrack.
The app is resolved by app ID or package name. Titles are not accepted.
In non-interactive use, pass `--yes` to confirm deletion.

## Enhanced DX Support

This package also contains the utilities used by apps generated from the **TypeScript (Enhanced DX with file-based routing)** template in `@jetbrains/create-youtrack-app`.

For apps generated from this template, these tools are configured for you. In most cases, you should not need to import or configure the Enhanced DX plugins manually.

Advanced or custom Vite setups can import the Enhanced DX plugins from `@jetbrains/youtrack-apps-tools/dx`:

```ts
import {
  youtrackApiGenerator,
  youtrackRouter,
  youtrackAppSettings,
  youtrackExtensionProperties,
  youtrackWidgetEntries,
  youtrackBackendBundles,
  youtrackAutoUpload,
  youtrackDevHtml,
  backendReloadPlugin
} from '@jetbrains/youtrack-apps-tools/dx';
```

The Enhanced DX utilities include file-based HTTP routing, generated API types, generated app settings and extension-property types,
widget entry discovery, local development HTML rewriting, backend reload support, and automatic upload coordination.

Backend handler runtime helpers, such as `withPermissions` and `set`, are available from `@jetbrains/youtrack-apps-tools/dx/runtime`.

Workflow API types live in the companion package [`@jetbrains/youtrack-workflow-types`](../youtrack-workflow-types).

## Special Instructions for SSL Certificates

If your YouTrack domain uses an SSL certificate issued by a known certificate authority, you can connect using only your personal permanent token.
The certificate is already included in the CA certificate store built into Node.js.
For certificates issued by an unrecognized CA or for self-signed certificates, you need to adjust the Node.js environment variables so the certificate is recognized or ignored.

For more information, see the [YouTrack documentation](https://www.jetbrains.com/help/youtrack/devportal/js-workflow-external-editor.html#special-instructions-ssl-certificates).

[ci-project]: https://teamcity.jetbrains.com/project/JetBrainsUi_YouTrackApps_AppsTools
[ci-img]: https://teamcity.jetbrains.com/app/rest/builds/buildType:JetBrainsUi_YouTrackApps_AppsTools_Checks/statusIcon.svg
[json-schema]: https://json.schemastore.org/youtrack-app.json
