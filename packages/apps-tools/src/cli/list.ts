import {AppItem, Config} from '../../@types/types';
import {resolve} from '../../lib/net/resolve';
import {exit} from '../../lib/cli/exit';
import {request} from '../../lib/net/request';
import {queryfields} from '../../lib/net/queryfields';
import {HttpMessage} from '../../lib/net/httpmessage';
import {ClientRequest} from 'http';

export function list(config: Config): ClientRequest {
  let message = HttpMessage(resolve(config.host, '/api/admin/apps'));
  const options = config.token ? HttpMessage.sign(config.token) : {};
  message.searchParams.append('fields', queryfields(['id', 'name']));
  message.searchParams.append('$top', '-1');

  return request(message, options, (error, data: AppItem[]) => {
    if (error) return exit(error);

    data.forEach(x => {
      print(x.name);
    });
  });

  function print(name: string) {
    console.log(name);
  }
}
