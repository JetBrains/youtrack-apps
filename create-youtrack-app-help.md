create-youtrack-app --help

Create YouTrack App

Scaffold a YouTrack app or add features to the current app.

Usage:
  npx @jetbrains/create-youtrack-app <entity> <action> [options]

Common:
  --cwd <path>        Run from another directory.
  --help, -h          Show help.
  --version           Print the CLI version.
  Names: app/rule/widget keys use [a-z][a-z0-9-]*; extension
  properties use [A-Za-z_][A-Za-z0-9_]*; settings keys reject whitespace.


App Initialization

  npx @jetbrains/create-youtrack-app app init [options]

  Creates a new app. Missing values are prompted in an interactive terminal.
  Project type is selected here only; feature commands infer the existing app.

  Options:
    --name <name>         App package name.
    --type <type>         js | ts. Default: ts.
                          js = basic JavaScript app.
                          ts = TypeScript app with Enhanced DX.
    --title <text>        Manifest title. Default: title-cased --name.
    --description <text>  Manifest description. Default: derived from --type.
    --vendor <text>       Manifest vendor name. Default: VendorName.
    --vendor-url <url>    Manifest vendor URL. Default: https://vendor.com.
    --backend-only        For --type ts, omit the sample widget.
    --no-install          Skip dependency install.


Backend and Workflows

  npx @jetbrains/create-youtrack-app rule add --type <type> --name <name>

  Adds a workflow rule.

  Args:
    --type <type>         onChange | onSchedule | action | stateMachine | sla.
    --name <name>         Rule filename stem.

  Output: JS apps write src/<name>.js; TS apps write src/workflows/<name>.ts.


  npx @jetbrains/create-youtrack-app http-handler add [options]

  Adds an HTTP handler. Omit --scope and --path to open the interactive flow.

  Args:
    --scope <scope>        global | project | issue | article | user.
    --path <path>          Route path below the selected scope. Empty means the scope root.
    --method <method>      GET | POST | PUT | DELETE. Default: GET.
    --permissions <csv>    Permission keys, comma-separated.
    --handler <name>       JS apps only: handler file stem. Default: backend.

  JS usage: http-handler add --scope <scope> --path <path> --handler <name> writes
  src/<name>.js; omit --handler to update src/backend.js.
  TS output:
  src/backend/router/<scope>/<path>/<METHOD>.ts.


App Persistance

  npx @jetbrains/create-youtrack-app settings init [options]

  Creates src/settings.json when absent. Missing values are prompted
  interactively.

  Options:
    --title <text>         Settings schema title.
    --description <text>   Settings schema description.


  npx @jetbrains/create-youtrack-app settings add --name <name> --type <type> [options]

  Adds one property to src/settings.json.

  Options:
    --name <name>          Property key.
    --type <type>          string | integer | number | boolean | object | array.
    --title <text>         Property title.
    --description <text>   Property description.
    --scope <scope>        global | project | none. Default: none.
    --entity <entity>      Issue | User | Project | UserGroup | Article; only object/array.
    --required             Add to required[].
    --readonly             Mark read-only.
    --const <value>        Constant value for read-only property.
    --min-length <n>       String minimum length.
    --max-length <n>       String maximum length.
    --format <format>      String format, for example secret, date, date-time, email, uri.
    --enum <csv>           String allowed values.
    --min <n>              Number/integer inclusive minimum.
    --max <n>              Number/integer inclusive maximum.
    --exclusive-min <n>    Number/integer exclusive minimum.
    --exclusive-max <n>    Number/integer exclusive maximum.
    --multiple-of <n>      Number/integer multiple.


  npx @jetbrains/create-youtrack-app extension-property add [options]

  Updates src/entity-extensions.json. Omit --entity and --name to open
  the interactive flow.

  Args:
    --entity <Entity>      Issue | User | Project | Article.
    --name <name>          Extension property key.
    --type <type>          string | integer | float | boolean | Issue | User | Project | Article.
    --set                  Multi-value property.


Widgets

  npx @jetbrains/create-youtrack-app widget add --key <key> --extension-point <point> [options]

  Adds a widget and manifest entry. Omit widget flags to open the interactive flow.

  Options:
    --key <key>            Widget key.
    --extension-point <p>  ADMINISTRATION_MENU_ITEM, ARTICLE_ABOVE_ACTIVITY_STREAM, ARTICLE_OPTIONS_MENU_ITEM, DASHBOARD_WIDGET, HELPDESK_CHANNEL, ISSUE_ABOVE_ACTIVITY_STREAM, ISSUE_BELOW_SUMMARY, ISSUE_FIELD_PANEL_FIRST, ISSUE_FIELD_PANEL_LAST, ISSUE_OPTIONS_MENU_ITEM, MAIN_MENU_ITEM, MARKDOWN, PROJECT_SETTINGS, USER_CARD, USER_PROFILE_SETTINGS
    --name <text>          Display name. Default: title-cased --key.
    --description <text>   Widget description.
    --permissions <csv>    Permission keys, comma-separated.
    --width <n>            Expected width in pixels.
    --height <n>           Expected height in pixels.

  Output: src/widgets/<key>/ plus manifest widget entry.


App Lifecycle

  Generated package scripts:
    npm run build                         Build and validate dist.
    npm run upload -- --host <url> --token <token> [--open]
                                             Upload dist.


Enhanced DX

  Enhanced DX is available only for TypeScript apps selected with
  --type ts during app initialization. They add file-based routing,
  generated API types, typed widget client, dev Zod validation, watch upload,
  and optional frontend hot reload.

  Generated package scripts:
    npm run dev                           Start the Enhanced DX dev workflow.
    npm run g -- <generator-command>      Run this generator in the app.

  npx @jetbrains/create-youtrack-app endpoint add

  Interactive typed endpoint generator for TypeScript apps with Enhanced DX.
  Omit the options to answer prompts interactively, or provide them for non-interactive generation.

  Values:
    --scope <scope>          global | issue | project | custom.
    --path <path>           Path below the selected scope.
    --method <method>       GET | POST | PUT | DELETE.
    --request-type <type>   Request type name or never. Default: never.
    --response-type <type>  Response type name or never. Default: never.
    --controller <name>     Existing exported function in
                                             src/backend/controllers/<scope>.<path>.controller.ts.
                                             Omit to generate an inline handler.

  Output: src/backend/router/<path>/<METHOD>.ts; backend builds generate
  src/api/api.d.ts and src/api/api.zod.ts.


Agent Skill

  npx @jetbrains/create-youtrack-app skill install [options]
  npx @jetbrains/create-youtrack-app skill status [options]

  Installs or reports the bundled YouTrack app builder skill.

  Options:
    --agent <agent>        claude | codex | junie | all. Default: all.
    --scope <scope>        global | project | all. install default: global.
