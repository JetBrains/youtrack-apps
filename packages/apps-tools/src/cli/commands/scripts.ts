import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {AppDetails, PluggableObject, printJson} from '../management/types.js';

export async function scripts(config: Config, appName?: string): Promise<void> {
  try {
    const app = await createAppManagementOperations(config).getPackage(appName);

    if (config.json) {
      printJson(app);
      return;
    }

    console.log(`Name: ${app.name}`);
    console.log(`ID: ${app.id}`);
    console.log(`Title: ${app.title ?? 'unknown'}`);
    console.log(`Version: ${app.version ?? 'unknown'}`);
    printFile('manifest.json', app.manifestFile?.content);
    printFile('settings.json', app.settingsFile?.content);
    printFile('entity-extensions.json', app.entityExtensionsFile?.content);
    printScripts(app);
  } catch (error) {
    exit(error);
  }
}

function printFile(name: string, content: string | undefined): void {
  if (content === undefined) {
    return;
  }

  console.log('');
  console.log(`${name}:`);
  console.log(content);
}

function printScripts(app: AppDetails): void {
  const objects = (app.pluggableObjects ?? []).filter(object => object.script?.script !== undefined);
  if (!objects.length) {
    console.log('');
    console.log(i18n('No scripts found'));
    return;
  }

  console.log('');
  console.log('Scripts:');
  for (const object of objects) {
    printScript(object);
  }
}

function printScript(object: PluggableObject): void {
  const title = object.title ?? object.name ?? object.id ?? 'unknown';
  const scope = object.isGlobal === undefined ? 'unknown' : object.isGlobal ? 'global' : 'project';
  console.log('');
  console.log(`--- ${title} (${object.typeAlias ?? 'unknown'}, ${scope}) ---`);
  console.log(object.script?.script ?? '');
}
