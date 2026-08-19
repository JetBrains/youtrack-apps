# YouTrack Apps Agent Skill

This skill helps an AI coding agent build, validate, deploy, and manage [YouTrack Apps](https://www.jetbrains.com/help/youtrack/devportal/apps-documentation.html). It supports the modern TypeScript [Enhanced DX](../docs/enhanced-dx-onboarding.md) workflow and includes [YouTrack JavaScript API](https://www.jetbrains.com/help/youtrack/devportal/Workflows-in-JavaScript.html) reference and app-development guidance.

## Install the Skill

Choose GitHub CLI for the latest released skill and broad agent support. Use Skills CLI when you need the current default-branch version. Use the YouTrack Apps CLIs only when they are already installed; this route supports fewer agents.

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

### Alternative: install the YouTrack CLIs first

This route has more manual setup and supports only Codex CLI, Claude Code, and Junie:

```bash
npm install --global @jetbrains/create-youtrack-app@^1.0.2 @jetbrains/youtrack-apps-tools@^1.0.2

create-youtrack-app skill install
```

Follow the CLI prompts to choose the target agent and installation scope.

## Update the Skill

- GitHub CLI: `gh skill update youtrack-apps-skill`
- Skills CLI: `npx skills update youtrack-apps-skill`
- YouTrack Apps CLI: rerun `create-youtrack-app skill install`

## First YouTrack App Task

Start a new agent session in the app directory and describe the task. In agents with slash commands, run `/youtrack-apps-skill` to start initialization explicitly. The skill checks that the required tools and connection are available, then explains how to set up anything missing.

You need Node.js 20.18.0 or later, `create-youtrack-app`, `youtrack-app`, a YouTrack instance, and a permanent token with app-upload permission. For direct `youtrack-app` commands:

```bash
export YOUTRACK_HOST=https://your-instance.youtrack.cloud
export YOUTRACK_API_TOKEN=<your-permanent-token>
```

Create the permanent token in **YouTrack → Profile → Account Security → New token**. Never commit it in Git.

## What It Helps With

- Scaffold JavaScript or TypeScript apps, workflow rules, endpoints, settings, and widgets.
- Use the YouTrack JavaScript API correctly.
- Build, validate, upload, download, configure, attach, and enable apps.
- Diagnose requirements, configuration, and app logs.
- Add app HTTP endpoints and MCP tools, or migrate legacy workflows.
