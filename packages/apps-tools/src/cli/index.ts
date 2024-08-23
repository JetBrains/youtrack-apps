import {i18n} from '../../lib/i18n/i18n';
import {exit} from '../../lib/cli/exit';
import {parse} from '../../lib/cli/parseargv';
import {Config} from '../../@types/types';
import {list} from './list';
import {download} from './download';
import {upload} from './upload';

const options = {
  list: list,
  download: download,
  upload: upload,
} as const;

export function run(argv = process.argv) {
  const args = parse(argv);
  const config: Config = {
    host: args.host || null,
    token: args.token || null,
    output: args.output || null,
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
      checkRequiredParams(['host'], args, () => {
        const executable = options[option];
        executable(config, args._.slice(1)[0]);
      });
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
    printLine(i18n('list     --host [--token]     '), i18n('View a list of installed apps'));
    printLine(i18n('download <app> [--output]     '), i18n('Download an app'));
    printLine(i18n('upload   <directory>          '), i18n('Upload app to server'));
    br();

    function br() {
      console.log('');
    }

    function printLine(option: string, description: string) {
      console.log('    ' + option + '   ' + description);
    }
  }

  function checkRequiredParams(required: string[], args: Record<string, string>, fn: () => void): void {
    function allParamsProvided(params: string[], args: Record<string, string>): boolean {
      return params.every(param => {
        if (!args.hasOwnProperty(param) || !args[param]) {
          exit(new Error(i18n('Option "--' + param + '" is required')));
          return false;
        }
        return true;
      });
    }

    if (allParamsProvided(required, args)) fn();
  }

  function printVersion() {
    console.log(require('../../package.json').version);
  }
}
