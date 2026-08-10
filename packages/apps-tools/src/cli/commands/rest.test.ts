import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {Config} from '../../../@types/types.js';
import {restRequest} from './rest.js';

const config: Config = {
  host: 'https://youtrack.example.test',
  token: 'token',
  output: null,
  overwrite: null,
  manifest: null,
  schema: null,
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
  cwd: process.cwd(),
};

describe('restRequest', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('makes an authenticated GET request and prints JSON', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{"id":"1"}', {status: 200}));
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await restRequest(config, {path: '/api/issues?query=for:me'});

    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.method).toBe('GET');
    expect(request.url).toBe('https://youtrack.example.test/api/issues?query=for:me');
    expect(request.headers.get('Authorization')).toBe('Bearer token');
    expect(console.log).toHaveBeenCalledWith('{\n  "id": "1"\n}');
  });

  it('supports JSON bodies, custom headers, and YAML output', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{"ok":true}', {status: 200}));
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await restRequest({...config, yaml: true}, {
      path: 'api/issues',
      method: 'post',
      body: '{"summary":"Test"}',
      header: ['X-Test: value', 'Content-Type: application/custom+json'],
    });

    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.method).toBe('POST');
    expect(request.headers.get('X-Test')).toBe('value');
    expect(request.headers.get('Content-Type')).toBe('application/custom+json');
    expect(await request.text()).toBe('{"summary":"Test"}');
    expect(console.log).toHaveBeenCalledWith('ok: true');
  });

  it('prints non-JSON response bodies as text', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('plain response', {status: 200}));
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await restRequest(config, {path: '/api/text'});

    expect(console.log).toHaveBeenCalledWith('plain response');
  });

  it.each([
    'https://other.example.test/api',
    '\\\\evil.com/x',
    'http:/evil.com/x',
    'ht' + '\t' + 'tps://evil.com/x',
  ])('rejects paths which resolve outside the configured host: %s', async path => {
    const fetchMock = jest.spyOn(global, 'fetch');
    const exitMock = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await restRequest(config, {path});

    expect(fetchMock).not.toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed JSON', async () => {
    const fetchMock = jest.spyOn(global, 'fetch');
    const exitMock = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await restRequest(config, {path: '/api/issues', body: '{bad'});

    expect(fetchMock).not.toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledTimes(1);
  });

  it('requires --yes for DELETE requests', async () => {
    const fetchMock = jest.spyOn(global, 'fetch');
    const exitMock = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await restRequest(config, {path: '/api/issues/1', method: 'DELETE'});

    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Error: DELETE requests require --yes');
    expect(exitMock).toHaveBeenCalledTimes(1);
  });

  it('reports HTTP errors with status and response details', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{"error":"Nope"}', {status: 403, statusText: 'Forbidden'}));
    const exitMock = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await restRequest(config, {path: '/api/secret'});

    expect(console.error).toHaveBeenCalledWith('Error: [403] Nope');
    expect(exitMock).toHaveBeenCalledWith(3);
  });
});
