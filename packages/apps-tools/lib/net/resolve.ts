export function resolve(url: string, a: string): URL {
  if (typeof url === 'string' && !/^http(s)?:\/\//.test(url)) {
    url = `https://${url}`;
  }

  if (a && !/\/$/.test(url)) {
    url += '/';
  }

  if (a) {
    a = a.replace(/^\//, '');
  }

  return new URL(a, url);
}
