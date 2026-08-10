import pkg from '../../package.json' with { type: 'json' };
import {i18n} from '../../lib/i18n/i18n.js';
import {exit, ExitCode} from '../../lib/cli/exit.js';
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
import type {LogsArgs} from './commands/diagnostics.js';
import {projectFields, projectInfo, projectList} from './commands/projects.js';
import {projectApps} from './commands/project-apps.js';
import {groupList, groupMembers} from './commands/groups.js';
import {userInfo, userList} from './commands/users.js';
import {scripts} from './commands/scripts.js';
import type {ScriptsArgs} from './commands/scripts.js';
import {settings, settingsSet} from './commands/settings.js';
import {tagSearch} from './commands/tags.js';
import {usages} from './commands/usages.js';
import {fieldValues} from './commands/field-values.js';
import {visibility} from './commands/visibility.js';
import {restRequest} from './commands/rest.js';
import type {RawRestRequestArgs} from './commands/rest.js';

type Command<TArgument = unknown> = {
  execute: (config: Config, argument?: TArgument) => Promise<unknown>;
  argument?: (args: Record<string, unknown>) => TArgument | undefined;
  flags?: string[];
  required?: string[];
  requiresAuthentication?: boolean;
  supportsStructuredOutput?: boolean;
};

const LEGACY: Record<string, string> = {
  version: '--version',
  upload: 'app upload --directory <dir>',
  download: 'app download --app <app>',
  validate: 'app validate',
  list: 'app list',
  info: 'app info --app <app>',
  scripts: 'app scripts --app <app> --file-key <file-key>',
  usages: 'app usages --app <app>',
  settings: 'app settings --app <app>',
  'settings-set': 'app settings-set --app <app>',
  'tag-search': 'tag search --query <query>',
  'field-values': 'field values --query <query> --project <project> --field <field>',
  visibility: 'app visibility --app <app>',
  delete: 'app delete --app <app>',
  enable: 'app enable --app <app>',
  disable: 'app disable --app <app>',
  attach: 'app attach --app <app> --project <project>',
  detach: 'app detach --app <app> --project <project>',
  logs: 'app logs --app <app>',
  'requirement-errors': 'app requirement-errors --app <app>',
  'project-list': 'project list',
  'project-info': 'project info --project <project>',
  'project-fields': 'project fields --project <project>',
  'project-apps': 'project apps --project <project>',
  'group-list': 'group list',
  'group-members': 'group members --group <group>',
  'user-list': 'user list',
  'user-info': 'user info --user <user>',
};

const stringArg = (name: string, defaultValue?: string) => (args: Record<string, unknown>): string | undefined =>
  optionalArgString(args[name]) ?? defaultValue;

