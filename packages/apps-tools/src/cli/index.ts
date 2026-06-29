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
    top: optionalArgString(args.top),
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
  switch (option) {
    case 'list':
    case 'download':
    case 'upload':
    case 'search':
    case 'info':
    case 'scripts':
    case 'settings':
    case 'settings-set':
    case 'tag-search':
    case 'delete':
    case 'enable':
    case 'disable':
    case 'attach':
    case 'detach':
    case 'logs':
    case 'script-logs':
    case 'requirement-errors':
    case 'project-list':
    case 'project-info':
    case 'project-fields':
    case 'group-list':
    case 'group-members':
    case 'user-list':
    case 'user-info':
      await checkRequiredParams(['host', 'token'], args, async () => {
        const executable = options[option];
        const commandArg = shouldJoinCommandArg(option) ? args._.slice(1).join(' ') : args._.slice(1)[0];
        await executable(config, commandArg);
      });
      return;
    case 'validate':
      await options['validate'](config, args._.slice(1)[0]);
      return;
    case 'version':
      printVersion();
      return;
    default:
      printHelp();
      return;
  }

  function printHelp() {
    br();
    printLine(i18n('list     [--skip N, --limit N, --json]'), i18n('View a list of installed apps'));
    printLine(i18n('download <app> [--output, --overwrite]       '), i18n('Download an app'));
    printLine(i18n('upload   <directory>                         '), i18n('Upload app to server'));
    printLine(i18n('validate <directory> [--manifest, --schema]  '), i18n('Validate manifest'));
    printLine(i18n('search   <query> [--skip N, --limit N, --json]'), i18n('Search apps by title or package name'));
    printLine(i18n('info     <app> [--json]                      '), i18n('Show app details'));
    printLine(i18n('scripts  <app> [--json]                      '), i18n('Show app files and scripts'));
    printLine(i18n('settings <app> [--project, --json]           '), i18n('Read app settings'));
    printLine(i18n('settings-set <app> [--project, --settings, --enabled]'), i18n('Update app settings'));
    printLine(i18n('tag-search <query> [--project, --skip N, --limit N, --json, --yaml]'), i18n('Search tags'));
    printLine(i18n('delete   <app> [--yes]                       '), i18n('Delete an app'));
    printLine(i18n('enable   <app> [--project <short-name>]      '), i18n('Enable an app'));
    printLine(i18n('disable  <app> [--project <short-name>]      '), i18n('Disable an app'));
    printLine(i18n('attach   <app> --project <short-name>        '), i18n('Attach an app to a project'));
    printLine(i18n('detach   <app> --project <short-name>        '), i18n('Detach an app from a project'));
    printLine(i18n('logs     <app> [--top N, --json]             '), i18n('Show app logs'));
    printLine(i18n('script-logs <app> <script> [--skip N, --limit N, --json]'), i18n('Show script logs'));
    printLine(i18n('requirement-errors <app> [--json]            '), i18n('Show app requirement errors'));
    printLine(i18n('project-list [--skip N, --limit N, --json, --yaml]'), i18n('View a list of projects'));
    printLine(i18n('project-info <project> [--yaml]              '), i18n('Show project details'));
    printLine(i18n('project-fields <project> [--yaml]            '), i18n('Show project custom fields'));
    printLine(i18n('group-list [--skip N, --limit N, --json, --yaml]'), i18n('View a list of user groups'));
    printLine(i18n('group-members <group> [--yaml]               '), i18n('Show user group members'));
    printLine(i18n('user-list [--skip N, --limit N, --json, --yaml]'), i18n('View a list of users'));
    printLine(i18n('user-info <user> [--yaml]                    '), i18n('Show user details'));
    br();
    console.log(
      i18n('One can also provide host and token via environment variables $YOUTRACK_HOST and $YOUTRACK_API_TOKEN.'),
    );

    function br() {
      console.log('');
    }

    function printLine(option: string, description: string) {
      console.log('    ' + option + '   ' + description);
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
}
