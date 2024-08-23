import nock from 'nock';
import {request} from './request';
import {HttpMessage} from './httpmessage';
import {ErrorWithStatusCodeAndData} from '../../@types/types';

const options = {
  method: 'GET',
  headers: {'content-type': 'application/json'},
};

nock.back.setMode('record');

describe('request.test', function () {
  beforeEach(function () {
    nock.disableNetConnect();
  });

  it('should send http request', async () => {
    nock('http://localhost:80').get('/foo').reply(200, response({}));

    await request('http://localhost:80/foo', options);
  });

  it('should send https request', async () => {
    nock('https://localhost:80').get('/foo').reply(200, response({}));

    await request('https://localhost:80/foo', options);
  });

  it('should pass response in callback', async () => {
    expect.assertions(1);
    nock('https://localhost:80').get('/foo').reply(200, response({}));

    const resp = await request('https://localhost:80/foo', options);
    expect(resp).toBeDefined();
  });

  it('should return parsed json data', async () => {
    expect.assertions(1);
    nock('https://localhost:80')
      .get('/foo')
      .reply(
        200,
        response({
          foo: 'foo',
        }),
        {
          'Content-Type': 'application/json',
        },
      );

    const res = await request('https://localhost:80/foo', options);
    if ('foo' in res) {
      expect(res.foo).toEqual('foo');
    }
  });

  it('should pass error to handler', async () => {
    expect.assertions(1);
    nock('https://localhost:80').get('/foo').reply(500, response({}));

    try {
      await request('https://localhost:80/foo', options);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should parse error response', async () => {
    nock('https://localhost:80')
      .get('/foo')
      .reply(
        500,
        response({
          foo: 'foo',
        }),
        {
          'Content-Type': 'application/json',
        },
      );

    try {
      await request('https://localhost:80/foo', options);
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as ErrorWithStatusCodeAndData).data?.foo).toEqual('foo');
    }
  });

  it('should pass query parameters', async () => {
    const message = HttpMessage('https://localhost:80/foo');
    message.searchParams.append('fields', 'foo');
    nock('https://localhost:80')
      .get('/foo')
      .query({
        fields: 'foo',
      })
      .reply(200, response({}));

    request(message, options);
  });

  function response(data: unknown): string {
    return JSON.stringify(data);
  }
});
