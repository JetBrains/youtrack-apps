import pkg from '../../package.json' with { type: 'json' };
import {i18n} from '../../lib/i18n/i18n.js';
import {exit} from '../../lib/cli/exit.js';
import {parse} from '../../lib/cli/parseargv.js';
import {Config, RequiredParams} from '../../@types/types.js';
import {list} from './commands/list.js';
import {download} from './download.js';
import {upload} from './upload.js';
import {resolve} from '../../lib/net/resolve.js';
import {validate} from './validate.js';
import {info, search} from './commands/discovery.js';
import {deleteApp, disable, enable} from './commands/lifecycle.js';
import {attach, detach} from './commands/project-scope.js';
import {logs, requirementErrors, scriptLogs} from './commands/diagnostics.js';
import {projectFields, projectInfo, projectList} from './commands/projects.js';
import {groupList, groupMembers} from './commands/groups.js';
import {userInfo, userList} from './commands/users.js';
import {scripts} from './commands/scripts.js';
import {settings, settingsSet} from './commands/settings.js';
import {tagSearch} from './commands/tags.js';

const options = {
  list: list,
  download: download,
  upload: upload,
  validate: validate,
  search: search,
  info: info,
  scripts: scripts,
  settings: settings,
  'settings-set': settingsSet,
  'tag-search': tagSearch,
  delete: deleteApp,
  enable: enable,
  disable: disable,
  attach: attach,
  detach: detach,
  logs: logs,
  'script-logs': scriptLogs,
  'requirement-errors': requirementErrors,
  'project-list': projectList,
  'project-info': projectInfo,
  'project-fields': projectFields,
  'group-list': groupList,
  'group-members': groupMembers,
  'user-list': userList,
  'user-info': userInfo,
} as const;

