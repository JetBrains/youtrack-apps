import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {LogEntry, printJson, RuleLogEntry} from '../management/types.js';
import {paginationFromConfig, printPaginationNotice} from '../pagination.js';

export async function logs(config: Config, appName?: string): Promise<void> {
  try {
    const entries = await createAppManagementOperations(config).getLogs(appName, config.top);

    if (config.json) {
      printJson(entries);
      return;
    }

    if (!entries.length) {
      console.log(i18n('No log entries found'));
      return;
    }

    for (const entry of entries) {
      console.log(formatLogEntry(entry));
    }
  } catch (error) {
    exit(error);
  }
}

export async function scriptLogs(config: Config, args?: string): Promise<void> {
  try {
    const [appName, scriptName] = splitScriptLogArgs(args);
    const pagination = paginationFromConfig(config);
    const result = await createAppManagementOperations(config).getScriptLogs(appName, scriptName, pagination);

    if (config.json) {
      printJson(result);
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
  } catch (error) {
    exit(error);
  }
}

export async function requirementErrors(config: Config, appName?: string): Promise<void> {
  try {
    const errors = await createAppManagementOperations(config).getRequirementErrors(appName);

    if (config.json) {
      printJson(errors);
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

function formatLogEntry(entry: LogEntry): string {
  if (typeof entry === 'string') {
    return entry;
  }

  const timestamp = readString(entry, 'timestamp') ?? readString(entry, 'date') ?? readString(entry, 'time');
  const level = readString(entry, 'level');
  const message = readString(entry, 'message') ?? readString(entry, 'text') ?? JSON.stringify(entry);
  return [timestamp, level, message].filter(Boolean).join(' ');
}

function splitScriptLogArgs(args: string | undefined): [string | undefined, string | undefined] {
  const parts = (args ?? '').split(/\s+/).filter(Boolean);
  return [parts[0], parts[1]];
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
