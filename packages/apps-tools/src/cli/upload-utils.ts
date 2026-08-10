import fs from 'fs';
import path from 'path';
import {exit, ExitCode} from '../../lib/cli/exit.js';

export function resolveAppName(appDir?: string): undefined | string {
  if (!appDir) {
    exit(new Error('App directory should be defined'), ExitCode.Usage);
    return;
  }

  const appPath = path.resolve(appDir);

  if (!fs.existsSync(appPath)) {
    exit(new Error("App directory doesn't exist"), ExitCode.Usage);
    return;
  }

  let appName = '';

  const pkgPath = path.join(appPath, 'manifest.json');
  if (fs.existsSync(pkgPath)) {
    appName = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).name;
  } else {
    const obsoletePkgPath = path.join(appPath, 'package.json');
    if (fs.existsSync(obsoletePkgPath)) {
      appName = JSON.parse(fs.readFileSync(obsoletePkgPath, 'utf8')).name;
    }
  }

  if (!appName) {
    exit(new Error("App doesn't contain manifest.json file"), ExitCode.Usage);
  }

  return appName;
}
