import {AppItem, Config} from '../../@types/types.js';
import {resolve} from '../../lib/net/resolve.js';
import {exit} from '../../lib/cli/exit.js';
import {queryfields} from '../../lib/net/queryfields.js';
import {generateRequestParams, prepareErrorMessage} from '../../lib/net/request.js';

export async function list(config: Config): Promise<void> {
  const url = resolve(config.host, '/api/admin/apps');
  url.searchParams.append('fields', queryfields(['id', 'name']));
  url.searchParams.append('$top', '-1');
  const options = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const requestParams = generateRequestParams(config, url.href, options);

  try {
    const res = await fetch(requestParams);
    let apps: AppItem[] = [];
    if (!res.ok) {
      const error = await prepareErrorMessage(res);
      throw new Error(error);
    }
    apps = (await res.json()) as unknown as AppItem[];
    apps.forEach(x => {
      print(x.name);
    });
  } catch (error) {
    exit(error);
  }

  function print(name: string) {
    console.log(name);
  }
}
