// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function queryfields(it: Record<string, any> | string[] | string | undefined): string {
  if (it === undefined) {
    return '';
  }

  if (typeof it === 'string') {
    return it;
  }

  if (Array.isArray(it)) {
    return it.map(i => queryfields(i)).join(',');
  }

  if (it !== null && typeof it === 'object') {
    return queryfields(
      Object.keys(it).reduce((result: string[], i: string) => {
        return result.concat(i + '(' + queryfields(it[i]) + ')');
      }, []),
    );
  }

  return '';
}
