# Pocket Status

A YouTrack app that embeds customizable status badges directly into Markdown fields, letting teams track statuses visually without leaving issue descriptions or comments.

![Status tags in a Markdown table of an issue description](screenshots/preview.png)

## Features

- **Embeddable status badges** — insert color-coded status tags inline in any YouTrack Markdown field
- **Customizable status sets** — project sets shared by the team, plus personal sets of each user, each status with its own background and text color
- **Inline editing** — click any badge to switch its value directly from Markdown view
- **Issue tracking** — show the current State of any issue, read with the access rights of the viewer
- **Per-widget configuration** — each widget instance stores its own settings via the YouTrack settings API

## Architecture

```
src/
├── backend-project.js             # Project HTTP handler: read and store project sets
├── backend-user.js                # User HTTP handler: read and store personal sets
├── sets-validation.js             # Payload check shared by both handlers
├── settings.json                  # App settings: issue tracking on or off
├── entity-extensions.json         # Project and user properties that store the sets
└── widgets/
    ├── shared/                    # Types, tag, value form and API helpers used by both widgets
    ├── pocket-status/             # MARKDOWN widget: the inline status tag
    │   ├── app.tsx                # Root component with state routing
    │   ├── app-state.ts           # MobX store: init, config, fetch, restore
    │   ├── status.tsx             # Status tag view (default state)
    │   ├── config/                # Widget configuration dialog
    │   └── create/                # Status set creation form
    └── pocket-status-settings/    # PROJECT_TAB and USER_PROFILE_SETTINGS widget: manage sets
```

The inline widget routes between three states managed by MobX: `view`, `config` and `create`.

## Prerequisites

- Node.js ≥ 22 (see `.nvmrc`)
- YouTrack 2026.2.0 or newer
- A permanent token with permission to install apps

## Getting Started

```bash
# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

### Environment setup

Create a `.env` file at the project root:

```env
YOUTRACK_HOST=https://your-instance.youtrack.cloud
YOUTRACK_TOKEN=perm:your-permanent-token
```

`youtrack-app` reads these variables from the environment. Export them in your shell, or prefix the command, for example `YOUTRACK_HOST=... YOUTRACK_TOKEN=... npm run upload`.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check, bundle, and validate the app |
| `npm run pack` | Create `pocket-status.zip` for manual upload |
| `npm run upload` | Upload built app to YouTrack from `dist/` |
| `npm run lint` | Run ESLint |
| `npm run screenshots` | Render the Marketplace and README screenshots to `screenshots/`. Install Playwright first: `npm install --no-save playwright && npx playwright install chromium` |

## Usage

For step-by-step instructions for users and administrators, see the [user guide](docs/USER_GUIDE.md).

Status sets belong to a project. Attach the app to a project before you use the widget in its issues and articles. Members of the project team manage the project sets in the **Pocket Status** tab of the project. Every user manages personal sets in the **Pocket Status** tab of their profile; the widget offers them in every project, next to the project sets. Both kinds of sets can also be created from the widget configuration dialog.

1. Open any YouTrack issue or article with a Markdown field
2. Insert the widget using the embed syntax in the Markdown editor
3. Pick a status set, or create a new one, then pick a status
4. The widget renders a borderless colored status tag inline with the text
5. Click the tag to switch to the next status of the set
6. To pick another set, open the widget menu and select **Edit...**

Issue tracking is on by default. Turn it off with the **Issue tracking** app setting, globally or for one project.

To show a field of an issue instead, enter its ID under **Or show a field of an issue** in the widget configuration, then pick the field: State, or any single-value enum or owned field. The widget shows the issue ID as a link, its summary and the current field value, and checks the issue again every 30 seconds. A user who can update that field and edit the text clicks the value to pick a new one; YouTrack applies its permissions and workflows to the change. A user who cannot see the issue gets a **Restricted issue** placeholder with a lock and nothing of the issue itself.

## Deployment

```bash
npm run build && npm run upload
```

For manual installation: run `npm run pack`, then upload `pocket-status.zip` through the YouTrack admin panel under **Administration → Apps**.

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 + TypeScript |
| State | MobX |
| Components | [JetBrains Ring UI](https://github.com/JetBrains/ring-ui) |
| Build | Vite 6 |
| Tooling | `@jetbrains/youtrack-apps-tools` |
