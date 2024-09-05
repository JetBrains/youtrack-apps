# youtrack-apps-tools

[![Build Status][ci-img]][ci-project] ![NPM Version](https://img.shields.io/npm/v/@jetbrains/youtrack-apps-tools)
[![official JetBrains project](https://jb.gg/badges/official-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)

The **@jetbrains/youtrack-apps-tools** package contains utilities that help you manage YouTrack apps when you work
in an external code editor. This lets you write and update apps for YouTrack in JavaScript in your preferred
development environment.

## Quick Start

To work with the scripting package, you need to install and run [Node.js](https://nodejs.org/en/). This also installs
the npm package manager that lets you work with the scripting package in your projects.
Next, install the **@jetbrains/youtrack-scripting** package in your development environment. The easiest way to get
started is to install the package globally with the following command:

`npm install -g @jetbrains/youtrack-apps-tools`

If you prefer to install packages as dependencies in your development environment, enter:

`npm install --save-dev @jetbrains/youtrack-apps-tools`

## Utility Scripts

The package includes scripts that let you synchronize local changes with your YouTrack installation. The following
commands are available:

### Using environment variables

`youtrack-app` also reads the following environment variables:

- `YOUTRACK_HOST` - Your YouTrack instance URL.
- `YOUTRACK_API_TOKEN` - Your permanent token for accessing the YouTrack API.

If provided `--host` and `--token` can be omitted. Whether both environment variables and command line arguments are provided, the command line arguments take precedence.

### List

`youtrack-app list --host --token`

This command lists all the apps that are available in your YouTrack installation. To use this command, specify the
following parameters:

| Parameter | Description                                                                                                                                                                               |
| --------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| host      | The base URL of your YouTrack installation. For an InCloud instance, include the trailing `/youtrack`.                                                                                    |
| token     | A permanent token that grants access to the YouTrack service. You can generate your own permanent tokens to authenticate with YouTrack on the **Authentication** tab of your Hub profile. |

### Download

`youtrack-app download <appName> --host --token [--output, --overwrite]`

This command downloads the referenced app from your YouTrack installation.

If you don't specify a directory with the `output` parameter, a directory with the name `<appName>` is created in
the current working directory and the app files are extracted into the new directory. Otherwise, the app is
downloaded into the directory that is specified in the `output` parameter.

Here, you also need to specify values for the `--host` and `--token` parameters to gain authorized access to YouTrack.

One can also specify the `--overwrite` parameter to overwrite the existing directory with the same name.

### Upload

`youtrack-app upload <dir> --host --token`

This command uploads the app from the specified directory to your YouTrack installation. First, the script checks
the reference directory for a `manifest.json` or `package.json` file that contains the name of the app. If the file is not present or
does not specify the app name, the name of the directory is used as the name of the uploaded app.

Specify values for the `--host` and `--token` parameters to gain authorized access to YouTrack.

### Verify

`youtrack-app verify <dir> [--schema, --manifest]`

This command verifies the app's `manifest.json` from the specified directory against the [YouTrack App JSON schema][json-schema]. One can also specify the `--schema` parameter to provide a custom schema file and the `--manifest` parameter to specify a custom manifest file. When both `dir` and manifest are provided, the manifest file is used.

### Special Instructions for SSL Certificates

If your YouTrack domain uses an SSL certificate that is issued by a known certificate authority, you can establish a
connection using just your personal permanent token. Your certificate is already included in CA certificate store that
is built into Node.js. For certificates that are issued by a CA that is not recognized automatically or is self-signed,
you need to modify the environment variables in Node.js to recognize or ignore your certificate.

For more
information, [refer to the YouTrack documentation](https://www.jetbrains.com/help/youtrack/incloud/js-workflow-external-editor.html#special-instructions-ssl-certificates)
.

[ci-project]: https://teamcity.jetbrains.com/project/JetBrainsUi_YouTrackApps_AppsTools
[ci-img]: https://teamcity.jetbrains.com/app/rest/builds/buildType:JetBrainsUi_YouTrackApps_AppsTools_Checks/statusIcon.svg
[json-schema]: https://json.schemastore.org/youtrack-app.json
