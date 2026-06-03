# YouTrack App Generator

## Create an App

Run the generator and follow the prompts:

```bash
npm create @jetbrains/youtrack-app
```

View all available commands:

```bash
npx @jetbrains/create-youtrack-app --help
```

## Add Features

Run these commands from a generated YouTrack app directory.

| Action | Command |
| --- | --- |
| Create a settings schema | `npx @jetbrains/create-youtrack-app settings init` |
| Add a property to an existing settings schema | `npx @jetbrains/create-youtrack-app settings add` |
| Add a widget | `npx @jetbrains/create-youtrack-app widget add` |
| Declare an extension property | `npx @jetbrains/create-youtrack-app extension-property add` |
| Add an HTTP handler | `npx @jetbrains/create-youtrack-app http-handler add` |

## Skill Commands

The skill gives supported AI coding agents YouTrack app development guidance.

| Command | Description |
| --- | --- |
| `npx @jetbrains/create-youtrack-app skill install` | Installs the skill for the default agents. |
| `npx @jetbrains/create-youtrack-app skill update` | Replaces an installed skill with the version bundled in this package. |
| `npx @jetbrains/create-youtrack-app skill status` | Shows whether the skill is installed. |
| `npx @jetbrains/create-youtrack-app skill install --agent codex` | Installs the skill for Codex. |
| `npx @jetbrains/create-youtrack-app skill install --agent claude` | Installs the skill for Claude. |
| `npx @jetbrains/create-youtrack-app skill install --agent both` | Installs the skill for Codex and Claude. |

## Enhanced DX Commands

Enhanced DX TypeScript apps include local generator scripts:

```bash
npm run generate
npm run g
```

Run `npm run g` without arguments to open the interactive generator menu:

```bash
npm run g
```

### HTTP Handlers

Syntax:

```bash
npm run g -- handler <scope>/<path> [--method METHOD] [--permissions PERMS]
```

Examples:

```bash
npm run g -- handler global/health
npm run g -- handler project/users --method POST
npm run g -- h issue/comments --method POST --permissions read-issue,update-issue
```

Options:

| Option | Description |
| --- | --- |
| `<scope>` | `global`, `project`, `issue`, `article`, or `user` |
| `<path>` | Route path, including nested paths |
| `--method` | `GET`, `POST`, `PUT`, or `DELETE`; defaults to `GET` |
| `--permissions` | Comma-separated permissions |
| Aliases | `handler`, `h` |

### Extension Properties

Syntax:

```bash
npm run g -- property <Entity>.<name> [--type TYPE] [--set]
```

Examples:

```bash
npm run g -- property Issue.customStatus
npm run g -- property Comment.rating --type integer
npm run g -- p Issue.tags --type string --set
```

Options:

| Option | Description |
| --- | --- |
| `<Entity>` | `Issue`, `User`, `Project`, or `Article` |
| `<name>` | Property name |
| `--type` | `string`, `integer`, `float`, `boolean`, `Issue`, `User`, `Project`, or `Article`; defaults to `string` |
| `--set` | Creates a multi-value property |
| Aliases | `property`, `prop`, `p` |

### Settings

Syntax:

```bash
npm run g -- settings init [--title TITLE] [--description DESC]
npm run g -- settings add
```

Examples:

```bash
npm run g -- settings init --title "My Settings" --description "Settings for my app"
npm run g -- settings init
npm run g -- settings add
npm run g -- s init --title "My Settings" --description "Settings for my app"
```

Options:

| Option | Description |
| --- | --- |
| `init` | Creates a settings schema |
| `add` | Adds a property to an existing settings schema |
| `--title` | Settings title used by `init` |
| `--description` | Settings description used by `init` |
| Aliases | `settings`, `setting`, `s` |
