import fs from 'fs';
import {writeFile} from 'node:fs/promises';
import {Readable} from 'node:stream';
import path from 'path';
import * as zl from 'zip-lib';
import {Config} from '../../@types/types';
import {exit} from '../../lib/cli/exit';
import {tmpDir} from '../../lib/fs/tmpdir';
import {i18n} from '../../lib/i18n/i18n';
import {generateRequestParams, prepareErrorMessage} from '../../lib/net/request';
import {resolve} from '../../lib/net/resolve';

export async function download(config: Config, appName?: string) {
  if (!appName) {
    exit(new Error(i18n('App name should be defined')));
    return;
  }
  appName = appName.toString();

  const url = resolve(config.host, `/api/admin/apps/${appName.replace(/^@/, '')}`);
  const options = {
    headers: {
      Accept: 'application/zip',
      'Content-Type': 'application/json',
    },
  };
  const requestParams = generateRequestParams(config, url.href, options);

  try {
    const res = await fetch(requestParams);
    if (!res.ok || !res.body) {
      const errorMessage = await prepareErrorMessage(res);
      throw new Error(errorMessage);
    }
    const body = Readable.fromWeb(res.body);
    await processResponseBody(body, appName);
  } catch (error) {
    exit(error);
  }

  function getZipName(appName: string): string {
    return 'youtrack-app-' + appName.split('/').pop() + '.zip';
  }

  async function processResponseBody(body: Readable, appName: string) {
    const tempZipPath = tmpDir(getZipName(appName));
    await writeFile(tempZipPath, body);
    const output = config.output || config.cwd;
    const shouldOverwrite = config.overwrite !== null;

    if (shouldOverwrite) {
      const existingPath = path.resolve(output, appName);
      fs.rmSync(existingPath, {recursive: true, force: true});
    }

    await zl.extract(tempZipPath, path.resolve(output, appName));
    if (!shouldOverwrite) {
      console.log(i18n(`File extracted into '${output}'`));
    } else {
      console.log(i18n(`File extracted into '${output}' and existing files are overwritten`));
    }
  }
}
