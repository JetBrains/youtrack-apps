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
  Naming patterns: app, rule, and widget keys use ${code('[a-z][a-z0-9-]')}; extension property keys use ${code('[A-Za-z_][A-Za-z0-9_]*')}; keys for app settings cannot contain whitespace.


${heading('App Initialization')}

  ${command(`${createApp} app init [options]`)}

  Creates a new app. In an interactive terminal, the command prompts you for any missing values. You can select the project type only here during app initialization. Feature commands detect the type from the current app.

  Options:
    ${command('--name <name>')}         App package name.
    ${command('--type <type>')}         js | ts. Default: ts.
                          js = basic JavaScript app.
                          ts = TypeScript app with Enhanced DX.
    ${command('--title <text>')}        Default: --name in title case.
    ${command('--description <text>')}  Default: derived from --type.
    ${command('--vendor <text>')}       Manifest vendor name. Default: VendorName.
    ${command('--vendor-url <url>')}    Manifest vendor URL. Default: https://vendor.com.
    ${command('--backend-only')}        For --type ts, omit the sample widget.
    ${command('--no-install')}          Skip dependency installation.


${heading('Workflow Rules and HTTP Handlers')}

  ${command(`${createApp} rule add --type <type> --name <name>`)}

  Adds a workflow rule.

  Args:
    ${command('--type <type>')}         onChange | onSchedule | action | stateMachine | sla.
    ${command('--name <name>')}         Rule filename stem.

  The command creates the ${code('src/<name>.js')} file for JavaScript apps and the ${code('src/workflows/<name>.ts')} file for TypeScript apps.


  ${command(`${createApp} http-handler add [options]`)}

  Adds an HTTP handler. Run without --scope and --path to configure the handler interactively.

  Args:
    ${command('--scope <scope>')}        global | project | issue | article | user.
    ${command('--path <path>')}          Route path below the selected scope. Empty means the scope root.
    ${command('--method <method>')}      GET | POST | PUT | DELETE. Default: GET.
    ${command('--permissions <csv>')}    Permission keys, comma-separated.
    ${command('--handler <name>')}       JS apps only: handler file stem. Default: backend.

  For JavaScript apps, the command writes the handler to the ${code('src/<name>.js')} file when you provide ${command('--handler <name>')}. Otherwise, it updates the ${code('src/backend.js')} file.
  For TypeScript apps, the command creates the ${code('src/backend/router/<scope>/<path>/<METHOD>.ts')} file.


${heading('App Persistence')}

  ${command(`${createApp} settings init [options]`)}

  Creates the ${code('src/settings.json')} file if it does not exist. In an interactive terminal, the command prompts you for any missing values.

  Options:
    ${command('--title <text>')}         Settings schema title.
    ${command('--description <text>')}   Settings schema description.


  ${command(`${createApp} settings add --name <name> --type <type> [options]`)}

  Adds a property to the ${code('src/settings.json')} file.

  Options:
    ${command('--name <name>')}          Property key.
    ${command('--type <type>')}          string | integer | number | boolean | object | array.
    ${command('--title <text>')}         Property title.
    ${command('--description <text>')}   Property description.
    ${command('--scope <scope>')}        global | project | none. Default: none.
    ${command('--entity <entity>')}      Issue | User | Project | UserGroup | Article. Use only with object and array properties.
    ${command('--required')}             Adds the property key to the required[] array.
    ${command('--readonly')}             Marks the property as read-only.
    ${command('--const <value>')}        Constant value for read-only property.
    ${command('--min-length <n>')}       String minimum length.
    ${command('--max-length <n>')}       String maximum length.
    ${command('--format <format>')}      String format, for example secret, date, date-time, email, uri.
    ${command('--enum <csv>')}           Comma-separated list of allowed string values.
    ${command('--min <n>')}              Number/integer inclusive minimum.
    ${command('--max <n>')}              Number/integer inclusive maximum.
    ${command('--exclusive-min <n>')}    Number/integer exclusive minimum.
    ${command('--exclusive-max <n>')}    Number/integer exclusive maximum.
    ${command('--multiple-of <n>')}      Number/integer multiple.


  ${command(`${createApp} extension-property add [options]`)}

  Updates the ${code('src/entity-extensions.json')} file. Run without --entity and --name to configure the property interactively.

  Args:
    ${command('--entity <Entity>')}      Issue | User | Project | Article.
    ${command('--name <name>')}          Extension property key.
    ${command('--type <type>')}          string | integer | float | boolean | Issue | User | Project | Article.
    ${command('--set')}                  Multi-value property.


${heading('Widgets')}

  ${command(`${createApp} widget add --key <key> --extension-point <point> [options]`)}

  Adds a widget and a corresponding entry to the manifest.json file. Run without widget options to configure the widget interactively.

  Options:
    ${command('--key <key>')}            Widget key.
    ${command('--extension-point <p>')}  ${extensionPoints}
    ${command('--name <text>')}          Display name. Default: title-cased --key.
    ${command('--description <text>')}   Widget description.
    ${command('--permissions <csv>')}    Permission keys, comma-separated.
    ${command('--width <n>')}            Expected width in pixels.
    ${command('--height <n>')}           Expected height in pixels.

  Creates the: ${code('src/widgets/<key>/')} directory and updates the manifest.json file.


${heading('App Lifecycle')}

  Generated package scripts:
    ${command('npm run build')}                         Build and validate dist.
    ${command('npm run upload -- --host <url> --token <token> [--open]')}
                                             Upload dist.


${heading('Enhanced DX')}

  Enhanced DX is available only for TypeScript apps initialized with ${command('--type ts')}. It provides file-based routing, generated API types, a typed widget client, development-time Zod validation, automatic rebuild and upload in watch mode, and optional frontend hot reload.

  Generated package scripts:
    ${command('npm run dev')}                           Start the Enhanced DX dev workflow.
    ${command('npm run g -- <generator-command>')}      Run this generator in the app.

  ${command(`${createApp} endpoint add`)}

  Adds a typed endpoint to a TypeScript app that uses Enhanced DX. Run without options to configure the endpoint interactively, or provide options for non-interactive generation.

  Values:
    ${command('--scope <scope>')}          global | issue | project | custom.
    ${command('--path <path>')}           Path below the selected scope.
    ${command('--method <method>')}       GET | POST | PUT | DELETE.
    ${command('--request-type <type>')}   Request type name or never. Default: never.
    ${command('--response-type <type>')}  Response type name or never. Default: never.
    ${command('--controller <name>')}     Name of an existing function exported from the 
                                             src/backend/controllers/<scope>.<path>.controller.ts file.
                                             Omit this option to generate an inline handler.

  Creates the ${code('src/backend/router/<path>/<METHOD>.ts')} file. Backend builds also generate the
  ${code('src/api/api.d.ts')} and ${code('src/api/api.zod.ts')} files.


${heading('Agent Skill')}

  ${command(`${createApp} skill install [options]`)}
  ${command(`${createApp} skill status [options]`)}

  Installs the bundled YouTrack Apps skill or reports its status.

  Options:
    ${command('--agent <agent>')}        claude | codex | junie | all. Default: all.
    ${command('--scope <scope>')}        global | project | all. install default: global.

`);
