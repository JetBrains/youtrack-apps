import {http, https} from 'follow-redirects';
import {ClientRequest, IncomingMessage} from 'http';
import {HttpMessage} from './httpmessage';

export function request(
  message: string | URL,
  options: {method?: string; headers?: any},
  fn: (error: (Error & {statusCode?: number}) | null, data?: any) => void,
): ClientRequest {
  message = HttpMessage(message);
  const updatedOptions = updateOptions(options);

  const netProvider = message.protocol === 'http:' ? http : https;
  const req = netProvider.request(message, updatedOptions, onResponse);

  req.on('error', error => {
    fn && fn(error, null);
  });

  return closeMaybe(req as ClientRequest, updatedOptions);

  function onResponse(res: IncomingMessage) {
    /**@type {*}*/
    let data: any = '';
    /**@type {(Error & {statusCode?: number, data?: *})|null}*/
    let error: (Error & {statusCode?: number; data?: any}) | null = null;

    res.on('data', chunk => {
      data += chunk.toString();
    });

    res.on('end', function () {
      const contentType = res.headers['content-type'] || '';

      if (contentType.indexOf('application/json') > -1) {
        data = JSON.parse(data);
      }

      if (res.statusCode && (res.statusCode < 200 || res.statusCode > 299)) {
        const errorDesc = data.error_description || '';
        error = new Error('[' + res.statusCode + '] ' + (errorDesc || res.statusMessage));
        error.statusCode = res.statusCode;
        error.data = data;
      }

      fn && fn(error, data);
    });

    res.on('error', error => {
      fn && fn(error, data);
    });
  }
}

function closeMaybe(req: ClientRequest, options: {method: string}): ClientRequest {
  if (options.method === 'GET') req.end();
  return req;
}

function updateOptions(options: {method?: string; headers?: Record<string, string>}) {
  return {
    method: options?.method ?? 'GET',
    headers: {
      'User-Agent':
        options?.headers?.['User-Agent'] ??
        [`Nodejs/${process.versions.node}`, `YouTrackCLI/${require('../../package.json').version}`].join(' '),
      ...options.headers,
    },
  };
}
