import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {AppConfiguration, AppSettingsUpdate, formatBoolean, formatProjectLabel} from '../management/types.js';
import {printStructured} from './output.js';

export async function settings(config: Config, appName?: string): Promise<void> {
  try {
    const result = await createAppManagementOperations(config).getSettings(appName, config.project);
    printSettings(config, result);
  } catch (error) {
    exit(error);
  }
}

export async function settingsSet(config: Config, appName?: string): Promise<void> {
  try {
    const payload = buildSettingsPayload(config);
    const result = await createAppManagementOperations(config).updateSettings(appName, payload, config.project);
    printSettings(config, result);
  } catch (error) {
    exit(error);
  }
}

function buildSettingsPayload(config: Config): AppSettingsUpdate {
  const payload: AppSettingsUpdate = {};

  if (config.enabled !== null) {
    payload.enabled = parseEnabled(config.enabled);
  }

  if (config.settings !== null) {
    const settings = stringifySettings(config.settings);
    if (config.project) {
      payload.projectSettings = settings;
    } else {
      payload.globalSettings = settings;
    }
  }

  return payload;
}

function parseEnabled(value: string): boolean {
  if (['true', 'yes', '1'].includes(value.toLowerCase())) {
    return true;
  }

  if (['false', 'no', '0'].includes(value.toLowerCase())) {
    return false;
  }

  throw new Error(i18n('Option "--enabled" should be true or false'));
}

function stringifySettings(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value));
  } catch {
    throw new Error(i18n('Option "--settings" should be a valid JSON object'));
  }
}

function printSettings(config: Config, result: AppConfiguration): void {
  if (printStructured(config, result)) {
    return;
  }

  console.log(`ID: ${result.id}`);
  if (result.app) {
    console.log(`App: ${result.app.title ?? result.app.name ?? result.app.id ?? 'unknown'}`);
  }
  if (result.project) {
    console.log(`Project: ${formatProjectLabel(result.project)}`);
  }
  console.log(`Enabled: ${formatBoolean(result.enabled)}`);
  if (result.isActive !== undefined) {
    console.log(`Active: ${formatBoolean(result.isActive)}`);
  }
  console.log(`Missing required settings: ${formatBoolean(result.missingRequiredSettings)}`);
  printJsonSetting('Global settings', result.globalSettings);
  printJsonSetting('Project settings', result.projectSettings);
}

function printJsonSetting(label: string, value: string | undefined): void {
  if (value === undefined) {
    return;
  }

  console.log(`${label}: ${formatSettingsJson(value)}`);
}

function formatSettingsJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
