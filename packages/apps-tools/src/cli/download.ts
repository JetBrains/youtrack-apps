import fs from 'fs';
import {exit} from '../../lib/cli/exit';
import {resolve} from '../../lib/net/resolve';
import {tmpDir} from '../../lib/fs/tmpdir';
import {unzip} from '../../lib/fs/unzip';
import {request} from '../../lib/net/request';
import {i18n} from '../../lib/i18n/i18n';
import {HttpMessage} from '../../lib/net/httpmessage';

export function download(config: any, appName?: string) {
  if (!appName) {
    exit(new Error(i18n('App name should be defined')));
    return;
  }
  appName = appName.toString();
  let message = HttpMessage(resolve(config.host, '/api/admin/apps/' + appName.replace(/^@/, '')));
  const options = {
    headers: {
      Accept: 'application/zip',
    },
  };

  if (config.token) {
    const signHeaders = HttpMessage.sign(config.token);
    options.headers = {...options.headers, ...signHeaders.headers};
  }

  const req = request(message, options, downloadError => {
    if (downloadError) exit(downloadError);
  });

  req.on('response', response => {
    const zip = fs.createWriteStream(tmpDir(getZipName(appName)));
    const output = config.output || config.cwd;

    response.pipe(zip).on('close', () => {
      unzip(zip.path.toString(), require('path').resolve(output, appName), error => {
        if (error) return exit(error);

        console.log(i18n(`File extracted into '${output}'`));
      });
    });
  });

  return req;

  function getZipName(appName: string): string {
    return 'youtrack-app-' + appName.split('/').pop() + '.zip';
  }
}
