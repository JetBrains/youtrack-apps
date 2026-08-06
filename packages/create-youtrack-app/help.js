const { styleText } = require("node:util");
const createApp = 'npx @jetbrains/create-youtrack-app';
const command = value => styleText("magenta", value);
const heading = value => styleText("bold", value);
const code = value => styleText("cyan", value);

const extensionPoints = [
  'ADMINISTRATION_MENU_ITEM',
  'ARTICLE_ABOVE_ACTIVITY_STREAM',
  'ARTICLE_OPTIONS_MENU_ITEM',
  'DASHBOARD_WIDGET',
  'HELPDESK_CHANNEL',
  'ISSUE_ABOVE_ACTIVITY_STREAM',
  'ISSUE_BELOW_SUMMARY',
  'ISSUE_FIELD_PANEL_FIRST',
  'ISSUE_FIELD_PANEL_LAST',
  'ISSUE_OPTIONS_MENU_ITEM',
  'MAIN_MENU_ITEM',
  'MARKDOWN',
  'PROJECT_SETTINGS',
  'USER_CARD',
  'USER_PROFILE_SETTINGS',
].join(', ');

console.log(`
${heading('Create YouTrack App')}

Scaffold a YouTrack app or add features to the current app.

Usage:
  ${command(`${createApp} <entity> <action> [options]`)}

Common:
  ${command('--cwd <path>')}        Run from another directory.
  ${command('--help, -h')}          Show help.
  ${command('--version')}           Print the CLI version.
  Names: app/rule/widget keys use ${code('[a-z][a-z0-9-]*')}; extension
  properties use ${code('[A-Za-z_][A-Za-z0-9_]*')}; settings keys reject whitespace.


${heading('App Initialization')}

  ${command(`${createApp} app init [options]`)}

  Creates a new app. Missing values are prompted in an interactive terminal.
  Project type is selected here only; feature commands infer the existing app.

  Options:
    ${command('--name <name>')}         App package name.
    ${command('--type <type>')}         js | ts. Default: ts.
                          js = basic JavaScript app.
                          ts = TypeScript app with Enhanced DX.
    ${command('--title <text>')}        Manifest title. Default: title-cased --name.
    ${command('--description <text>')}  Manifest description. Default: derived from --type.
    ${command('--vendor <text>')}       Manifest vendor name. Default: VendorName.
    ${command('--vendor-url <url>')}    Manifest vendor URL. Default: https://vendor.com.
    ${command('--backend-only')}        For --type ts, omit the sample widget.
    ${command('--no-install')}          Skip dependency install.


${heading('Backend and Workflows')}

  ${command(`${createApp} rule add --type <type> --name <name>`)}

  Adds a workflow rule.

  Args:
    ${command('--type <type>')}         onChange | onSchedule | action | stateMachine | sla.
    ${command('--name <name>')}         Rule filename stem.

  Output: JS apps write ${code('src/<name>.js')}; TS apps write ${code('src/workflows/<name>.ts')}.


  ${command(`${createApp} http-handler add [options]`)}

  Adds an HTTP handler. Omit --scope and --path to open the interactive flow.

  Args:
    ${command('--scope <scope>')}        global | project | issue | article | user.
    ${command('--path <path>')}          Route path below the selected scope. Empty means the scope root.
    ${command('--method <method>')}      GET | POST | PUT | DELETE. Default: GET.
    ${command('--permissions <csv>')}    Permission keys, comma-separated.
    ${command('--handler <name>')}       JS apps only: handler file stem. Default: backend.

  JS usage: ${command('http-handler add --scope <scope> --path <path> --handler <name>')} writes
  ${code('src/<name>.js')}; omit ${command('--handler')} to update ${code('src/backend.js')}.
  TS output:
  ${code('src/backend/router/<scope>/<path>/<METHOD>.ts')}.


${heading('App Persistence')}

  ${command(`${createApp} settings init [options]`)}

  Creates ${code('src/settings.json')} when absent. Missing values are prompted
  interactively.

  Options:
    ${command('--title <text>')}         Settings schema title.
    ${command('--description <text>')}   Settings schema description.


  ${command(`${createApp} settings add --name <name> --type <type> [options]`)}

  Adds one property to ${code('src/settings.json')}.

  Options:
    ${command('--name <name>')}          Property key.
    ${command('--type <type>')}          string | integer | number | boolean | object | array.
    ${command('--title <text>')}         Property title.
    ${command('--description <text>')}   Property description.
    ${command('--scope <scope>')}        global | project | none. Default: none.
    ${command('--entity <entity>')}      Issue | User | Project | UserGroup | Article; only object/array.
    ${command('--required')}             Add to required[].
    ${command('--readonly')}             Mark read-only.
    ${command('--const <value>')}        Constant value for read-only property.
    ${command('--min-length <n>')}       String minimum length.
    ${command('--max-length <n>')}       String maximum length.
    ${command('--format <format>')}      String format, for example secret, date, date-time, email, uri.
    ${command('--enum <csv>')}           String allowed values.
    ${command('--min <n>')}              Number/integer inclusive minimum.
    ${command('--max <n>')}              Number/integer inclusive maximum.
    ${command('--exclusive-min <n>')}    Number/integer exclusive minimum.
    ${command('--exclusive-max <n>')}    Number/integer exclusive maximum.
    ${command('--multiple-of <n>')}      Number/integer multiple.


  ${command(`${createApp} extension-property add [options]`)}

  Updates ${code('src/entity-extensions.json')}. Omit --entity and --name to open
  the interactive flow.

  Args:
    ${command('--entity <Entity>')}      Issue | User | Project | Article.
    ${command('--name <name>')}          Extension property key.
    ${command('--type <type>')}          string | integer | float | boolean | Issue | User | Project | Article.
    ${command('--set')}                  Multi-value property.


${heading('Widgets')}

  ${command(`${createApp} widget add --key <key> --extension-point <point> [options]`)}

  Adds a widget and manifest entry. Omit widget flags to open the interactive flow.

  Options:
    ${command('--key <key>')}            Widget key.
    ${command('--extension-point <p>')}  ${extensionPoints}
    ${command('--name <text>')}          Display name. Default: title-cased --key.
    ${command('--description <text>')}   Widget description.
    ${command('--permissions <csv>')}    Permission keys, comma-separated.
    ${command('--width <n>')}            Expected width in pixels.
    ${command('--height <n>')}           Expected height in pixels.

  Output: ${code('src/widgets/<key>/')} plus manifest widget entry.


${heading('App Lifecycle')}

  Generated package scripts:
    ${command('npm run build')}                         Build and validate dist.
    ${command('npm run upload -- --host <url> --token <token> [--open]')}
                                             Upload dist.


${heading('Enhanced DX')}

  Enhanced DX is available only for TypeScript apps selected with
  ${command('--type ts')} during app initialization. They add file-based routing,
  generated API types, typed widget client, dev Zod validation, watch upload,
  and optional frontend hot reload.

  Generated package scripts:
    ${command('npm run dev')}                           Start the Enhanced DX dev workflow.
    ${command('npm run g -- <generator-command>')}      Run this generator in the app.

  ${command(`${createApp} endpoint add`)}

  Interactive typed endpoint generator for TypeScript apps with Enhanced DX.
  Omit the options to answer prompts interactively, or provide them for non-interactive generation.

  Values:
    ${command('--scope <scope>')}          global | issue | project | custom.
    ${command('--path <path>')}           Path below the selected scope.
    ${command('--method <method>')}       GET | POST | PUT | DELETE.
    ${command('--request-type <type>')}   Request type name or never. Default: never.
    ${command('--response-type <type>')}  Response type name or never. Default: never.
    ${command('--controller <name>')}     Existing exported function in
                                             src/backend/controllers/<scope>.<path>.controller.ts.
                                             Omit to generate an inline handler.

  Output: ${code('src/backend/router/<path>/<METHOD>.ts')}; backend builds generate
  ${code('src/api/api.d.ts')} and ${code('src/api/api.zod.ts')}.


${heading('Agent Skill')}

  ${command(`${createApp} skill install [options]`)}
  ${command(`${createApp} skill status [options]`)}

  Downloads, installs, or reports the YouTrack app builder skill from GitHub.

  Options:
    ${command('--agent <agent>')}        claude | codex | junie | all. Default: all.
    ${command('--scope <scope>')}        global | project | all. install default: global.

`);