const commands = {
  'app:upload': command(upload, {argument: stringArg('directory', 'dist'), flags: ['directory', 'open'], supportsStructuredOutput: false}),
  'app:download': command(download, {argument: stringArg('app'), flags: ['app', 'output', 'overwrite'], required: ['app'], supportsStructuredOutput: false}),
  'app:validate': command(validate, {argument: stringArg('directory', 'dist'), flags: ['directory', 'manifest', 'schema'], requiresAuthentication: false, supportsStructuredOutput: false}),
  'app:list': command(list, {flags: ['skip', 'limit']}),
  'app:info': command(info, {argument: stringArg('app'), flags: ['app'], required: ['app']}),
  'app:scripts': command(
    (config, argument) => scripts(config, argument as ScriptsArgs),
    {argument: args => ({app: optionalArgString(args.app) ?? undefined, fileKey: optionalArgString(args['file-key']) ?? undefined}), flags: ['app', 'file-key'], required: ['app', 'file-key'], supportsStructuredOutput: false}
  ),
  'app:usages': command(usages, {argument: stringArg('app'), flags: ['app', 'skip', 'limit'], required: ['app']}),
  'app:settings': command(settings, {argument: stringArg('app'), flags: ['app', 'project'], required: ['app']}),
  'app:settings-set': command(settingsSet, {argument: stringArg('app'), flags: ['app', 'project', 'settings', 'enabled'], required: ['app'], supportsStructuredOutput: false}),
  'app:visibility': command(visibility, {argument: stringArg('app'), flags: ['app', 'project'], required: ['app']}),
  'app:enable': command(enable, {argument: stringArg('app'), flags: ['app', 'project'], required: ['app'], supportsStructuredOutput: false}),
  'app:disable': command(disable, {argument: stringArg('app'), flags: ['app', 'project'], required: ['app'], supportsStructuredOutput: false}),
  'app:attach': command(attach, {argument: stringArg('app'), flags: ['app', 'project'], required: ['app', 'project'], supportsStructuredOutput: false}),
  'app:detach': command(detach, {argument: stringArg('app'), flags: ['app', 'project'], required: ['app', 'project'], supportsStructuredOutput: false}),
  'app:logs': command(
    (config, argument) => logs(config, argument as LogsArgs),
    {argument: args => ({app: optionalArgString(args.app) ?? undefined, script: optionalArgString(args.script) ?? undefined}), flags: ['app', 'script', 'skip', 'limit'], required: ['app']}
  ),
  'app:requirement-errors': command(requirementErrors, {argument: stringArg('app'), flags: ['app'], required: ['app']}),
  'app:delete': command(deleteApp, {argument: stringArg('app'), flags: ['app', 'yes'], required: ['app']}),
  'project:list': command(projectList, {flags: ['skip', 'limit']}),
  'project:info': command(projectInfo, {argument: stringArg('project'), flags: ['project'], required: ['project']}),
  'project:fields': command(projectFields, {argument: stringArg('project'), flags: ['project'], required: ['project']}),
  'project:apps': command(projectApps, {argument: stringArg('project'), flags: ['project', 'skip', 'limit'], required: ['project']}),
  'tag:search': command(tagSearch, {argument: stringArg('query'), flags: ['query', 'project', 'skip', 'limit']}),
  'field:values': command(fieldValues, {argument: stringArg('query'), flags: ['query', 'project', 'field', 'skip', 'limit'], required: ['project', 'field']}),
  'group:list': command(groupList, {argument: stringArg('query'), flags: ['query', 'skip', 'limit']}),
  'group:members': command(groupMembers, {argument: stringArg('group'), flags: ['group', 'skip', 'limit']}),
  'user:list': command(userList, {argument: stringArg('query'), flags: ['query', 'skip', 'limit']}),
  'user:info': command(userInfo, {argument: stringArg('user'), flags: ['user'], required: ['user']}),
  'rest:request': command(
    (config, argument) => restRequest(config, argument as RawRestRequestArgs),
    {argument: args => ({path: optionalArgString(args.path) ?? undefined, method: optionalArgString(args.method) ?? undefined, body: optionalArgString(args.body) ?? undefined, header: args.header as string | string[] | undefined}), flags: ['path', 'method', 'body', 'header', 'yes'], required: ['path']},
  ),
} satisfies Record<string, Command>;

function command<TArgument>(execute: Command<TArgument>['execute'], options: Omit<Command<TArgument>, 'execute'> = {}): Command {
  return {
    execute: execute as Command['execute'],
    requiresAuthentication: true,
    ...options,
    argument: options.argument as Command['argument'],
  };
}

function optionalArgString(value: unknown): string | null {
  return value === undefined || value === null || value === false || value === true ? null : value.toString();
}

