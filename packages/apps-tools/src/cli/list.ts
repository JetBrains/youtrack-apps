import {AppItem, Config} from '../../@types/types';
import {resolve} from '../../lib/net/resolve';
import {exit} from '../../lib/cli/exit';
import {queryfields} from '../../lib/net/queryfields';
import {generateRequestParams, prepareErrorMessage} from '../../lib/net/request';

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
