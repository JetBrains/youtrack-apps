import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {LogEntry, RuleLogEntry} from '../management/types.js';
import {paginationFromConfig, printPaginationNotice} from '../pagination.js';
import {printStructured} from './output.js';

export type LogsArgs = {
  app?: string;
  script?: string;
};

export async function logs(config: Config, args?: LogsArgs): Promise<void> {
  try {
    const appName = args?.app;
    const scriptName = args?.script;
    if (scriptName) {
      await printScriptLogs(config, appName, scriptName);
      return;
    }

    await printAppLogs(config, appName);
  } catch (error) {
    exit(error);
  }
}

export async function requirementErrors(config: Config, appName?: string): Promise<void> {
  try {
    const errors = await createAppManagementOperations(config).getRequirementErrors(appName);

    if (printStructured(config, errors)) {
      return;
    }

    if (!errors.length) {
      console.log(i18n('No requirement errors found'));
      return;
    }

    for (const error of errors) {
      const key = error.problemKey ? `${error.problemKey}: ` : '';
      const project = error.projectShortName ? ` [${error.projectShortName}]` : '';
      console.log(`${key}${error.message ?? 'Unknown error'}${project}`);
    }
  } catch (error) {
    exit(error);
  }
}

async function printAppLogs(config: Config, appName: string | undefined): Promise<void> {
  const entries = await createAppManagementOperations(config).getLogs(appName, config.limit);

  if (printStructured(config, entries)) {
    return;
  }

  if (!entries.length) {
    console.log(i18n('No log entries found'));
    return;
  }

  for (const entry of entries) {
    console.log(formatLogEntry(entry));
  }
}

async function printScriptLogs(config: Config, appName: string | undefined, scriptName: string): Promise<void> {
  const pagination = paginationFromConfig(config);
  const result = await createAppManagementOperations(config).getScriptLogs(appName, scriptName, pagination);

  if (printStructured(config, result)) {
    return;
  }

  if (!result.items.length) {
    console.log(i18n('No log entries found'));
    return;
  }

  for (const entry of result.items) {
    console.log(formatRuleLogEntry(entry));
  }
  printPaginationNotice('log entries', result, pagination);
}

function formatLogEntry(entry: LogEntry): string {
  if (typeof entry === 'string') {
    return entry;
  }

  const timestamp = readString(entry, 'timestamp') ?? readString(entry, 'date') ?? readString(entry, 'time');
  const level = readString(entry, 'level');
  const message = readString(entry, 'message') ?? readString(entry, 'text') ?? JSON.stringify(entry);
  return [timestamp, level, message].filter(Boolean).join(' ');
}

function formatRuleLogEntry(entry: RuleLogEntry): string {
  const line = [
    entry.timestamp,
    entry.level,
    entry.username ? `[${entry.username}]` : undefined,
    entry.message,
  ].filter(Boolean).join(' ');

  return entry.stacktrace ? `${line}\n${entry.stacktrace}` : line;
}

function readString(entry: Record<string, unknown>, key: string): string | null {
  const value = entry[key];
  return typeof value === 'string' ? value : null;
}
