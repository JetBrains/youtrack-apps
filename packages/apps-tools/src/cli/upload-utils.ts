import fs from 'fs';
import path from 'path';
import {i18n} from '../../lib/i18n/i18n';
import {exit} from '../../lib/cli/exit';

export function resolveAppName(appDir: string): undefined | string {
  if (!appDir) {
    exit(new Error(i18n('App directory should be defined')));
    return;
  }

  const appPath = path.resolve(appDir);

  if (!fs.existsSync(appPath)) {
    exit(new Error(i18n("App directory doesn't exist")));
    return;
  }

  let appName = '';

  const pkgPath = path.join(appPath, 'manifest.json');
  if (fs.existsSync(pkgPath)) {
    appName = require(pkgPath).name;
  } else {
    const obsoletePkgPath = path.join(appPath, 'package.json');
    if (fs.existsSync(obsoletePkgPath)) {
      appName = require(obsoletePkgPath).name;
    }
  }

  if (!appName) {
    exit(new Error(i18n("App doesn't contain manifest.json file")));
  }

  return appName;
}
