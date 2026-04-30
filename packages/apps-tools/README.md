# youtrack-apps-tools

[![Build Status][ci-img]][ci-project] ![NPM Version](https://img.shields.io/npm/v/@jetbrains/youtrack-apps-tools)
[![official JetBrains project](https://jb.gg/badges/official-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)

The **@jetbrains/youtrack-apps-tools** package provides utilities for managing YouTrack apps from an external code editor.
It lets you write and update YouTrack apps in JavaScript using your preferred development environment.

## Quick Start

To use the scripting package, install and run [Node.js](https://nodejs.org/en/). 
This also installs npm package manager, which you need to use the package in your projects.
Next, install the **@jetbrains/youtrack-apps-tools** package in your development environment. 
The easiest way to get started is to install it globally with the following command:

`npm install -g @jetbrains/youtrack-apps-tools`

If you prefer to install packages as dependencies in your development environment, run:

`npm install --save-dev @jetbrains/youtrack-apps-tools`

## Utility Scripts

The package includes scripts for synchronizing local changes with your YouTrack. The following commands are available:

### Using environment variables

`youtrack-app` also reads the following environment variables:

- `YOUTRACK_HOST` - Your YouTrack instance URL.
- `YOUTRACK_API_TOKEN` - Your permanent token for accessing the YouTrack API.

If these variables are set, you can omit `--host` and `--token`. If you provide both environment variables and command-line arguments, the command-line arguments take precedence.

### List

`youtrack-app list --host --token`

This command lists all apps available in your YouTrack. To use it, specify the following parameters:

| Parameter | Description                                                                                                                                                                               |
| --------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| host      | The base URL of your YouTrack. For a Cloud YouTrack instance, include the trailing `/youtrack`.                                                                                    |
| token     | A permanent token that grants access to YouTrack. You can create one your YouTrack profile, the **Account Security** tab. |

### Download

`youtrack-app download <appName> --host --token [--output, --overwrite]`

This command downloads the referenced app from your YouTrack installation.

If you do not specify a directory with the `output` parameter, a directory named `<appName>` is created in the current working directory, 
and the app files are extracted there. Otherwise, the app is downloaded into the directory specified by the `output` parameter.

You also need to provide `--host` and `--token` to authenticate with YouTrack.

Use `--overwrite` to replace an existing directory with the same name.

### Upload

`youtrack-app upload <dir> --host --token`

This command uploads the app from the specified directory to your YouTrack installation. 
First, it checks the target directory for a `manifest.json` or `package.json` file that contains the app name. 
If neither file is present, or if neither specifies the app name, the directory name is used.

Provide `--host` and `--token` to authenticate with YouTrack.

Use `--open` to open the app settings in the browser after the upload is complete.

### Validate

`youtrack-app validate <dir> [--schema, --manifest]`

This command validates the app's `manifest.json` from the specified directory against the [YouTrack App JSON schema][json-schema]. 
You can also use `--schema` to provide a custom schema file and `--manifest` to specify a custom manifest file. 
When both `dir` and `--manifest` are provided, the manifest file is used.

### Special Instructions for SSL Certificates

If your YouTrack domain uses an SSL certificate issued by a known certificate authority, you can connect using only your personal permanent token. 
The certificate is already included in the CA certificate store built into Node.js. 
For certificates issued by an unrecognized CA or for self-signed certificates, you need to adjust the Node.js environment variables so the certificate is recognized or ignored.

For more information, see the [YouTrack documentation](https://www.jetbrains.com/help/youtrack/devportal/js-workflow-external-editor.html#special-instructions-ssl-certificates).

[ci-project]: https://teamcity.jetbrains.com/project/JetBrainsUi_YouTrackApps_AppsTools
[ci-img]: https://teamcity.jetbrains.com/app/rest/builds/buildType:JetBrainsUi_YouTrackApps_AppsTools_Checks/statusIcon.svg
[json-schema]: https://json.schemastore.org/youtrack-app.json
