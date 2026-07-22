import pkg from '../../package.json' with { type: 'json' };
import {i18n} from '../../lib/i18n/i18n.js';
import {exit} from '../../lib/cli/exit.js';
import {parse} from '../../lib/cli/parseargv.js';
import {Config, RequiredParams} from '../../@types/types.js';
import {download} from './download.js';
import {upload} from './upload.js';
import {resolve} from '../../lib/net/resolve.js';
import {validate} from './validate.js';
import {info, list} from './commands/discovery.js';
import {deleteApp, disable, enable} from './commands/lifecycle.js';
import {attach, detach} from './commands/project-scope.js';
import {logs, requirementErrors} from './commands/diagnostics.js';
import {projectFields, projectInfo, projectList} from './commands/projects.js';
import {projectApps} from './commands/project-apps.js';
import {groupList, groupMembers} from './commands/groups.js';
import {userInfo, userList} from './commands/users.js';
import {scripts} from './commands/scripts.js';
import {settings, settingsSet} from './commands/settings.js';
import {tagSearch} from './commands/tags.js';
import {usages} from './commands/usages.js';
import {fieldValues} from './commands/field-values.js';
import {visibility} from './commands/visibility.js';

const options = {
  download: download,
  upload: upload,
  validate: validate,
  list: list,
  info: info,
  scripts: scripts,
  usages: usages,
  settings: settings,
  'settings-set': settingsSet,
  'tag-search': tagSearch,
  'field-values': fieldValues,
  visibility: visibility,
  delete: deleteApp,
  enable: enable,
  disable: disable,
  attach: attach,
  detach: detach,
  logs: logs,
  'requirement-errors': requirementErrors,
  'project-list': projectList,
  'project-info': projectInfo,
  'project-fields': projectFields,
  'project-apps': projectApps,
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
    field: optionalArgString(args.field),
    cwd: process.cwd(),
  };

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
  const commandArg = getCommandArg(option, args._.slice(1));
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
    console.log(i18n('Manage, configure, and debug YouTrack apps/workflows from an external development environment.'));
    console.log(i18n('Configure YOUTRACK_HOST and YOUTRACK_API_TOKEN, or pass --host and --token to each command.'));
    br();

    printSection(i18n('Common options'));
    printLine(i18n('--host <url>'), i18n('YouTrack instance URL. Overrides YOUTRACK_HOST.'));
    printLine(i18n('--token <token>'), i18n('Permanent token. Overrides YOUTRACK_API_TOKEN.'));
    printLine(i18n('--json'), i18n('Print machine-readable JSON for commands that support it.'));
    printLine(i18n('--yaml'), i18n('Print YAML for commands that support it.'));
    printLine(i18n('--skip N'), i18n('Choose how many results to skip in commands that support paging.'));
    printLine(i18n('--limit N'), i18n('Choose how many results to request in commands that support paging.'));
    br();

    printSection(i18n('General commands'));
    printCommand(i18n('version'), {
      does: i18n('Prints the CLI version.'),
    });
    br();

    printSection(i18n('App lifecycle'));
    printCommand(i18n('upload <directory> [--open]'), {
      does: i18n('Uploads a local app package to the YouTrack instance.'),
      args: [
        i18n('<directory> is a local app directory or built package directory, usually dist.'),
        i18n('--open opens app settings after upload.'),
      ],
    });
    printCommand(i18n('download <app> [--output DIR] [--overwrite]'), {
      does: i18n('Downloads an app package from the YouTrack instance and extracts it locally.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--output DIR selects the local destination.'),
        i18n('--overwrite replaces files in the destination directory.'),
      ],
    });
    printCommand(i18n('validate [directory] [--manifest FILE] [--schema FILE]'), {
      does: i18n('Validates local app manifest files against the YouTrack app JSON schema without connecting to YouTrack.'),
      args: [
        i18n('[directory] is a local app directory.'),
        i18n('--manifest FILE validates a manifest file directly or overrides the default manifest file.'),
        i18n('--schema FILE overrides the default schema file.'),
      ],
    });
    printCommand(i18n('enable <app> [--project <short-name>]'), {
      does: i18n('Enables an installed app globally in the YouTrack instance, or enables its usage for one project.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--project <short-name> is a project short name such as DEMO or JT.'),
      ],
    });
    printCommand(i18n('disable <app> [--project <short-name>]'), {
      does: i18n('Disables an installed app globally in the YouTrack instance, or disables its usage for one project.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--project <short-name> is a project short name such as DEMO or JT.'),
      ],
    });
    printCommand(i18n('attach <app> --project <short-name>'), {
      does: i18n('Attaches an installed app to a project in the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--project <short-name> is the project key, for example DEMO or JT.'),
      ],
    });
    printCommand(i18n('detach <app> --project <short-name>'), {
      does: i18n('Detaches an installed app from a project in the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--project <short-name> is the project key to remove from app usages.'),
      ],
    });
    br();

    printSection(i18n('App details and configuration'));
    printCommand(i18n('list [--skip N] [--limit N]'), {
      does: i18n('Lists installed apps visible to the token.'),
    });
    printCommand(i18n('info <app>'), {
      does: i18n('Shows bounded app metadata and file keys for one installed app in the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name.'),
      ],
    });
    printCommand(i18n('scripts <app> <file-key>'), {
      does: i18n('Shows one manifest, settings, entity extension, or script file from an installed app in the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('<file-key> is listed by info. Use manifest, settings, entityExtensions, or a script ID.'),
      ],
    });
    printCommand(i18n('usages <app> [--skip N] [--limit N]'), {
      does: i18n('Lists project usage records for one installed app, including nested requirement problems.'),
      args: [
        i18n('<app> is an app ID or package name.'),
      ],
    });
    printCommand(i18n('settings <app> [--project <short-name>]'), {
      does: i18n('Reads global app settings or project-scoped settings from the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--project <short-name> is a project short name.'),
      ],
    });
    printCommand(i18n('settings-set <app> [--project <short-name>] [--settings JSON] [--enabled true|false]'), {
      does: i18n('Updates app settings and/or enabled state in the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--project <short-name> writes project settings instead of global settings.'),
        i18n('--settings JSON is a JSON object string.'),
        i18n('--enabled true|false updates the enabled state.'),
      ],
    });
    printCommand(i18n('logs <app> [script] [--skip N] [--limit N]'), {
      does: i18n('Shows recent app-level log entries, or paged log entries for one script, module, or workflow rule.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('[script] is a script, module, rule ID, rule name, or rule title.'),
      ],
    });
    printCommand(i18n('requirement-errors <app>'), {
      does: i18n('Shows broken requirement problems reported by app usages in the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name.'),
      ],
    });
    printCommand(i18n('visibility <app> [--project <short-name>]'), {
      does: i18n('Shows read-only global or project visibility settings for one app.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--project <short-name> reads project-scoped app visibility.'),
      ],
    });
    br();

    printSection(i18n('Instance exploration'));
    printCommand(i18n('project-list [--skip N] [--limit N]'), {
      does: i18n('Lists projects in the YouTrack instance with short names and IDs for later project-scoped commands.'),
    });
    printCommand(i18n('project-info <project> [--skip N] [--limit N]'), {
      does: i18n('Shows identifying details for one project in the YouTrack instance.'),
      args: [
        i18n('<project> is an exact project ID or short name/key.'),
      ],
    });
    printCommand(i18n('project-fields <project> [--skip N] [--limit N]'), {
      does: i18n('Returns the full issue fields JSON schema for one project in the YouTrack instance, including required fields and allowed values when available.'),
      args: [
        i18n('<project> is an exact project ID or short name/key.'),
      ],
    });
    printCommand(i18n('project-apps <project> [--skip N] [--limit N]'), {
      does: i18n('Lists apps attached to one project in the YouTrack instance.'),
      args: [
        i18n('<project> is an exact project ID or short name/key.'),
      ],
    });
    printCommand(i18n('tag-search <query> [--project <short-name>] [--skip N] [--limit N]'), {
      does: i18n('Searches visible usable tags in the YouTrack instance, optionally narrowed to tags relevant for one project.'),
      args: [
        i18n('<query> is tag name text.'),
        i18n('--project <short-name> narrows tags to one project.'),
      ],
    });
    printCommand(i18n('field-values <query> --project <short-name> --field <field> [--skip N] [--limit N]'), {
      does: i18n('Searches values for one project custom field.'),
      args: [
        i18n('<query> is value text.'),
        i18n('--project <short-name> selects the project.'),
        i18n('--field <field> is a field ID or name.'),
      ],
    });
    printCommand(i18n('group-list [query] [--skip N] [--limit N]'), {
      does: i18n('Searches user groups and project teams in the YouTrack instance with IDs.'),
      args: [
        i18n('[query] is an optional group search filter. When omitted, all visible groups are listed.'),
      ],
    });
    printCommand(i18n('group-members [group] [--skip N] [--limit N]'), {
      does: i18n('Shows direct members of one user group or project team, or direct members for all paged groups when omitted.'),
      args: [
        i18n('[group] is an optional exact group ID or name.'),
      ],
    });
    printCommand(i18n('user-list [query] [--skip N] [--limit N]'), {
      does: i18n('Searches users in the YouTrack instance with login, ID, and display name.'),
      args: [
        i18n('[query] is an optional user search filter. When omitted, all visible users are listed.'),
      ],
    });
    printCommand(i18n('user-info <user> [--skip N] [--limit N]'), {
      does: i18n('Shows profile details for one user in the YouTrack instance, including email, guest state, and user type when visible.'),
      args: [
        i18n('<user> is an exact user ID, login, username, or full name.'),
      ],
    });
    br();

    printSection(i18n('Dangerous commands'));
    printCommand(i18n('delete <app> [--yes]'), {
      does: i18n('Danger: permanently deletes the installed app and everything app-related from the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name. Titles are not accepted.'),
        i18n('--yes skips the confirmation prompt.'),
      ],
    });

    function br() {
      console.log('');
    }

    function printSection(title: string) {
      console.log(title + ':');
    }

    function printCommand(command: string, details: {does: string; args?: string[]}) {
      console.log('  ' + command);
      printDetail(i18n('Does'), details.does);
      if (details.args?.length) {
        printDetailLines(i18n('Args'), details.args);
      }
    }

    function printDetail(label: string, value: string) {
      console.log('    ' + label + ': ' + value);
    }

    function printDetailLines(label: string, values: string[]) {
      console.log('    ' + label + ':');
      values.forEach(value => console.log('      ' + value));
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

  function getCommandArg(option: string | number, values: unknown[]): string | undefined {
    if (!shouldJoinCommandArg(option)) {
      return values[0]?.toString();
    }

    const joined = values.join(' ');
    return joined || undefined;
  }

  function shouldJoinCommandArg(option: string | number): boolean {
    return [
      'download',
      'list',
      'info',
      'scripts',
      'usages',
      'settings',
      'settings-set',
      'tag-search',
      'field-values',
      'visibility',
      'group-list',
      'group-members',
      'user-list',
      'delete',
      'enable',
      'disable',
      'attach',
      'detach',
      'logs',
      'requirement-errors',
      'project-apps',
    ].includes(option.toString());
  }

  function isCommand(option: string | number | undefined): option is keyof typeof options {
    return option !== undefined && Object.hasOwn(options, option);
  }
}
