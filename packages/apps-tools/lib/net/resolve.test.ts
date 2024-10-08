import {resolve} from './resolve';

describe('resolve', function () {
  it('should add default protocol', function () {
    expect(resolve('foo/', 'bar').href).toEqual('https://foo/bar');
  });

  it('should correct resolve url for YouTrack with context', function () {
    expect(resolve('http://foo/bar', '/zoo').href).toEqual('http://foo/bar/zoo');
  });
});