export async function run(argv = process.argv) {
  const args = parse(argv);
  const {YOUTRACK_HOST, YOUTRACK_API_TOKEN} = process.env;
  const config: Config = {
    host: args.host || YOUTRACK_HOST || null,
    token: args.token || YOUTRACK_API_TOKEN || null,
    output: args.output || null,
    overwrite: args.overwrite || null,
    manifest: args.manifest || null,
    schema: args.schema || null,
    open: args.open || null,
    json: isFlagEnabled(args.json),
    yaml: isFlagEnabled(args.yaml),
    yes: isFlagEnabled(args.yes),
    project: args.project || null,
    skip: optionalArgString(args.skip),
    limit: optionalArgString(args.limit),
    settings: optionalArgString(args.settings),
    enabled: optionalArgString(args.enabled),
    cwd: process.cwd(),
  };

  if (args.version || args.v) {
    return printVersion();
  }

  const option = args._[0];
  if (option === 'version') {
    printVersion();
    return;
  }

  if (!isCommand(option)) {
    printHelp();
    return;
  }

  const executable = options[option];
  const commandArg = shouldJoinCommandArg(option) ? args._.slice(1).join(' ') : args._.slice(1)[0];
  if (option === 'validate') {
    await executable(config, commandArg);
    return;
  }

  await checkRequiredParams(['host', 'token'], args, async () => {
    await executable(config, commandArg);
  });

  function printHelp() {
    br();
    console.log(i18n('youtrack-app <command> [options]'));
    br();
    console.log(i18n('Manage, configure, and debug YouTrack apps from an external development environment.'));
    console.log(i18n('Most commands require --host and --token. You can also set YOUTRACK_HOST and YOUTRACK_API_TOKEN.'));
    br();

    printSection(i18n('App lifecycle'));
    printCommand(i18n('upload <directory> [--open]'), {
      does: i18n('Uploads a local app package to the YouTrack instance.'),
      args: i18n('<directory> is a local app directory or built package directory, usually dist. --open opens app settings after upload.'),
    });
    printCommand(i18n('download <app> [--output DIR] [--overwrite]'), {
      does: i18n('Downloads an app package from the YouTrack instance and extracts it locally.'),
      args: i18n('<app> is an app ID, package name, or title. --output selects the local destination.'),
    });
    printCommand(i18n('validate <directory> [--manifest FILE] [--schema FILE]'), {
      does: i18n('Validates local app manifest files against the YouTrack app JSON schema without connecting to YouTrack.'),
      args: i18n('<directory> is a local app directory. --manifest and --schema override the default files.'),
    });
    printCommand(i18n('delete <app> [--yes]'), {
      does: i18n('Deletes an installed app from the YouTrack instance.'),
      args: i18n('<app> is an app ID, package name, or title. --yes skips the confirmation prompt.'),
    });
    printCommand(i18n('enable <app> [--project <short-name>]'), {
      does: i18n('Enables an installed app globally in the YouTrack instance, or enables its usage for one project.'),
      args: i18n('<app> is an app ID, package name, or title. --project is a project short name such as DEMO or JT.'),
    });
    printCommand(i18n('disable <app> [--project <short-name>]'), {
      does: i18n('Disables an installed app globally in the YouTrack instance, or disables its usage for one project.'),
      args: i18n('<app> is an app ID, package name, or title. --project is a project short name such as DEMO or JT.'),
    });
    printCommand(i18n('attach <app> --project <short-name>'), {
      does: i18n('Attaches an installed app to a project in the YouTrack instance.'),
      args: i18n('<app> is an app ID, package name, or title. <short-name> is the project key, for example DEMO or JT.'),
    });
    printCommand(i18n('detach <app> --project <short-name>'), {
      does: i18n('Detaches an installed app from a project in the YouTrack instance.'),
      args: i18n('<app> is an app ID, package name, or title. <short-name> is the project key to remove from app usages.'),
    });
    br();

    printSection(i18n('App details and configuration'));
    printCommand(i18n('list [--skip N] [--limit N] [--json] [--yaml]'), {
      does: i18n('Lists installed apps visible to the token in the YouTrack instance, with page metadata for large app lists.'),
      args: i18n('--skip and --limit page through large result sets; --json and --yaml print the raw page object.'),
    });
    printCommand(i18n('search <query> [--skip N] [--limit N] [--json] [--yaml]'), {
      does: i18n('Finds installed apps in the YouTrack instance whose title matches the query text.'),
      args: i18n('<query> is a full or partial app title, for example "Slack"; --skip and --limit page through matches.'),
    });
    printCommand(i18n('info <app> [--json] [--yaml]'), {
      does: i18n('Shows one installed app in the YouTrack instance with enabled state, project usages, rules, and requirement errors.'),
      args: i18n('<app> is an app ID, package name, or title.'),
    });
    printCommand(i18n('scripts <app> [--json]'), {
      does: i18n('Shows package metadata, manifest content, settings schema, entity extensions, and script source files from an installed app in the YouTrack instance.'),
      args: i18n('<app> is an app ID, package name, or title.'),
    });
    printCommand(i18n('settings <app> [--project <short-name>] [--json]'), {
      does: i18n('Reads global app settings or project-scoped settings from the YouTrack instance.'),
      args: i18n('<app> is resolved by title or package name. --project is a project short name.'),
    });
    printCommand(i18n('settings-set <app> [--project <short-name>] [--settings JSON] [--enabled true|false]'), {
      does: i18n('Updates app settings and/or enabled state in the YouTrack instance.'),
      args: i18n('--settings is a JSON object string. Without --project it writes global settings; with --project it writes project settings.'),
    });
    printCommand(i18n('logs <app> [--top N] [--json]'), {
      does: i18n('Shows recent app-level log entries from the YouTrack instance.'),
      args: i18n('<app> is an app ID, package name, or title. --top limits how many entries are requested.'),
    });
    printCommand(i18n('script-logs <app> <script> [--skip N] [--limit N] [--json]'), {
      does: i18n('Shows paged log entries from the YouTrack instance for one script, module, or workflow rule.'),
      args: i18n('<app> is an app ID, package name, or title. <script> is a script, module, rule ID, rule name, or rule title.'),
    });
    printCommand(i18n('requirement-errors <app> [--json]'), {
      does: i18n('Shows broken requirement problems reported by app usages in the YouTrack instance.'),
      args: i18n('<app> is an app ID, package name, or title.'),
    });
    br();

    printSection(i18n('Instance exploration'));
    printCommand(i18n('project-list [--skip N] [--limit N] [--json] [--yaml]'), {
      does: i18n('Lists projects in the YouTrack instance with short names and IDs for later project-scoped commands.'),
      args: i18n('--skip and --limit page through large project lists.'),
    });
    printCommand(i18n('project-info <project> [--skip N] [--limit N] [--yaml]'), {
      does: i18n('Shows identifying details for one project in the YouTrack instance.'),
      args: i18n('<project> is an exact project ID, short name, or name. --skip and --limit choose the resource page to resolve within.'),
    });
    printCommand(i18n('project-fields <project> [--skip N] [--limit N] [--yaml]'), {
      does: i18n('Lists the issue field schema for one project in the YouTrack instance, including custom field types, required fields, and allowed values when available.'),
      args: i18n('<project> is an exact project ID, short name, or name. --skip and --limit choose the resource page to resolve within.'),
    });
    printCommand(i18n('tag-search <query> [--project <short-name>] [--skip N] [--limit N] [--json] [--yaml]'), {
      does: i18n('Searches visible usable tags in the YouTrack instance, optionally narrowed to tags relevant for one project.'),
      args: i18n('<query> is tag name text. --project is a project short name; --skip and --limit page through matches.'),
    });
    printCommand(i18n('group-list [--skip N] [--limit N] [--json] [--yaml]'), {
      does: i18n('Lists user groups and project teams in the YouTrack instance with IDs and user counts.'),
      args: i18n('--skip and --limit page through large group lists.'),
    });
    printCommand(i18n('group-members <group> [--skip N] [--limit N] [--yaml]'), {
      does: i18n('Shows direct members of one user group or project team in the YouTrack instance.'),
      args: i18n('<group> is an exact user group or project team ID or name. --skip and --limit choose the resource page to resolve within.'),
    });
    printCommand(i18n('user-list [--skip N] [--limit N] [--json] [--yaml]'), {
      does: i18n('Lists users in the YouTrack instance with login, ID, and display name for later user lookup.'),
      args: i18n('--skip and --limit page through large user lists.'),
    });
    printCommand(i18n('user-info <user> [--skip N] [--limit N] [--yaml]'), {
      does: i18n('Shows profile details for one user in the YouTrack instance, including email, guest state, and user type when visible.'),
      args: i18n('<user> is an exact user ID, login, username, or full name. --skip and --limit choose the resource page to resolve within.'),
    });
    br();

    printSection(i18n('Common options'));
    printLine(i18n('--host <url>'), i18n('YouTrack instance URL. Overrides YOUTRACK_HOST.'));
    printLine(i18n('--token <token>'), i18n('Permanent token. Overrides YOUTRACK_API_TOKEN.'));
    printLine(i18n('--json'), i18n('Print machine-readable JSON for commands that support it.'));
    printLine(i18n('--yaml'), i18n('Print YAML for commands that support it.'));
    printLine(i18n('--skip N, --limit N'), i18n('Page through list results or choose the resource page used by exact lookup commands.'));
    printLine(i18n('version, --version, -v'), i18n('Print the CLI version.'));

    function br() {
      console.log('');
    }

    function printSection(title: string) {
      console.log(title + ':');
    }

    function printCommand(command: string, details: {does: string; args: string}) {
      console.log('  ' + command);
      printDetail(i18n('Does'), details.does);
      printDetail(i18n('Args'), details.args);
    }

    function printDetail(label: string, value: string) {
      console.log('    ' + label + ': ' + value);
    }

    function printLine(option: string, description: string) {
      console.log('  ' + option.padEnd(78) + description);
    }
  }

  async function checkRequiredParams(
    required: RequiredParams[],
    args: Record<string, unknown>,
    fn: () => Promise<void>,
  ): Promise<void> {
    function allParamsProvided(params: RequiredParams[], args: Record<string, unknown>): boolean {
      return params.every(param => {
        if ((!args.hasOwnProperty(param) || !args[param]) && !config[param]) {
          if (param === 'token') {
            const createTokenUrl = `${resolve(config.host, 'users/me?tab=account-security').href}`;
            exit(new Error(i18n(`Token is required. Please create one at ${createTokenUrl}`)));
          } else {
            exit(new Error(i18n('Option "--' + param + '" is required')));
          }

          return false;
        }
        return true;
      });
    }

    if (allParamsProvided(required, args)) await fn();
  }

  function printVersion() {
    console.log(pkg.version);
  }

  function isFlagEnabled(value: unknown): boolean {
    return value !== undefined && value !== false && value !== 'false';
  }

  function optionalArgString(value: unknown): string | null {
    return value === undefined || value === null || value === false ? null : value.toString();
  }

  function shouldJoinCommandArg(option: string | number): boolean {
    return option === 'search' || option === 'settings' || option === 'settings-set' || option === 'tag-search' || option === 'script-logs';
  }

  function isCommand(option: string | number | undefined): option is keyof typeof options {
    return option !== undefined && Object.hasOwn(options, option);
  }
}