export async function run(argv = process.argv) {
  const args = parse(argv);

  if (isFlagEnabled(args.version)) {
    printVersion();
    return;
  }

  if (isFlagEnabled(args.help) || isFlagEnabled(args.h) || args._.length === 0) {
    printHelp();
    return;
  }

  const legacyCommand = LEGACY[args._[0]];
  if (legacyCommand) {
    exit(new Error(i18n(`"${args._[0]}" is now "${legacyCommand}"`)), ExitCode.Usage);
    return;
  }

  if (args._.length !== 2) {
    exit(new Error(i18n('Expected command syntax: youtrack-app <entity> <action> [options]')), ExitCode.Usage);
    return;
  }

  const commandKey = `${args._[0]}:${args._[1]}`;
  if (!isCommand(commandKey)) {
    exit(new Error(i18n(`Unknown command "${args._[0]} ${args._[1]}"`)), ExitCode.Usage);
    return;
  }

  const selectedCommand = commands[commandKey];
  const validationError = validateCommandArgs(commandKey, selectedCommand, args, getShortFlags(argv));
  if (validationError) {
    exit(new Error(i18n(validationError)), ExitCode.Usage);
    return;
  }

  const {YOUTRACK_HOST, YOUTRACK_API_TOKEN} = process.env;
  const config: Config = {
    host: args.host || YOUTRACK_HOST || null,
    token: args.token || YOUTRACK_API_TOKEN || null,
    output: args.output || (commandKey === 'app:download' ? process.cwd() : null),
    overwrite: isFlagEnabled(args.overwrite) ? 'true' : null,
    manifest: args.manifest || null,
    schema: args.schema || null,
    open: isFlagEnabled(args.open) ? 'true' : null,
    json: isFlagEnabled(args.json),
    yaml: isFlagEnabled(args.yaml) || isFlagEnabled(args.yml),
    confirmDestructiveAction: isFlagEnabled(args.yes),
    project: args.project || null,
    skip: optionalArgString(args.skip),
    limit: optionalArgString(args.limit),
    settings: optionalArgString(args.settings),
    enabled: optionalArgString(args.enabled),
    field: optionalArgString(args.field),
    cwd: process.cwd(),
  };

  const commandArg = selectedCommand.argument?.(args);
  if (!selectedCommand.requiresAuthentication) {
    await selectedCommand.execute(config, commandArg);
    return;
  }

  await checkRequiredParams(['host', 'token'], args, async () => {
    await selectedCommand.execute(config, commandArg);
  });

  function printHelp() {
    br();
    console.log(i18n('youtrack-app <entity> <action> [options]'));
    br();
    console.log(i18n('Manage, configure, and debug YouTrack apps/workflows from an external development environment.'));
    console.log(i18n('Configure YOUTRACK_HOST and YOUTRACK_API_TOKEN, or pass --host and --token to each command.'));
    br();

    printSection(i18n('Common options'));
    printLine(i18n('--host <url>'), i18n('YouTrack instance URL. Overrides YOUTRACK_HOST.'));
    printLine(i18n('--token <token>'), i18n('Permanent token. Overrides YOUTRACK_API_TOKEN.'));
    printLine(i18n('--json'), i18n('Print machine-readable JSON for supported commands.'));
    printLine(i18n('--yaml, --yml'), i18n('Print machine-readable YAML for supported commands.'));
    printLine(i18n('--help, -h'), i18n('Show help.'));
    printLine(i18n('--version'), i18n('Print the CLI version.'));
    br();

    printSection(i18n('App lifecycle'));
    printCommand(i18n('app upload [--directory DIR] [--open]'), {
      does: i18n('Uploads a local app package to the YouTrack instance.'),
      args: [
        i18n('--directory DIR is a local app directory or built package directory. Defaults to dist.'),
        i18n('--open opens app settings after upload.'),
      ],
    });
    printCommand(i18n('app download --app <app> [--output DIR] [--overwrite]'), {
      does: i18n('Downloads an app package from the YouTrack instance and extracts it locally.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--output DIR selects the local destination. Defaults to the current working directory.'),
        i18n('--overwrite replaces files in the destination directory.'),
      ],
    });
    printCommand(i18n('app validate [--directory DIR] [--manifest FILE] [--schema FILE]'), {
      does: i18n('Validates local app manifest files against the YouTrack app JSON schema without connecting to YouTrack.'),
      args: [
        i18n('--directory DIR is a local app directory. Defaults to dist.'),
        i18n('--manifest FILE validates a manifest file directly or overrides the default manifest file.'),
        i18n('--schema FILE overrides the default schema file.'),
      ],
    });
    printCommand(i18n('app enable --app <app> [--project <short-name>]'), {
      does: i18n('Enables an installed app globally in the YouTrack instance, or enables its usage for one project.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--project <short-name> is a project short name such as DEMO or JT.'),
      ],
    });
    printCommand(i18n('app disable --app <app> [--project <short-name>]'), {
      does: i18n('Disables an installed app globally in the YouTrack instance, or disables its usage for one project.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--project <short-name> is a project short name such as DEMO or JT.'),
      ],
    });
    printCommand(i18n('app attach --app <app> --project <short-name>'), {
      does: i18n('Attaches an installed app to a project in the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--project <short-name> is the project key, for example DEMO or JT.'),
      ],
    });
    printCommand(i18n('app detach --app <app> --project <short-name>'), {
      does: i18n('Detaches an installed app from a project in the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--project <short-name> is the project key to remove from app usages.'),
      ],
    });
    br();

    printSection(i18n('App details and configuration'));
    printCommand(i18n('app list [--skip N] [--limit N]'), {
      does: i18n('Lists installed apps visible to the token.'),
    });
    printCommand(i18n('app info --app <app>'), {
      does: i18n('Shows bounded app metadata and file keys for one installed app in the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name.'),
      ],
    });
    printCommand(i18n('app scripts --app <app> --file-key <file-key>'), {
      does: i18n('Shows one manifest, settings, entity extension, or script file from an installed app in the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('<file-key> is listed by info. Use manifest, settings, entityExtensions, or a script ID.'),
      ],
    });
    printCommand(i18n('app usages --app <app> [--skip N] [--limit N]'), {
      does: i18n('Lists project usage records for one installed app, including nested requirement problems.'),
      args: [
        i18n('<app> is an app ID or package name.'),
      ],
    });
    printCommand(i18n('app settings --app <app> [--project <short-name>]'), {
      does: i18n('Reads global app settings or project-scoped settings from the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--project <short-name> is a project short name.'),
      ],
    });
    printCommand(i18n('app settings-set --app <app> [--project <short-name>] [--settings JSON] [--enabled true|false]'), {
      does: i18n('Updates app settings and/or enabled state in the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--project <short-name> writes project settings instead of global settings.'),
        i18n('--settings JSON is a JSON object string.'),
        i18n('--enabled true|false updates the enabled state.'),
      ],
    });
    printCommand(i18n('app logs --app <app> [--limit N]'), {
      does: i18n('Shows recent app-level log entries.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--limit N limits app log entries.'),
      ],
    });
    printCommand(i18n('app logs --app <app> --script <script> [--skip N] [--limit N]'), {
      does: i18n('Shows paged log entries for one script, module, or workflow rule.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--script <script> is a script, module, rule ID, rule name, or rule title.'),
        i18n('--skip N chooses the starting log entry.'),
        i18n('--limit N chooses the page size.'),
      ],
    });
    printCommand(i18n('app requirement-errors --app <app>'), {
      does: i18n('Shows broken requirement problems reported by app usages in the YouTrack instance.'),
      args: [
        i18n('<app> is an app ID or package name.'),
      ],
    });
    printCommand(i18n('app visibility --app <app> [--project <short-name>]'), {
      does: i18n('Shows read-only global or project visibility settings for one app.'),
      args: [
        i18n('<app> is an app ID or package name.'),
        i18n('--project <short-name> reads project-scoped app visibility.'),
      ],
    });
    br();

    printSection(i18n('Instance exploration'));
    printCommand(i18n('project list [--skip N] [--limit N]'), {
      does: i18n('Lists projects in the YouTrack instance with short names and IDs for later project-scoped commands.'),
    });
    printCommand(i18n('project info --project <project>'), {
      does: i18n('Shows identifying details for one project in the YouTrack instance.'),
      args: [
        i18n('<project> is an exact project ID or short name/key.'),
      ],
    });
    printCommand(i18n('project fields --project <project>'), {
      does: i18n('Returns the full issue fields JSON schema for one project in the YouTrack instance, including required fields and allowed values when available.'),
      args: [
        i18n('<project> is an exact project ID or short name/key.'),
      ],
    });
    printCommand(i18n('project apps --project <project> [--skip N] [--limit N]'), {
      does: i18n('Lists apps attached to one project in the YouTrack instance.'),
      args: [
        i18n('<project> is an exact project ID or short name/key.'),
      ],
    });
    printCommand(i18n('tag search [--query <query>] [--project <short-name>] [--skip N] [--limit N]'), {
      does: i18n('Searches visible usable tags in the YouTrack instance, optionally narrowed to tags relevant for one project.'),
      args: [
        i18n('--query <query> is optional tag name text.'),
        i18n('--project <short-name> narrows tags to one project.'),
      ],
    });
    printCommand(i18n('field values --project <short-name> --field <field> [--query <query>] [--skip N] [--limit N]'), {
      does: i18n('Searches values for one project custom field.'),
      args: [
        i18n('--query <query> is optional value text.'),
        i18n('--project <short-name> selects the project.'),
        i18n('--field <field> is a field ID or name.'),
      ],
    });
    printCommand(i18n('group list [--query <query>] [--skip N] [--limit N]'), {
      does: i18n('Searches user groups and project teams in the YouTrack instance with IDs.'),
      args: [
        i18n('--query <query> is an optional group search filter. When omitted, all visible groups are listed.'),
      ],
    });
    printCommand(i18n('group members [--group <group>] [--skip N] [--limit N]'), {
      does: i18n('Shows direct members of one user group or project team, or direct members for all paged groups when omitted.'),
      args: [
        i18n('--group <group> is an optional exact group ID or name.'),
        i18n('--skip N and --limit N apply when --group is omitted.'),
      ],
    });
    printCommand(i18n('user list [--query <query>] [--skip N] [--limit N]'), {
      does: i18n('Searches users in the YouTrack instance with login, ID, and display name.'),
      args: [
        i18n('--query <query> is an optional user search filter. When omitted, all visible users are listed.'),
      ],
    });
    printCommand(i18n('user info --user <user>'), {
      does: i18n('Shows profile details for one user in the YouTrack instance, including email, guest state, and user type when visible.'),
      args: [
        i18n('<user> is an exact user ID, login, username, or full name.'),
      ],
    });
    br();

    printSection(i18n('Raw REST API'));
    printCommand(i18n('rest request --path <path> [--method METHOD] [--body JSON] [--header name:value] [--yes]'), {
      does: i18n('Makes an authenticated request to a relative path on the configured YouTrack host.'),
      args: [
        i18n('--path <path> is a relative REST path, including any query string.'),
        i18n('--method defaults to GET. Supported methods are GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS.'),
        i18n('--yes is required for DELETE requests.'),
        i18n('--body JSON sends a JSON request body.'),
        i18n('--header name:value adds a request header and may be repeated.'),
        i18n('See https://www.jetbrains.com/help/youtrack/devportal/rest-api-reference.html for available paths and payloads.'),
      ],
    });
    br();

    printSection(i18n('Dangerous commands'));
    printCommand(i18n('app delete --app <app> [--yes]'), {
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
            exit(new Error(i18n(`Token is required. Please create one at ${createTokenUrl}`)), ExitCode.Authentication);
          } else {
            exit(new Error(i18n('Option "--' + param + '" is required')), ExitCode.Usage);
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

}

function getShortFlags(argv: string[]): Set<string> {
  return new Set(argv.slice(2).filter(argument => /^-[^-]/.test(argument)).flatMap(argument => argument.slice(1).split('')));
}

function validateCommandArgs(commandKey: string, selectedCommand: Command, args: Record<string, unknown>, shortFlags: Set<string> = new Set()): string | null {
  const commonFlags = ['host', 'token', 'json', 'yaml', 'yml', 'help', 'h', 'version'];
  const booleanFlags = new Set(['json', 'yaml', 'yml', 'help', 'h', 'version', 'open', 'overwrite', 'yes']);
  const allowedFlags = new Set([...commonFlags, ...(selectedCommand.flags ?? [])]);
  const unknownFlag = Object.keys(args).find(key => key !== '_' && !allowedFlags.has(key));
  if (unknownFlag) {
    return `Unknown option "${shortFlags.has(unknownFlag) ? '-' : '--'}${unknownFlag}"`;
  }

  if (commandKey === 'app:logs' && Object.hasOwn(args, 'skip') && !Object.hasOwn(args, 'script')) {
    return 'Option "--skip" is only supported with "--script"';
  }

  if (commandKey === 'group:members' && Object.hasOwn(args, 'group') && (Object.hasOwn(args, 'skip') || Object.hasOwn(args, 'limit'))) {
    return 'Options "--skip" and "--limit" are only supported when "--group" is omitted';
  }

  if (commandKey === 'rest:request' && Object.hasOwn(args, 'method')) {
    const method = optionalArgString(args.method)?.toUpperCase();
    if (!method || !['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(method)) {
      return 'Option "--method" must be one of GET, POST, PUT, PATCH, DELETE, HEAD, or OPTIONS';
    }
  }

  const valuelessFlag = Object.keys(args).find(key => key !== '_' && args[key] === true && !booleanFlags.has(key));
  if (valuelessFlag) {
    return `Option "--${valuelessFlag}" requires a value`;
  }

  if (selectedCommand.supportsStructuredOutput === false) {
    const unsupportedOutputFlag = ['json', 'yaml', 'yml'].find(flag => Object.hasOwn(args, flag));
    if (unsupportedOutputFlag) {
      return `Option "--${unsupportedOutputFlag}" is not supported for this command`;
    }
  }

  for (const flag of selectedCommand.required ?? []) {
    if (optionalArgString(args[flag]) === null) {
      return `Option "--${flag}" is required`;
    }
  }

  return null;
}

function isCommand(commandKey: string): commandKey is keyof typeof commands {
  return Object.hasOwn(commands, commandKey);
}
