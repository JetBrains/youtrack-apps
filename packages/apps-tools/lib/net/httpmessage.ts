import {resolve} from './resolve';

export function HttpMessage(url: URL | string): URL {
  if (typeof url === 'string') {
    url = resolve(url, '');
  }
  return new URL(url);
}

HttpMessage.sign = (token: string): {headers: {Authorization: string}} => {
  if (!token) throw Error('HttpMessage: token is required');

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};
