const resolve = require('../../lib/net/resolve');
const fs = require('fs');
const path = require('path');
const exit = require('../../lib/cli/exit');
const request = require('../../lib/net/request');
const zipfolder = require('../../lib/fs/zipfolder');
const {resolveAppName} = require('./upload-utils');
const i18n = require('../../lib/i18n/i18n');
const HttpMessage = require('../../lib/net/httpmessage');
const FormData = require('form-data');
const tmpdir = require('../../lib/fs/tmpdir');

/**
 * @param {*} config
 * @param {string} appDir
 * @returns
 */
module.exports = function (config, appDir) {
  const appName = resolveAppName(appDir);

  if (!appName) {
    exit(new Error(i18n('Unexpected error')));
    return;
  }

  const zipPath = tmpdir(generateZipName(appDir));

  zipfolder(path.resolve(config.cwd, appDir), zipPath, (error, zip) => {
    if (error) {
      return exit(error);
    }

    return updateApp();

    /**
     * @param {boolean} [isCreate]
     * @returns {import('http').ClientRequest}
     */
    function updateApp(isCreate) {
      const form = new FormData();
      form.append('file', fs.createReadStream(zip.path), {
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
          // Try to create new workflow
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

  /**
   * @param {string} appDir
   * @returns {string}
   */
  function generateZipName(appDir) {
    return 'youtrack-app-' + path.basename(appDir) + '.zip';
  }
};
