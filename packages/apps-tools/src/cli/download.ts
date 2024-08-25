import fs from 'fs';
import {exit} from '../../lib/cli/exit';
import {resolve} from '../../lib/net/resolve';
import {tmpDir} from '../../lib/fs/tmpdir';
import {unzip} from '../../lib/fs/unzip';
import {request} from '../../lib/net/request';
import {i18n} from '../../lib/i18n/i18n';
import {HttpMessage} from '../../lib/net/httpmessage';
import {Config} from '../../@types/types';
import path from 'path';
import {IncomingMessage} from 'http';

export async function download(config: Config, appName?: string) {
  if (!appName) {
    exit(new Error(i18n('App name should be defined')));
    return;
  }
  appName = appName.toString();
  const message = HttpMessage(resolve(config.host, '/api/admin/apps/' + appName.replace(/^@/, '')));
  const options = {
    headers: {
      Accept: 'application/zip',
    },
  };

  if (config.token) {
    const signHeaders = HttpMessage.sign(config.token);
    options.headers = {...options.headers, ...signHeaders.headers};
  }

  try {
    await request(message, options, response => unzipCallback(response, appName));
  } catch (error) {
    exit(error);
  }

  function getZipName(appName: string): string {
    return 'youtrack-app-' + appName.split('/').pop() + '.zip';
  }

  function unzipCallback(response: IncomingMessage, appName: string) {
    const zip = fs.createWriteStream(tmpDir(getZipName(appName)));
    const output = config.output || config.cwd;
    const shouldOverwrite = config.overwrite !== null;

    if (shouldOverwrite) {
      const existingPath = path.resolve(output, appName);
      fs.rmSync(existingPath, {recursive: true, force: true});
    }

    response.pipe(zip).on('close', async () => {
      try {
        await unzip(zip.path.toString(), path.resolve(output, appName));
        if (!shouldOverwrite) {
          console.log(i18n(`File extracted into '${output}'`));
        } else {
          console.log(i18n(`File extracted into '${output}' and existing files are overwritten`));
        }
      } catch (error) {
        exit(error);
      }
    });
  }
}
