import {jest, describe, it, expect, beforeEach, afterEach} from '@jest/globals';
import nock from 'nock';
import {list} from './commands/discovery.js';
import {settings} from './commands/settings.js';
import {logs} from './commands/diagnostics.js';
import {deleteApp} from './commands/lifecycle.js';
import {scripts} from './commands/scripts.js';
import {fieldValues} from './commands/field-values.js';

nock.back.setMode('record');
jest.mock('./commands/discovery');
jest.mock('./commands/settings');
jest.mock('./commands/diagnostics');
jest.mock('./commands/lifecycle');
jest.mock('./commands/scripts');
jest.mock('./commands/field-values');

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
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'list', '--host=']);
    expect(console.error).toHaveBeenCalledWith('Error: Option "--host" is required');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should show error message if token is not provided', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'list', '--host=foo']);

    expect(console.error).toHaveBeenCalledWith(
      'Error: Token is required. Please create one at https://foo/users/me?tab=account-security',
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should not throw error if user passed all required parameters', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(jest.fn(() => Promise.resolve({json: () => Promise.resolve({data: []})})) as unknown as typeof fetch);

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
      json: false,
      yaml: false,
      yes: false,
      project: null,
      skip: null,
      limit: null,
      settings: null,
      enabled: null,
      field: null,
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'list', '--host=foo', '--token=bar']);

    expect(list).toHaveBeenCalledWith(expectedCallArgs, undefined);
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should pass yaml flag to commands', function () {
    const expectedCallArgs = {
      cwd: process.cwd(),
      host: 'foo',
      token: 'bar',
      manifest: null,
      schema: null,
      overwrite: null,
      output: null,
      open: null,
      json: false,
      yaml: true,
      yes: false,
      project: null,
      skip: null,
      limit: null,
      settings: null,
      enabled: null,
      field: null,
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'list', '--host=foo', '--token=bar', '--yaml']);

    expect(list).toHaveBeenCalledWith(expectedCallArgs, undefined);
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should pass settings app package arguments', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'settings', '@acme/my-app', '--host=foo', '--token=bar']);

    expect(settings).toHaveBeenCalledWith(expect.objectContaining({host: 'foo', token: 'bar'}), '@acme/my-app');
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should pass unique app identifiers for lifecycle commands', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'delete', '@acme/my-app', '--host=foo', '--token=bar', '--yes']);

    expect(deleteApp).toHaveBeenCalledWith(expect.objectContaining({host: 'foo', token: 'bar', yes: true}), '@acme/my-app');
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should pass app and script args to logs', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'logs', 'my-app', 'action', '--skip=0', '--limit=100', '--host=foo', '--token=bar']);

    expect(logs).toHaveBeenCalledWith(
      expect.objectContaining({host: 'foo', token: 'bar', skip: '0', limit: '100'}),
      'my-app action',
    );
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should pass app and file key args to scripts', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'scripts', 'my-app', '150-238', '--host=foo', '--token=bar']);

    expect(scripts).toHaveBeenCalledWith(
      expect.objectContaining({host: 'foo', token: 'bar'}),
      'my-app 150-238',
    );
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should pass project and field args to field-values', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'field-values', 'high', '--project=CP', '--field=Priority', '--host=foo', '--token=bar']);

    expect(fieldValues).toHaveBeenCalledWith(
      expect.objectContaining({host: 'foo', token: 'bar', project: 'CP', field: 'Priority'}),
      'high',
    );
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should execute validate without expecting required params', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await require('./index').run(['', '', 'validate', 'foo']);
    expect(console.error).not.toHaveBeenCalledWith('Error: Option "--host" is required');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
