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
import {Config, ErrorWithStatusCodeAndData} from '../../@types/types';

export async function upload(config: Config, appDir?: string) {
  const appName = resolveAppName(appDir);

  if (!appName || !appDir) {
    exit(new Error(i18n('Unexpected error')));
    return;
  }

  const zipPath = tmpDir(generateZipName(appDir));

  try {
    await zipFolder(path.resolve(config.cwd, appDir), zipPath);
    return await updateApp();
  } catch (error) {
    exit(error);
  }

  async function updateApp(isCreate = false) {
    const form = new FormData();
    form.append('file', fs.createReadStream(zipPath), {
      filename: appName + '.zip',
    });

    const message = HttpMessage(resolve(config.host, '/api/admin/apps/import'));
    const options = {
      method: 'POST',
      headers: form.getHeaders(),
    };

    if (config.token) {
      const signHeaders = HttpMessage.sign(config.token);
      options.headers = {...options.headers, ...signHeaders.headers};
    }

    try {
      const req = await request(message, options);
      if (isCreate) {
        console.log(i18n('App "' + appName + '" created'));
      } else {
        console.log(i18n('App "' + appName + '" uploaded'));

        form.pipe(req);
      }
    } catch (error) {
      if (!(error instanceof Error)) {
        exit(error);
      }
      if (isErrorWithStatusCodeAndData(error) && error.statusCode === 404 && !isCreate) {
        return updateApp(true);
      }
    }
  }

  function generateZipName(appDir: string): string {
    return 'youtrack-app-' + path.basename(appDir) + '.zip';
  }

  function isErrorWithStatusCodeAndData(error: unknown): error is ErrorWithStatusCodeAndData {
    return error instanceof Error && ('statusCode' in error || 'data' in error);
  }
}
