import {readFile} from 'node:fs/promises';
import path from 'node:path';
import * as zl from 'zip-lib';
import {Config, ErrorWithStatusCodeAndData} from '../../@types/types';
import {exit} from '../../lib/cli/exit';
import {tmpDir} from '../../lib/fs/tmpdir';
import {i18n} from '../../lib/i18n/i18n';
import {generateRequestParams, prepareErrorMessage} from '../../lib/net/request';
import {resolve} from '../../lib/net/resolve';
import {resolveAppName} from './upload-utils';

export async function upload(config: Config, appDir?: string) {
  const appName = resolveAppName(appDir);

  if (!appName || !appDir) {
    exit(new Error(i18n('Unexpected error')));
    return;
  }

  const zipPath = tmpDir(generateZipName(appDir));

  try {
    await zl.archiveFolder(path.resolve(config.cwd, appDir), zipPath);
    await updateApp();
  } catch (error) {
    exit(error);
  }

  async function updateApp(isCreate = false) {
    const body = new FormData();
    const blob = new Blob([await readFile(zipPath)]);
    body.set('file', blob, `${appName}.zip`);

    const url = resolve(config.host, '/api/admin/apps/import');
    const options = {
      method: 'POST',
      body,
    };

    const requestParams = generateRequestParams(config, url.href, options);

    try {
      const res = await fetch(requestParams);

      if (!res.ok) {
        const error = await prepareErrorMessage(res);
        throw new Error(error);
      }

      const {id} = (await res.json()) as unknown as {id: string};
      const appLink = `${config.host}/admin/apps?selected=${id}&tab=settings`;

      if (isCreate) {
        console.log(i18n('App "' + appName + '" created'));
      } else {
        console.log(i18n('App "' + appName + '" uploaded'));
      }

      if (config.open) {
        // using dynamic import as we compile to cjs
        const {default: openInBrowser} = await import('open');
        await openInBrowser(appLink);
      } else {
        console.log(i18n(`To configure the app please proceed to: ${appLink}`));
      }
    } catch (error) {
      if (isErrorWithStatusCodeAndData(error) && error.statusCode === 404 && !isCreate) {
        return updateApp(true);
      } else {
        exit(error);
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
