import {jest, describe, it, expect, beforeEach, afterEach} from '@jest/globals';
import nock from 'nock';
import {info, list} from './commands/discovery.js';
import {settings, settingsSet} from './commands/settings.js';
import {logs, requirementErrors} from './commands/diagnostics.js';
import {deleteApp, disable, enable} from './commands/lifecycle.js';
import {scripts} from './commands/scripts.js';
import {fieldValues} from './commands/field-values.js';
import {download} from './download.js';
import {upload} from './upload.js';
import {validate} from './validate.js';
import {usages} from './commands/usages.js';
import {visibility} from './commands/visibility.js';
import {attach, detach} from './commands/project-scope.js';
import {projectApps} from './commands/project-apps.js';
import {projectFields, projectInfo, projectList} from './commands/projects.js';
import {tagSearch} from './commands/tags.js';
import {groupList, groupMembers} from './commands/groups.js';
import {userInfo, userList} from './commands/users.js';
import {restRequest} from './commands/rest.js';

nock.back.setMode('record');
jest.mock('./commands/discovery');
jest.mock('./commands/settings');
jest.mock('./commands/diagnostics');
jest.mock('./commands/lifecycle');
jest.mock('./commands/scripts');
jest.mock('./commands/field-values');
jest.mock('./download');
jest.mock('./upload');
jest.mock('./validate');
jest.mock('./commands/usages');
jest.mock('./commands/visibility');
jest.mock('./commands/project-scope');
jest.mock('./commands/project-apps');
jest.mock('./commands/projects');
jest.mock('./commands/tags');
jest.mock('./commands/groups');
jest.mock('./commands/users');
jest.mock('./commands/rest');

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
    require('./index').run(['', '', '--version']);
    expect(console.log).toHaveBeenCalledWith(require('../../package.json').version);
  });

  it('should show error message if required parameter doesn`t have value', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'app', 'list', '--host=']);
    expect(console.error).toHaveBeenCalledWith('Error: Option "--host" is required');
    expect(process.exit).toHaveBeenCalledWith(2);
  });

  it('should show error message if token is not provided', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'app', 'list', '--host=foo']);

    expect(console.error).toHaveBeenCalledWith(
      'Error: Token is required. Please create one at https://foo/users/me?tab=account-security',
    );
    expect(process.exit).toHaveBeenCalledWith(3);
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

    require('./index').run(['', '', 'app', 'list', '--host=foo', '--token=bar']);

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
      confirmDestructiveAction: false,
      project: null,
      skip: null,
      limit: null,
      settings: null,
      enabled: null,
      field: null,
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'app', 'list', '--host=foo', '--token=bar']);

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
      confirmDestructiveAction: false,
      project: null,
      skip: null,
      limit: null,
      settings: null,
      enabled: null,
      field: null,
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'app', 'list', '--host=foo', '--token=bar', '--yaml']);

    expect(list).toHaveBeenCalledWith(expectedCallArgs, undefined);
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should accept yml as an alias for yaml', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'app', 'list', '--host=foo', '--token=bar', '--yml']);

    expect(list).toHaveBeenCalledWith(expect.objectContaining({json: false, yaml: true}), undefined);
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should pass settings app package arguments', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'app', 'settings', '--app=@acme/my-app', '--host=foo', '--token=bar']);

    expect(settings).toHaveBeenCalledWith(expect.objectContaining({host: 'foo', token: 'bar'}), '@acme/my-app');
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should pass unique app identifiers for lifecycle commands', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'app', 'delete', '--app=@acme/my-app', '--host=foo', '--token=bar', '--yes']);

    expect(deleteApp).toHaveBeenCalledWith(expect.objectContaining({host: 'foo', token: 'bar', confirmDestructiveAction: true}), '@acme/my-app');
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should pass --yes to DELETE REST requests', async function () {
    await require('./index').run(['', '', 'rest', 'request', '--path=/api/issues/1', '--method=DELETE', '--host=foo', '--token=bar', '--yes']);

    expect(restRequest).toHaveBeenCalledWith(
      expect.objectContaining({host: 'foo', token: 'bar', confirmDestructiveAction: true}),
      {path: '/api/issues/1', method: 'DELETE', body: undefined, header: undefined},
    );
  });

  it('should pass app and script args to logs', function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    require('./index').run(['', '', 'app', 'logs', '--app=my-app', '--script=action', '--skip=0', '--limit=100', '--host=foo', '--token=bar']);

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

    require('./index').run(['', '', 'app', 'scripts', '--app=my-app', '--file-key=150-238', '--host=foo', '--token=bar']);

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

    require('./index').run(['', '', 'field', 'values', '--query=high', '--project=CP', '--field=Priority', '--host=foo', '--token=bar']);

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

    await require('./index').run(['', '', 'app', 'validate', '--directory=foo']);
    expect(console.error).not.toHaveBeenCalledWith('Error: Option "--host" is required');
    expect(validate).toHaveBeenCalledWith(expect.objectContaining({host: null, token: null}), 'foo');
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should use lifecycle directory defaults', async () => {
    await require('./index').run(['', '', 'app', 'upload', '--host=foo', '--token=bar']);
    await require('./index').run(['', '', 'app', 'validate']);
    await require('./index').run(['', '', 'app', 'download', '--app=my-app', '--host=foo', '--token=bar']);

    expect(upload).toHaveBeenCalledWith(expect.objectContaining({host: 'foo', token: 'bar'}), 'dist');
    expect(validate).toHaveBeenCalledWith(expect.objectContaining({host: null, token: null}), 'dist');
    expect(download).toHaveBeenCalledWith(
      expect.objectContaining({host: 'foo', token: 'bar', output: process.cwd()}),
      'my-app',
    );
  });

  it.each([
    ['app upload', ['app', 'upload', '--directory=dist'], upload, 'dist'],
    ['app download', ['app', 'download', '--app=my-app'], download, 'my-app'],
    ['app validate', ['app', 'validate', '--directory=dist'], validate, 'dist'],
    ['app list', ['app', 'list'], list, undefined],
    ['app info', ['app', 'info', '--app=my-app'], info, 'my-app'],
    ['app scripts', ['app', 'scripts', '--app=my-app', '--file-key=manifest'], scripts, 'my-app manifest'],
    ['app usages', ['app', 'usages', '--app=my-app'], usages, 'my-app'],
    ['app settings', ['app', 'settings', '--app=my-app'], settings, 'my-app'],
    ['app settings-set', ['app', 'settings-set', '--app=my-app'], settingsSet, 'my-app'],
    ['app visibility', ['app', 'visibility', '--app=my-app'], visibility, 'my-app'],
    ['app enable', ['app', 'enable', '--app=my-app'], enable, 'my-app'],
    ['app disable', ['app', 'disable', '--app=my-app'], disable, 'my-app'],
    ['app attach', ['app', 'attach', '--app=my-app', '--project=DEMO'], attach, 'my-app'],
    ['app detach', ['app', 'detach', '--app=my-app', '--project=DEMO'], detach, 'my-app'],
    ['app logs', ['app', 'logs', '--app=my-app', '--script=workflow'], logs, 'my-app workflow'],
    ['app requirement-errors', ['app', 'requirement-errors', '--app=my-app'], requirementErrors, 'my-app'],
    ['app delete', ['app', 'delete', '--app=my-app'], deleteApp, 'my-app'],
    ['project list', ['project', 'list'], projectList, undefined],
    ['project info', ['project', 'info', '--project=DEMO'], projectInfo, 'DEMO'],
    ['project fields', ['project', 'fields', '--project=DEMO'], projectFields, 'DEMO'],
    ['project apps', ['project', 'apps', '--project=DEMO'], projectApps, 'DEMO'],
    ['tag search', ['tag', 'search', '--query=bug'], tagSearch, 'bug'],
    ['field values', ['field', 'values', '--project=DEMO', '--field=Priority', '--query=high'], fieldValues, 'high'],
    ['group list', ['group', 'list', '--query=team'], groupList, 'team'],
    ['group members', ['group', 'members', '--group=developers'], groupMembers, 'developers'],
    ['user list', ['user', 'list', '--query=alex'], userList, 'alex'],
    ['user info', ['user', 'info', '--user=alex'], userInfo, 'alex'],
    ['rest request', ['rest', 'request', '--path=/api/issues'], restRequest, {path: '/api/issues', method: undefined, body: undefined, header: undefined}],
  ])('should route %s', async (_name, commandArgs, handler, expectedArgument) => {
    await require('./index').run(['', '', ...commandArgs, '--host=foo', '--token=bar']);

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({host: 'foo', token: 'bar'}), expectedArgument);
  });

  it('should reject legacy commands and positional operands', async function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await require('./index').run(['', '', 'list', '--host=foo', '--token=bar']);
    await require('./index').run(['', '', 'app', 'info', 'my-app', '--host=foo', '--token=bar']);

    expect(console.error).toHaveBeenCalledWith('Error: Expected command syntax: youtrack-app <entity> <action> [options]');
    expect(process.exit).toHaveBeenCalledTimes(2);
    expect(info).not.toHaveBeenCalled();
  });

  it('should suggest the new syntax for legacy commands', async function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await require('./index').run(['', '', 'upload', 'dist']);
    await require('./index').run(['', '', 'validate']);
    await require('./index').run(['', '', 'tag-search', 'bug']);

    expect(console.error).toHaveBeenNthCalledWith(1, 'Error: "upload" is now "app upload --directory <dir>"');
    expect(console.error).toHaveBeenNthCalledWith(2, 'Error: "validate" is now "app validate"');
    expect(console.error).toHaveBeenNthCalledWith(3, 'Error: "tag-search" is now "tag search --query <query>"');
    expect(process.exit).toHaveBeenCalledTimes(3);
    expect(process.exit).toHaveBeenCalledWith(2);
  });

  it('should reject unknown flags and missing required flags', async function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await require('./index').run(['', '', 'app', 'info', '--unknown=value', '--host=foo', '--token=bar']);
    await require('./index').run(['', '', 'app', 'info', '--host=foo', '--token=bar']);

    expect(console.error).toHaveBeenNthCalledWith(1, 'Error: Unknown option "--unknown"');
    expect(console.error).toHaveBeenNthCalledWith(2, 'Error: Option "--app" is required');
    expect(info).not.toHaveBeenCalled();
  });

  it('should preserve short flag spelling in unknown option errors', async function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await require('./index').run(['', '', 'app', 'list', '-j', '--host=foo', '--token=bar']);

    expect(console.error).toHaveBeenCalledWith('Error: Unknown option "-j"');
    expect(process.exit).toHaveBeenCalledWith(2);
  });

  it('should list paging options on commands instead of common options', async function () {
    await require('./index').run(['', '', '--help']);

    expect(console.log).not.toHaveBeenCalledWith(expect.stringMatching(/^{2}--skip N/));
    expect(console.log).not.toHaveBeenCalledWith(expect.stringMatching(/^{2}--limit N/));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('app list [--skip N] [--limit N]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('app logs --app <app> [--limit N]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('app logs --app <app> --script <script> [--skip N] [--limit N]'));
  });

  it('should reject pagination that the selected command does not use', async function () {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await require('./index').run(['', '', 'app', 'logs', '--app=my-app', '--skip=5', '--host=foo', '--token=bar']);
    await require('./index').run(['', '', 'group', 'members', '--group=developers', '--limit=5', '--host=foo', '--token=bar']);
    await require('./index').run(['', '', 'user', 'info', '--user=alex', '--limit=5', '--host=foo', '--token=bar']);

    expect(console.error).toHaveBeenNthCalledWith(1, 'Error: Option "--skip" is only supported with "--script"');
    expect(console.error).toHaveBeenNthCalledWith(2, 'Error: Options "--skip" and "--limit" are only supported when "--group" is omitted');
    expect(console.error).toHaveBeenNthCalledWith(3, 'Error: Unknown option "--limit"');
    expect(process.exit).toHaveBeenCalledTimes(3);
  });

  it.each([
    ['app upload', ['app', 'upload']],
    ['app download', ['app', 'download', '--app=my-app']],
    ['app validate', ['app', 'validate']],
    ['app scripts', ['app', 'scripts', '--app=my-app', '--file-key=manifest']],
    ['app settings-set', ['app', 'settings-set', '--app=my-app']],
    ['app enable', ['app', 'enable', '--app=my-app']],
    ['app disable', ['app', 'disable', '--app=my-app']],
    ['app attach', ['app', 'attach', '--app=my-app', '--project=DEMO']],
    ['app detach', ['app', 'detach', '--app=my-app', '--project=DEMO']],
  ])('should reject structured output for %s', async (_name, commandArgs) => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await require('./index').run(['', '', ...commandArgs, '--json']);

    expect(console.error).toHaveBeenCalledWith('Error: Option "--json" is not supported for this command');
    expect(process.exit).toHaveBeenCalledWith(2);
  });
});
