const fs = require('fs');
const exit = require('../../lib/cli/exit');
const resolve = require('../../lib/net/resolve');
const tmpdir = require('../../lib/fs/tmpdir');
const unzip = require('../../lib/fs/unzip');
const request = require('../../lib/net/request');
const i18n = require('../../lib/i18n/i18n');
const HttpMessage = require('../../lib/net/httpmessage');

/**
 * @param {*} config
 * @param {string} appName
 * @returns
 */
function download(config, appName) {
  if (!appName) {
    exit(new Error(i18n('App name should be defined')));
    return;
  }
  appName = appName.toString();
  let message = HttpMessage(resolve(config.host, '/api/admin/apps/' + appName.replace(/^@/, '')));
  const options = {
    headers: {
      'Accept': 'application/zip'
    }
  };

  if (config.token) {
    const signHeaders = HttpMessage.sign(config.token);
    options.headers = {...options.headers, ...signHeaders.headers};
  }

  const req = request(message, options,
    (downloadError) => {
      if (downloadError) exit(downloadError);
    }
  );

  req.on('response', response => {
    const zip = fs.createWriteStream(tmpdir(getZipName(appName)));
    const output = config.output || config.cwd;

    response.pipe(zip).on('close', () => {
      unzip(zip.path.toString(), require('path').resolve(output, appName), (error) => {
        if (error) return exit(error);

        console.log(i18n(`File extracted into '${output}'`));
      });
    });
  });

  return req;

  /**
   * @param {string} appName
   * @returns {string}
   */
  function getZipName(appName) {
    return 'youtrack-app-' + appName.split('/').pop() + '.zip';
  }
}

module.exports = download;
