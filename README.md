# YouTrack Apps

[![official JetBrains project](https://jb.gg/badges/official-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)

This monorepo contains the tools, agent guidance, and example apps used to build and manage YouTrack apps.

- **[YouTrack Apps skill](skills/README.md)** — guides coding agents through creating, changing, and managing YouTrack apps, and directs them to the two CLIs below.
- **[`create-youtrack-app` CLI](packages/create-youtrack-app/README.md)** — start here to scaffold a JavaScript or TypeScript app, then add widgets, handlers, settings, extension properties, and workflow rules. TypeScript apps use the Enhanced DX workflow and include the `youtrack-app` tools.
- **[`youtrack-app` CLI](packages/apps-tools/README.md)** — manage an app in a YouTrack instance: upload, download, validate, configure, inspect, and troubleshoot it. It also provides safe exploration commands for YouTrack data and a raw REST request command.
- **[Open-source apps](packages/)** — A collection of JetBrains-developed apps showcasing manifests, widgets, workflows, and tooling for building and uploading them.

## Contributing

This monorepo uses [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces).

1. Run `nvm use` to select the required Node.js version.
2. Run `npm install` to install workspace dependencies.
3. Develop and test the relevant package.
