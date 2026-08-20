# Set up the YouTrack Apps CLIs

Use Node.js `>= 20.18.0`. Check it before installation:

```bash
node --version
npm --version
```

Run the generator with `npx`; it is downloaded to npm's cache when needed and is not added to the current project's dependencies. For example, install the agent skill with:

```bash
npx @jetbrains/create-youtrack-app@latest skill install
```

The skill installer remains interactive and lets you choose the agent and installation scope.

Install the separate app management CLI globally only when you need its `youtrack-app` commands:

```bash
npm install --global @jetbrains/youtrack-apps-tools@^1.0.2
```

Verify both CLIs:

```bash
npx @jetbrains/create-youtrack-app@latest --help
youtrack-app --help
```

Commands that contact YouTrack need an instance URL and a permanent token with app-upload permissions. Obtain the token in **YouTrack → Profile → Account Security → New token**, then set it without displaying or committing its value:

```bash
export YOUTRACK_HOST=https://youtrack.example.com
export YOUTRACK_API_TOKEN=<your-permanent-token>
```

`youtrack-app` also accepts `--host` and `--token` for a one-off command. Generated Enhanced DX projects commonly store `YOUTRACK_HOST` and `YOUTRACK_TOKEN` in a local, uncommitted `.env` file; their upload script passes those values to the CLI explicitly.
