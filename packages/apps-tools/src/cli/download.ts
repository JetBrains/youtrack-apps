import fs from 'fs';
import {writeFile} from 'node:fs/promises';
import {Readable} from 'node:stream';
import path from 'path';
import * as zl from 'zip-lib';
import {Config} from '../../@types/types.js';
import {exit} from '../../lib/cli/exit.js';
import {tmpDir} from '../../lib/fs/tmpdir.js';
import {generateRequestParams, prepareErrorMessage} from '../../lib/net/request.js';
import {resolve} from '../../lib/net/resolve.js';
import {createAppManagementOperations} from './management/app-management-operations.js';
import {printStructured} from './commands/output.js';

export async function download(config: Config, appName?: string) {
  if (!appName) {
    exit(new Error('App name should be defined'));
    return;
  }
  appName = appName.toString();

  try {
    const app = await createAppManagementOperations(config).resolveApp(appName, ['id']);
    const url = resolve(config.host, `/api/admin/apps/${app.id}`);
    const options = {
      headers: {
        Accept: 'application/zip',
        'Content-Type': 'application/json',
      },
    };
    const requestParams = generateRequestParams(config, url.href, options);
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
    const result = {
      action: 'downloaded',
      app: appName,
      output: path.resolve(output, appName),
      overwritten: shouldOverwrite,
    };
    if (printStructured(config, result)) {
      return;
    }

    console.log(shouldOverwrite
      ? `File extracted into '${output}' and existing files are overwritten`
      : `File extracted into '${output}'`);
  }
}
