import nock from 'nock';

nock.back.setMode('record');

describe('index', function () {
  beforeEach(function () {
    nock.disableNetConnect();
    jest.spyOn(console, 'log').mockImplementation(() => {});
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
});
