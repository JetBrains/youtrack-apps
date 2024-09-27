import {i18n} from '../../lib/i18n/i18n';
import {exit} from '../../lib/cli/exit';
import {parse} from '../../lib/cli/parseargv';
import {Config, RequiredParams} from '../../@types/types';
import {list} from './list';
import {download} from './download';
import {upload} from './upload';
import {resolve} from '../../lib/net/resolve';
import {validate} from './validate';

const options = {
  list: list,
  download: download,
  upload: upload,
  validate: validate,
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
      await checkRequiredParams(['host', 'token'], args, async () => {
        const executable = options[option];
        await executable(config, args._.slice(1)[0]);
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
    printLine(i18n('list     --host --token                      '), i18n('View a list of installed apps'));
    printLine(i18n('download <app> [--output, --overwrite]       '), i18n('Download an app'));
    printLine(i18n('upload   <directory>                         '), i18n('Upload app to server'));
    printLine(i18n('validate <directory> [--manifest, --schema]  '), i18n('Validate manifest'));
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
    args: Record<string, string>,
    fn: () => Promise<void>,
  ): Promise<void> {
    function allParamsProvided(params: RequiredParams[], args: Record<string, string>): boolean {
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
    console.log(require('../../package.json').version);
  }
}
