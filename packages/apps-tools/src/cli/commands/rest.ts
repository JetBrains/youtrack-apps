import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {generateRequestParams, prepareErrorMessage} from '../../../lib/net/request.js';
import {resolve} from '../../../lib/net/resolve.js';
import {printJson, printYaml} from '../management/types.js';

export interface RawRestRequestArgs {
  path?: string;
  method?: string;
  body?: string;
  header?: string | string[];
}

const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

export async function restRequest(config: Config, args: RawRestRequestArgs = {}): Promise<void> {
  try {
    const path = args.path?.trim();
    if (!path) {
      throw new Error('Option "--path" is required');
    }

    const method = (args.method ?? 'GET').toUpperCase();
    if (!METHODS.has(method)) {
      throw new Error(`Invalid HTTP method "${args.method}"`);
    }
    if (method === 'DELETE' && !config.confirmDestructiveAction) {
      throw new Error('DELETE requests require --yes');
    }

    let body: string | undefined;
    if (args.body !== undefined) {
      try {
        body = JSON.stringify(JSON.parse(args.body));
      } catch {
        throw new Error('Invalid JSON request body');
      }
    }

    const headers = parseHeaders(args.header);
    if (body !== undefined && !Object.keys(headers).some(name => name.toLowerCase() === 'content-type')) {
      headers['Content-Type'] = 'application/json';
    }

    const hostUrl = resolve(config.host, '/');
    const url = resolve(config.host, path);
    if (url.origin !== hostUrl.origin || !url.pathname.startsWith(hostUrl.pathname)) {
      throw new Error('REST path must be relative to the configured YouTrack host');
    }
    const response = await fetch(generateRequestParams(config, url.href, {method, headers, body}));

    if (!response.ok) {
      throw new Error(await prepareErrorMessage(response));
    }

    const text = await response.text();
    if (!text.trim()) {
      return;
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      console.log(text);
      return;
    }

    if (config.yaml) {
      printYaml(data);
    } else {
      printJson(data);
    }
  } catch (error) {
    exit(error);
  }
}

function parseHeaders(value: string | string[] | undefined): Record<string, string> {
  const values = value === undefined ? [] : Array.isArray(value) ? value : [value];
  const headers: Record<string, string> = {};

  for (const header of values) {
    const separator = header.indexOf(':');
    if (separator <= 0) {
      throw new Error(`Invalid header "${header}". Use name:value`);
    }

    const name = header.slice(0, separator).trim();
    const content = header.slice(separator + 1).trim();
    if (!name || name.toLowerCase() === 'authorization') {
      throw new Error('The Authorization header cannot be supplied with --header');
    }
    headers[name] = content;
  }

  return headers;
}
