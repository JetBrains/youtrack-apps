import {resolveAppName} from './upload-utils';
import os from 'os';
import fs from 'fs';
import path from 'path';

const testApp = 'testApp';
const testAppName = 'test';

describe('resolveAppName util', function () {
  let testDir = '';
  let outDir;
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(process, 'exit').mockImplementation();
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-test'));
    testDir = path.resolve(outDir, testApp);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    outDir = '';
    testDir = '';
  });

  it('should successfully resolve app dir with manifest.json', async function () {
    const manifest = path.resolve(testDir, 'manifest.json');
    const manifestContent = JSON.stringify({name: testAppName});
    fs.mkdirSync(testDir);
    fs.writeFileSync(manifest, manifestContent);
    const appName = resolveAppName(testDir);

    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
    expect(appName).toEqual(testAppName);
  });

  it("should fail if app folder doesn't have manifest.json", async function () {
    fs.mkdirSync(testDir);
    resolveAppName(testDir);

    expect(console.error).toHaveBeenCalledWith("Error: App doesn't contain manifest.json file");
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("should fail if app folder doesn't exist", async function () {
    resolveAppName(testDir);

    expect(console.error).toHaveBeenCalledWith("Error: App directory doesn't exist");
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
