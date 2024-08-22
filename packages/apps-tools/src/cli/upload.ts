import {ClientRequest} from 'http';
import fs from 'fs';
import path from 'path';
import {exit} from '../../lib/cli/exit';
import {resolveAppName} from './upload-utils';
import {i18n} from '../../lib/i18n/i18n';
import {zipFolder} from '../../lib/fs/zipfolder';
import {request} from '../../lib/net/request';
import {resolve} from '../../lib/net/resolve';
import {HttpMessage} from '../../lib/net/httpmessage';
import FormData from 'form-data';
import {tmpDir} from '../../lib/fs/tmpdir';
import {Config} from '../../@types/types';

export function upload(config: Config, appDir: string) {
  const appName = resolveAppName(appDir);

  if (!appName) {
    exit(new Error(i18n('Unexpected error')));
    return;
  }

  const zipPath = tmpDir(generateZipName(appDir));

  zipFolder(path.resolve(config.cwd, appDir), zipPath, error => {
    if (error) {
      return exit(error);
    }

    return updateApp();

    function updateApp(isCreate = false): ClientRequest {
      const form = new FormData();
      form.append('file', fs.createReadStream(zipPath), {
        filename: appName + '.zip',
      });

      let message = HttpMessage(resolve(config.host, '/api/admin/apps/import'));
      const options = {
        method: 'POST',
        headers: form.getHeaders(),
      };

      if (config.token) {
        const signHeaders = HttpMessage.sign(config.token);
        options.headers = {...options.headers, ...signHeaders.headers};
      }

      const req = request(message, options, error => {
        if (error && error.statusCode === 404 && !isCreate) {
          return updateApp(true);
        }

        if (error) {
          return exit(error);
        }

        if (isCreate) {
          console.log(i18n('App "' + appName + '" created'));
        } else {
          console.log(i18n('App "' + appName + '" uploaded'));
        }
      });

      form.pipe(req);
      return req;
    }
  });

  function generateZipName(appDir: string): string {
    return 'youtrack-app-' + path.basename(appDir) + '.zip';
  }
}
