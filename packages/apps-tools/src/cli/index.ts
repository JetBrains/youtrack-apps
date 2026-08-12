import pkg from '../../package.json' with { type: 'json' };
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
import {restRequest} from './commands/rest.js';

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
    (config, argument) => scripts(config, argument as Parameters<typeof scripts>[1]),
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
    (config, argument) => logs(config, argument as Parameters<typeof logs>[1]),
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
    (config, argument) => restRequest(config, argument as Parameters<typeof restRequest>[1]),
    {argument: args => ({path: optionalArgString(args.path) ?? undefined, method: optionalArgString(args.method) ?? undefined, body: optionalArgString(args.body) ?? undefined, header: args.header as string | string[] | undefined}), flags: ['path', 'method', 'body', 'header', 'yes'], required: ['path']},
  ),
} satisfies Record<string, Command>;

export const registeredCommandNames = Object.freeze(Object.keys(commands));

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
    exit(new Error(`"${args._[0]}" is now "${legacyCommand}"`), ExitCode.Usage);
    return;
  }

  if (args._.length !== 2) {
    exit(new Error('Expected command syntax: youtrack-app <entity> <action> [options]'), ExitCode.Usage);
    return;
  }

  const commandKey = `${args._[0]}:${args._[1]}`;
  if (!isCommand(commandKey)) {
    exit(new Error(`Unknown command "${args._[0]} ${args._[1]}"`), ExitCode.Usage);
    return;
  }

  const selectedCommand = commands[commandKey];
  const validationError = validateCommandOptions(commandKey, selectedCommand, args, getShortFlags(argv));
  if (validationError) {
    exit(new Error(validationError), ExitCode.Usage);
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
    console.log('youtrack-app <entity> <action> [options]');
    br();
    console.log('Manage, configure, and debug YouTrack apps and workflows from an external development environment.');
    console.log('Set YOUTRACK_HOST and YOUTRACK_API_TOKEN, or provide --host and --token with each command.');
    br();

    printSection('Common options');
    printLine('--host <url>', 'YouTrack URL. Overrides YOUTRACK_HOST.');
    printLine('--token <token>', 'Permanent token. Overrides YOUTRACK_API_TOKEN.');
    printLine('--json', 'Output results as machine-readable JSON, when supported.');
    printLine('--yaml, --yml', 'Output results as machine-readable YAML, when supported.');
    printLine('--help, -h', 'Show help information.');
    printLine('--version', 'Show the CLI version.');
    br();

    printSection('App lifecycle');
    printCommand('app upload [--directory DIR] [--open]', {
      description: 'Uploads an app package from the local filesystem to YouTrack.',
      args: [
        '--directory DIR is a local app directory or built package directory. Defaults to dist.',
        '--open opens app settings after upload.',
      ],
    });
    printCommand('app download --app <app> [--output DIR] [--overwrite]', {
      description: 'Downloads an app package from YouTrack and extracts it locally.',
      args: [
        '<app> is an app ID or package name.',
        '--output DIR selects the local destination. Defaults to the current working directory.',
        '--overwrite replaces files in the destination directory.',
      ],
    });
    printCommand('app validate [--directory DIR] [--manifest FILE] [--schema FILE]', {
      description: 'Validates local app manifest files against the YouTrack app JSON schema without connecting to YouTrack.',
      args: [
        '--directory DIR is a local app directory. Defaults to dist.',
        '--manifest FILE validates a manifest file directly or overrides the default manifest file.',
        '--schema FILE overrides the default schema file.',
      ],
    });
    printCommand('app enable --app <app> [--project <key>]', {
      description: 'Enables an installed app globally or for a specific project.',
      args: [
        '<app> is an app ID or package name.',
        '--project <key> is a project short name such as DEMO or JT.',
      ],
    });
    printCommand('app disable --app <app> [--project <key>]', {
      description: 'Disables an installed app globally in YouTrack, or disables its usage for one project.',
      args: [
        '<app> is an app ID or package name.',
        '--project <key> is a project short name such as DEMO or JT.',
      ],
    });
    printCommand('app attach --app <app> --project <key>', {
      description: 'Attaches an installed app to a project in YouTrack.',
      args: [
        '<app> is an app ID or package name.',
        '--project <key> is the project key, for example DEMO or JT.',
      ],
    });
    printCommand('app detach --app <app> --project <key>', {
      description: 'Detaches an installed app from a project in YouTrack.',
      args: [
        '<app> is an app ID or package name.',
        '--project <key> is the project key to remove from app usages.',
      ],
    });
    br();

    printSection('App details and configuration');
    printCommand('app list [--skip N] [--limit N]', {
      description: 'Lists installed apps visible to the token.',
    });
    printCommand('app info --app <app>', {
      description: 'Shows app metadata and file keys for an installed app.',
      args: [
        '<app> is an app ID or package name.',
      ],
    });
    printCommand('app scripts --app <app> --file-key <file-key>', {
      description: 'Shows one manifest, settings, entity extension, or script file from an installed app in YouTrack.',
      args: [
        '<app> is an app ID or package name.',
        '<file-key> is listed by info. Use manifest, settings, entityExtensions, or a script ID.',
      ],
    });
    printCommand('app usages --app <app> [--skip N] [--limit N]', {
      description: 'Lists the projects that use the app and shows any requirement problems nested under each project.',
      args: [
        '<app> is an app ID or package name.',
      ],
    });
    printCommand('app settings --app <app> [--project <key>]', {
      description: 'Reads global app settings or project-scoped settings from YouTrack.',
      args: [
        '<app> is an app ID or package name.',
        '--project <key> is a project short name.',
      ],
    });
    printCommand('app settings-set --app <app> [--project <key>] [--settings JSON] [--enabled true|false]', {
      description: 'Updates app settings, changes whether the app is enabled, or both.',
      args: [
        '<app> is an app ID or package name.',
        '--project <key> writes project settings instead of global settings.',
        '--settings JSON is a JSON object string.',
        '--enabled true|false updates the enabled state.',
      ],
    });
    printCommand('app logs --app <app> [--limit N]', {
      description: 'Shows recent app-level log entries.',
      args: [
        '<app> is an app ID or package name.',
        '--limit N limits app log entries.',
      ],
    });
    printCommand('app logs --app <app> --script <script> [--skip N] [--limit N]', {
      description: 'Shows paged log entries for one script, module, or workflow rule.',
      args: [
        '<app> is an app ID or package name.',
        '--script <script> is a script, module, rule ID, rule name, or rule title.',
        '--skip N specifies the number of entries to skip.',
        '--limit N chooses the page size.',
      ],
    });
    printCommand('app requirement-errors --app <app>', {
      description: 'Shows requirement errors reported by app usages in YouTrack.',
      args: [
        '<app> is an app ID or package name.',
      ],
    });
    printCommand('app visibility --app <app> [--project <key>]', {
      description: 'Shows global or project visibility settings for an app.',
      args: [
        '<app> is an app ID or package name.',
        '--project <key> reads project-scoped app visibility.',
      ],
    });
    br();

    printSection('YouTrack Exploration');
    printCommand('project list [--skip N] [--limit N]', {
      description: 'Lists projects in YouTrack with short names and IDs for later project-scoped commands.',
    });
    printCommand('project info --project <project>', {
      description: 'Shows details for one project in YouTrack.',
      args: [
        '<project> is an exact project ID or short name/key.',
      ],
    });
    printCommand('project fields --project <project>', {
      description: 'Returns the full issue fields JSON schema for one project in YouTrack, including required fields and allowed values when available.',
      args: [
        '<project> is an exact project ID or short name/key.',
      ],
    });
    printCommand('project apps --project <project> [--skip N] [--limit N]', {
      description: 'Lists apps attached to one project in YouTrack.',
      args: [
        '<project> is an exact project ID or short name/key.',
      ],
    });
    printCommand('tag search [--query <query>] [--project <key>] [--skip N] [--limit N]', {
      description: 'Searches available tags in YouTrack, optionally narrowed to tags relevant for one project.',
      args: [
        '--query <query> is optional tag name text.',
        '--project <key> narrows tags to one project.',
      ],
    });
    printCommand('field values --project <key> --field <field> [--query <query>] [--skip N] [--limit N]', {
      description: 'Searches and paginates actual custom-field values for a project. Use it instead of "project fields" when a field has more values than the schema lists.',
      args: [
        '--query <query> is optional value text.',
        '--project <key> selects the project.',
        '--field <field> is a field ID or name.',
      ],
    });
    printCommand('group list [--query <query>] [--skip N] [--limit N]', {
      description: 'Searches user groups and project teams in YouTrack with IDs.',
      args: [
        '--query <query> is an optional group search filter. When omitted, all visible groups are listed.',
      ],
    });
    printCommand('group members [--group <group>] [--skip N] [--limit N]', {
      description: 'Lists the direct members of a user group or project team. If you omit --group, the command lists members for all groups in the requested page.',
      args: [
        '--group <group> is an optional exact group ID or name.',
        '--skip N and --limit N apply when --group is omitted.',
      ],
    });
    printCommand('user list [--query <query>] [--skip N] [--limit N]', {
      description: 'Searches users in YouTrack with login, ID, and display name.',
      args: [
        '--query <query> is an optional user search filter. When omitted, all visible users are listed.',
      ],
    });
    printCommand('user info --user <user>', {
      description: 'Shows profile details for one user in YouTrack, including email, guest status, and user type when visible.',
      args: [
        '<user> is an exact user ID, login, username, or full name.',
      ],
    });
    br();

    printSection('Raw REST API');
    printCommand('rest request --path <path> [--method METHOD] [--body JSON] [--header name:value] [--yes]', {
      description: 'Makes an authenticated request to a relative path on the configured YouTrack host.',
      args: [
        '--path <path> is a relative REST path, including any query string.',
        '--method defaults to GET. Supported methods are GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS.',
        '--yes is required for DELETE requests.',
        '--body JSON sends a JSON request body.',
        '--header name:value adds a request header and may be repeated.',
        'See https://www.jetbrains.com/help/youtrack/devportal/rest-api-reference.html for available paths and payloads.',
      ],
    });
    br();

    printSection('Dangerous commands');
    printCommand('app delete --app <app> [--yes]', {
      description: 'Danger: Permanently deletes the installed app and all associated data from YouTrack.',
      args: [
        '<app> is an app ID or package name. Titles are not accepted.',
        '--yes skips the confirmation prompt.',
      ],
    });

    function br() {
      console.log('');
    }

    function printSection(title: string) {
      console.log(title + ':');
    }

    function printCommand(command: string, details: {description: string; args?: string[]}) {
      console.log('  ' + command);
      console.log('    ' + details.description);
      if (details.args?.length) {
        printDetailLines('Options', details.args);
      }
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
            exit(new Error(`Token is required. Please create one at ${createTokenUrl}`), ExitCode.Authentication);
          } else {
            exit(new Error('Option "--' + param + '" is required'), ExitCode.Usage);
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

function validateCommandOptions(commandKey: string, selectedCommand: Command, args: Record<string, unknown>, shortFlags: Set<string> = new Set()): string | null {
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
