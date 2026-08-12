create-youtrack-app --help

Create YouTrack App

Scaffold a YouTrack app or add features to the current app.

Usage:
  npx @jetbrains/create-youtrack-app <entity> <action> [options]

Common:
  --cwd <path>        Run from another directory.
  --help, -h          Show help.
  --version           Print the CLI version.
  Naming patterns: app, rule, and widget keys use [a-z][a-z0-9-]; extension property keys use [A-Za-z_][A-Za-z0-9_]*; keys for app settings cannot contain whitespace.


App Initialization

  npx @jetbrains/create-youtrack-app app init [options]

  Creates a new app. In an interactive terminal, the command prompts you for any missing values. You can select the project type only here during app initialization. Feature commands detect the type from the current app.

  Options:
    --name <name>         App package name.
    --type <type>         js | ts. Default: ts.
                          js = basic JavaScript app.
                          ts = TypeScript app with Enhanced DX.
    --title <text>        Manifest title. Default: --name in title case.
    --description <text>  Manifest description. Default: derived from --type.
    --vendor <text>       Manifest vendor name. Default: VendorName.
    --vendor-url <url>    Manifest vendor URL. Default: https://vendor.com.
    --backend-only        For --type ts, omit the sample widget.
    --no-install          Skip dependency installation.


Workflow Rules and HTTP Handlers

  npx @jetbrains/create-youtrack-app rule add --type <type> --name <name>

  Adds a workflow rule.

  Args:
    --type <type>         onChange | onSchedule | action | stateMachine | sla.
    --name <name>         Rule filename stem.

  The command creates the src/<name>.js file for JavaScript apps and the src/workflows/<name>.ts file for TypeScript apps.


  npx @jetbrains/create-youtrack-app http-handler add [options]

  Adds an HTTP handler. Run without --scope and --path to configure the handler interactively.

  Args:
    --scope <scope>        global | project | issue | article | user.
    --path <path>          Route path below the selected scope. Empty means the scope root.
    --method <method>      GET | POST | PUT | DELETE. Default: GET.
    --permissions <csv>    Permission keys, comma-separated.
    --handler <name>       JS apps only: handler file stem. Default: backend.

  For JavaScript apps, the command writes the handler to the src/<name>.js file when you provide --handler <name>. Otherwise, it updates the src/backend.js file.
  For TypeScript apps, the command creates the src/backend/router/<scope>/<path>/<METHOD>.ts file.


App Persistence

  npx @jetbrains/create-youtrack-app settings init [options]

  Creates the src/settings.json file if it does not exist. In an interactive terminal, the command prompts you for any missing values.

  Options:
    --title <text>         Settings schema title.
    --description <text>   Settings schema description.


  npx @jetbrains/create-youtrack-app settings add --name <name> --type <type> [options]

  Adds a property to the src/settings.json file.

  Options:
    --name <name>          Property key.
    --type <type>          string | integer | number | boolean | object | array.
    --title <text>         Property title.
    --description <text>   Property description.
    --scope <scope>        global | project | none. Default: none.
    --entity <entity>      Issue | User | Project | UserGroup | Article. Use only with object and array properties.
    --required             Adds the property key to the required[] array.
    --readonly             Marks the property as read-only.
    --const <value>        Constant value for read-only property.
    --min-length <n>       String minimum length.
    --max-length <n>       String maximum length.
    --format <format>      String format, for example secret, date, date-time, email, uri.
    --enum <csv>           Comma-separated list of allowed string values.
    --min <n>              Number/integer inclusive minimum.
    --max <n>              Number/integer inclusive maximum.
    --exclusive-min <n>    Number/integer exclusive minimum.
    --exclusive-max <n>    Number/integer exclusive maximum.
    --multiple-of <n>      Number/integer multiple.


  npx @jetbrains/create-youtrack-app extension-property add [options]

  Updates the src/entity-extensions.json file. Run without --entity and --name to configure the property interactively.

  Args:
    --entity <Entity>      Issue | User | Project | Article.
    --name <name>          Extension property key.
    --type <type>          string | integer | float | boolean | Issue | User | Project | Article.
    --set                  Multi-value property.


Widgets

  npx @jetbrains/create-youtrack-app widget add --key <key> --extension-point <point> [options]

  Adds a widget and a corresponding entry to the manifest.json file. Run without widget options to configure the widget interactively.

  Options:
    --key <key>            Widget key.
    --extension-point <p>  ADMINISTRATION_MENU_ITEM, ARTICLE_ABOVE_ACTIVITY_STREAM, ARTICLE_OPTIONS_MENU_ITEM, DASHBOARD_WIDGET, HELPDESK_CHANNEL, ISSUE_ABOVE_ACTIVITY_STREAM, ISSUE_BELOW_SUMMARY, ISSUE_FIELD_PANEL_FIRST, ISSUE_FIELD_PANEL_LAST, ISSUE_OPTIONS_MENU_ITEM, MAIN_MENU_ITEM, MARKDOWN, PROJECT_SETTINGS, USER_CARD, USER_PROFILE_SETTINGS
    --name <text>          Display name. Default: title-cased --key.
    --description <text>   Widget description.
    --permissions <csv>    Permission keys, comma-separated.
    --width <n>            Expected width in pixels.
    --height <n>           Expected height in pixels.

  Creates the: src/widgets/<key>/ directory and updates the manifest.json file.


App Lifecycle

  Generated package scripts:
    npm run build                         Build and validate dist.
    npm run upload -- --host <url> --token <token> [--open]
                                             Upload dist.


Enhanced DX

  Enhanced DX is available only for TypeScript apps initialized with --type ts. It provides file-based routing, generated API types, a typed widget client, development-time Zod validation, automatic rebuild and upload in watch mode, and optional frontend hot reload.

  Generated package scripts:
    npm run dev                           Start the Enhanced DX dev workflow.
    npm run g -- <generator-command>      Run this generator in the app.

  npx @jetbrains/create-youtrack-app endpoint add

  Adds a typed endpoint to a TypeScript app that uses Enhanced DX. Run without options to configure the endpoint interactively, or provide options for non-interactive generation.

  Options:
    --scope <scope>          global | issue | project | custom.
    --path <path>           Path below the selected scope.
    --method <method>       GET | POST | PUT | DELETE.
    --request-type <type>   Request type name or never. Default: never.
    --response-type <type>  Response type name or never. Default: never.
    --controller <name>     Name of an existing function exported from the 
                                             src/backend/controllers/<scope>.<path>.controller.ts file.
                                             Omit this option to generate an inline handler.

  Creates the src/backend/router/<path>/<METHOD>.ts file. Backend builds also generate the
  src/api/api.d.ts and src/api/api.zod.ts files.


Agent Skill

  npx @jetbrains/create-youtrack-app skill install [options]
  npx @jetbrains/create-youtrack-app skill status [options]

  Installs the bundled YouTrack Apps skill or reports its status.

  Options:
    --agent <agent>        claude | codex | junie | all. Default: all.
    --scope <scope>        global | project | all. install default: global.