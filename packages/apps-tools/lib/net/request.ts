import pkg from '../../package.json' with { type: 'json' };
import {Config} from '../../@types/types.js';

export function generateRequestParams(
  config: Config,
  url: string,
  options?: {method?: string; headers?: Record<string, string>; body?: FormData | string},
): Request {
  return new Request(url, {
    method: options?.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.token}`,
      'User-Agent':
        options?.headers?.['User-Agent'] ??
        [`Nodejs/${process.versions.node}`, `YouTrackCLI/${pkg.version}`].join(' '),
      ...options?.headers,
    },
    body: options?.body,
  });
}

export async function prepareErrorMessage(res: Response) {
  let errorDescription = res.statusText;
  const text = await res.text();

  if (text) {
    try {
      const data = JSON.parse(text) as Record<string, string>;
      errorDescription = data.error_description ?? data.message ?? data.error ?? errorDescription;
    } catch {
      errorDescription = text;
    }
  }

  return `[${res.status}] ${errorDescription}`;
}
