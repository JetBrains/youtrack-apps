# Set up the YouTrack Apps CLIs

Use Node.js `>= 20.18.0`. Check it before installation:

```bash
node --version
npm --version
```

Install the published CLIs globally so the agent can call them from any app directory:

```bash
npm install --global @jetbrains/create-youtrack-app@^1.0.2
npm install --global @jetbrains/youtrack-apps-tools@^1.0.2
```

Verify both commands are available:

```bash
create-youtrack-app --help
youtrack-app --help
```

Commands that contact YouTrack need an instance URL and a permanent token with app-upload permissions. Obtain the token in **YouTrack → Profile → Account Security → New token**, then set it without displaying or committing its value:

```bash
export YOUTRACK_HOST=https://youtrack.example.com
export YOUTRACK_API_TOKEN=<your-permanent-token>
```

`youtrack-app` also accepts `--host` and `--token` for a one-off command. Generated Enhanced DX projects commonly store `YOUTRACK_HOST` and `YOUTRACK_TOKEN` in a local, uncommitted `.env` file; their upload script passes those values to the CLI explicitly.
