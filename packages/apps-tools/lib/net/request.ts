import {http, https, RedirectableRequest} from 'follow-redirects';
import {ClientRequest, IncomingMessage} from 'http';
import {HttpMessage} from './httpmessage';
import {ErrorWithStatusCodeAndData, ResponseData} from '../../@types/types';

export function request(
  message: string | URL,
  options: {method?: string; headers?: Record<string, string>},
): Promise<ResponseData> {
  return new Promise((resolve, reject) => {
    message = HttpMessage(message);
    const updatedOptions = updateOptions(options);

    const netProvider = message.protocol === 'http:' ? http : https;
    const req = netProvider.request(message, updatedOptions, onResponse);

    req.on('error', error => {
      return reject(error);
    });

    return closeMaybe(req, updatedOptions, resolve);

    function onResponse(res: IncomingMessage) {
      let dataRaw = '';
      let resData: ResponseData;
      let error: ErrorWithStatusCodeAndData | null = null;

      res.on('data', chunk => {
        dataRaw += chunk.toString();
      });

      res.on('end', function () {
        const contentType = res.headers['content-type'] || '';

        if (contentType.indexOf('application/json') > -1) {
          resData = JSON.parse(dataRaw);
        }

        if (res.statusCode && (res.statusCode < 200 || res.statusCode > 299)) {
          const errorDesc = resData?.error_description ?? '';
          error = new Error('[' + res.statusCode + '] ' + (errorDesc || res.statusMessage));
          error.statusCode = res.statusCode;
          error.data = resData;
          return reject(error);
        }
        return resolve(resData ?? dataRaw);
      });

      res.on('error', error => {
        return reject(error);
      });
    }
  });
}

function closeMaybe(
  req: RedirectableRequest<ClientRequest, IncomingMessage>,
  options: {method: string},
  resolveFn: (data: ResponseData) => void,
) {
  if (options.method === 'GET') {
    req.end();
  } else {
    resolveFn(req as unknown as ResponseData);
  }
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
