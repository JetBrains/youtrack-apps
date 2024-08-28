import {Config} from '../../@types/types';

export function generateRequestParams(
  config: Config,
  url: string,
  options?: {method?: string; headers?: Record<string, string>; body?: FormData},
): Request {
  return new Request(url, {
    method: options?.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.token}`,
      'User-Agent':
        options?.headers?.['User-Agent'] ??
        [`Nodejs/${process.versions.node}`, `YouTrackCLI/${require('../../package.json').version}`].join(' '),
      ...options?.headers,
    },
    body: options?.body,
  });
}

export async function prepareErrorMessage(res: Response) {
  const data = (await res.json()) as Record<string, string>;
  let errorDescription = res.statusText;
  if ('error_description' in data) {
    errorDescription = data.error_description;
  }
  return `[${res.status}] ${errorDescription}`;
}
