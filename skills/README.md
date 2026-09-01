# YouTrack Apps Agent Skill

This skill helps AI coding agents build, validate, upload, and manage [YouTrack apps](https://www.jetbrains.com/help/youtrack/devportal/apps-documentation.html). It supports the experimental TypeScript [Enhanced DX](../docs/enhanced-dx-onboarding.md) toolchain and provides [YouTrack JavaScript API](https://www.jetbrains.com/help/youtrack/devportal/Workflows-in-JavaScript.html) reference material and app development guidance.

## Install the Skill

Choose GitHub CLI for broad agent support and the latest released version of the skill. Use Skills CLI when you need the current version from the default branch. The `create-youtrack-app` CLI supports Codex CLI, Claude Code, and Junie.

### Recommended: GitHub CLI

```bash
gh skill install JetBrains/youtrack-apps skills/youtrack-apps-skill
```

Follow the CLI prompts to choose the target agent and installation scope. GitHub CLI installs the latest tagged skill release.

### Alternative: Skills CLI

```bash
npx skills add JetBrains/youtrack-apps --skill youtrack-apps-skill
```

Follow the CLI prompts to choose the target agent and installation scope. Skills CLI installs from the repository's default branch.

### Alternative: `create-youtrack-app` CLI

```bash
npx @jetbrains/create-youtrack-app@latest skill install
```

Follow the CLI prompts to choose the target agent and installation scope.

## Update the Skill

- GitHub CLI: `gh skill update youtrack-apps-skill`
- Skills CLI: `npx skills update youtrack-apps-skill`
- `create-youtrack-app` CLI: rerun `npx @jetbrains/create-youtrack-app@latest skill install`

## First YouTrack App Task

Start a new agent session in the app package directory, then describe the task. If the agent supports slash commands, run `/youtrack-apps-skill` to start initialization explicitly. The skill checks whether the required tools and connection to a YouTrack instance are available, then explains how to set up anything that is missing.

You need Node.js 20.18.0 or later. To use `youtrack-app` directly, install it and configure its connection to YouTrack using a permanent token for an account that has Update Project permission:

```bash
export YOUTRACK_HOST=https://your-instance.youtrack.cloud
export YOUTRACK_TOKEN=<your-permanent-token>
```

Create a permanent token in YouTrack under **Profile → Account Security → Tokens → New token**. Never commit the token to Git.

## What It Helps With

- Scaffold JavaScript or TypeScript apps, workflow rules, HTTP handlers, app settings, and widgets.
- Use the YouTrack JavaScript API correctly.
- Build, validate, upload, download, configure, attach, and activate apps.
- Troubleshoot requirement errors and configuration issues.
- Inspect app logs.
- Add custom HTTP handlers and MCP tools, or migrate legacy workflows.

## Contributing

To update the workflow API reference, see the [generator README](./youtrack-apps-skill-generator/README.md).
