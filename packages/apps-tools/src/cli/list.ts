import {AppItem, Config} from '../../@types/types';
import {resolve} from '../../lib/net/resolve';
import {exit} from '../../lib/cli/exit';
import {request} from '../../lib/net/request';
import {queryfields} from '../../lib/net/queryfields';
import {HttpMessage} from '../../lib/net/httpmessage';

export async function list(config: Config): Promise<void> {
  const message = HttpMessage(resolve(config.host, '/api/admin/apps'));
  const options = config.token ? HttpMessage.sign(config.token) : {};
  message.searchParams.append('fields', queryfields(['id', 'name']));
  message.searchParams.append('$top', '-1');

  try {
    const res = await request(message, options);
    (res as unknown as AppItem[]).forEach(x => {
      print(x.name);
    });
  } catch (error) {
    exit(error);
  }

  function print(name: string) {
    console.log(name);
  }
}
