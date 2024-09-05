import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import {DEFAULT_SCHEMA_URL} from './validate';
import {tmpDir} from '../../lib/fs/tmpdir';
import {readFile} from 'node:fs/promises';

const TEST_APP = 'testApp';
const TEST_APP_NAME = 'test';

describe('validate', () => {
  let testDir = '';
  let outDir = '';
  let manifestPath = '';
  let manifestContent = '';

  const testSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://foo.json',
    properties: {
      name: {
        type: 'string',
        pattern: '^[a-z0-9-_.~]+$',
      },
      widgets: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          properties: {
            key: {
              pattern: '^[a-z0-9-_.~]+$',
              type: 'string',
            },
            name: {
              type: 'string',
            },
            indexPath: {
              type: 'string',
              pattern: '.*index\\.html$',
            },
          },
          required: ['key', 'name', 'indexPath'],
        },
      },
    },
    required: ['name'],
    type: 'object',
  };

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-test'));
    testDir = path.resolve(outDir, TEST_APP);
    manifestPath = path.resolve(testDir, 'manifest.json');
    manifestContent = JSON.stringify({name: TEST_APP_NAME});
  });

  afterEach(() => {
    jest.resetAllMocks();
    outDir = '';
    testDir = '';
    manifestPath = '';
    manifestContent = '';
  });

  beforeAll(() => {
    removeTmpSchema();
  });

  it('should exit if no directory or manifest file provided', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation();

    require('./index').run(['', '', 'validate']);

    expect(console.error).toHaveBeenCalledWith('Error: No directory or manifest file provided');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should exit if manifest file is not a JSON file', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation();

    require('./index').run(['', '', 'validate', testDir, '--manifest=foo.txt']);

    expect(console.error).toHaveBeenCalledWith('Error: Manifest file must be a JSON file');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should exit if schema file is not a JSON file', async () => {
    const manifestPath = path.resolve(testDir, 'manifest.json');
    const manifestContent = JSON.stringify({name: TEST_APP_NAME});
    fs.mkdirSync(testDir);
    fs.writeFileSync(manifestPath, manifestContent);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation();

    await require('./index').run(['', '', 'validate', testDir, '--schema=foo.txt']);

    expect(console.error).toHaveBeenCalledWith('Error: Schema file must be a JSON file');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should use default schema if no schema provided', async () => {
    fs.mkdirSync(testDir);
    fs.writeFileSync(manifestPath, manifestContent);

    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation();
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(jest.fn(() => Promise.resolve({json: () => Promise.resolve({})})) as jest.Mock);

    await require('./index').run(['', '', 'validate', testDir]);

    expect(fetch).toHaveBeenCalledWith(DEFAULT_SCHEMA_URL);
  });

  it('should use schema url provided', async () => {
    fs.mkdirSync(testDir);
    fs.writeFileSync(manifestPath, manifestContent);
    removeTmpSchema();

    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation();
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(jest.fn(() => Promise.resolve({json: () => Promise.resolve({}), ok: true})) as jest.Mock);

    await require('./index').run(['', '', 'validate', testDir, '--schema=http://foo.json']);

    expect(fetch).toHaveBeenCalledWith('http://foo.json');
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should validate manifest', async () => {
    const manifestContent = JSON.stringify({
      name: TEST_APP_NAME,
      widgets: [{key: 'key', name: 'name', indexPath: 'index.html'}],
    });
    fs.mkdirSync(testDir);
    fs.writeFileSync(manifestPath, manifestContent);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation();
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(
        jest.fn(() => Promise.resolve({json: () => Promise.resolve(testSchema), ok: true})) as jest.Mock,
      );

    await require('./index').run(['', '', 'validate', testDir]);

    expect(fetch).toHaveBeenCalledWith(DEFAULT_SCHEMA_URL);
    expect(console.error).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Manifest is valid!');
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should not validate manifest', async () => {
    removeTmpSchema();
    const manifestContent = JSON.stringify({name: TEST_APP_NAME, widgets: []});
    fs.mkdirSync(testDir);
    fs.writeFileSync(manifestPath, manifestContent);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation();
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(
        jest.fn(() => Promise.resolve({json: () => Promise.resolve(testSchema), ok: true})) as jest.Mock,
      );

    await require('./index').run(['', '', 'validate', testDir]);

    expect(fetch).toHaveBeenCalledWith(DEFAULT_SCHEMA_URL);
    expect(console.error).toHaveBeenCalledWith('Error: "widgets" must NOT have fewer than 1 items');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should use schema from tmp', async () => {
    const manifestContent = JSON.stringify({name: TEST_APP_NAME, widgets: []});
    const tmpSchema = JSON.parse(await readFile(tmpDir('schema.json'), {encoding: 'utf8'}));
    fs.mkdirSync(testDir);
    fs.writeFileSync(manifestPath, manifestContent);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation();
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(
        jest.fn(() => Promise.resolve({json: () => Promise.resolve(testSchema), ok: true})) as jest.Mock,
      );

    await require('./index').run(['', '', 'validate', testDir]);

    expect(fetch).not.toHaveBeenCalled();
    expect(tmpSchema).toEqual(testSchema);
    expect(console.error).toHaveBeenCalledWith('Error: "widgets" must NOT have fewer than 1 items');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

function removeTmpSchema() {
  fs.rmSync(tmpDir('schema.json'), {force: true});
}
