import nock from 'nock';
import {list} from './list';

nock.back.setMode('record');
jest.mock('./list');

describe('index', function () {
  beforeEach(function () {
    nock.disableNetConnect();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    process.env.YOUTRACK_HOST = '';
    process.env.YOUTRACK_API_TOKEN = '';
  });

  afterEach(() => {
    nock.cleanAll();
    jest.resetAllMocks();
  });

  it('should print version', function () {
    require('./index').run(['', '', 'version']);
    expect(console.log).toHaveBeenCalledWith(require('../../package.json').version);
  });

  it('should show error message if required parameter doesn`t have value', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation();

    require('./index').run(['', '', 'list', '--host=']);
    expect(console.error).toHaveBeenCalledWith('Error: Option "--host" is required');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should show error message if token is not provided', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation();

    require('./index').run(['', '', 'list', '--host=foo']);

    expect(console.error).toHaveBeenCalledWith(
      'Error: Token is required. Please create one at https://foo/users/me?tab=account-security',
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should not throw error if user passed all required parameters', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation();
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(jest.fn(() => Promise.resolve({json: () => Promise.resolve({data: []})})) as jest.Mock);

    nock('https://foo:443')
      .get(uri => uri.includes('/api/admin/apps'))
      .reply(200, []);

    require('./index').run(['', '', 'list', '--host=foo', '--token=bar']);

    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should take arg param when ENV var is also provided', function () {
    process.env.YOUTRACK_HOST = 'baz';
    const expectedCallArgs = {
      cwd: process.cwd(),
      host: 'foo',
      token: 'bar',
      manifest: null,
      schema: null,
      overwrite: null,
      output: null,
      open: null,
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation();

    require('./index').run(['', '', 'list', '--host=foo', '--token=bar']);

    expect(list).toHaveBeenCalledWith(expectedCallArgs, undefined);
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should execute validate without expecting required params', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation();

    await require('./index').run(['', '', 'validate', 'foo']);
    expect(console.error).not.toHaveBeenCalledWith('Error: Option "--host" is required');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
