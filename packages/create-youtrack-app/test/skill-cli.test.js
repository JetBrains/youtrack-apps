const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { Buffer } = require('node:buffer');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const {
  downloadSkillRelease,
  installSkill,
  getSkillStatus,
  getLatestSkillRelease,
  runSystemAgentScan,
} = require('../utils/agent-skill');

const PKG_DIR = path.join(__dirname, '..');
const CLI_PATH = path.join(PKG_DIR, 'index.js');
const TEST_HOME = path.join(PKG_DIR, 'tmp', 'test-skill-home');
const TEST_PROJECT = path.join(PKG_DIR, 'tmp', 'test-skill-project');
const TEST_SOURCE = path.join(PKG_DIR, 'tmp', 'test-skill-source');
const SKILL_NAME = 'youtrack-apps-skill';
const UNIX_PLATFORMS = ['aix', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos'];

function getCrc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createStoredZip(entries) {
  const files = [];
  const directory = [];
  let offset = 0;

  for (const { name, contents } of entries) {
    const fileName = Buffer.from(name);
    const fileContents = Buffer.from(contents);
    const crc = getCrc32(fileContents);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(fileContents.length, 18);
    localHeader.writeUInt32LE(fileContents.length, 22);
    localHeader.writeUInt16LE(fileName.length, 26);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(fileContents.length, 20);
    centralHeader.writeUInt32LE(fileContents.length, 24);
    centralHeader.writeUInt16LE(fileName.length, 28);
    centralHeader.writeUInt32LE(offset, 42);

    files.push(localHeader, fileName, fileContents);
    directory.push(centralHeader, fileName);
    offset += localHeader.length + fileName.length + fileContents.length;
  }

  const directoryBuffer = Buffer.concat(directory);
  const endOfDirectory = Buffer.alloc(22);
  endOfDirectory.writeUInt32LE(0x06054b50, 0);
  endOfDirectory.writeUInt16LE(entries.length, 8);
  endOfDirectory.writeUInt16LE(entries.length, 10);
  endOfDirectory.writeUInt32LE(directoryBuffer.length, 12);
  endOfDirectory.writeUInt32LE(offset, 16);

  return Buffer.concat([...files, directoryBuffer, endOfDirectory]);
}

function createSkillRelease(version = '1.0.0') {
  return {
    tag_name: `skill/${SKILL_NAME}/v${version}`,
    published_at: '2026-08-13T10:00:00Z',
    assets: [{
      name: `${SKILL_NAME}-v${version}.zip`,
      browser_download_url: `https://example.test/${version}.zip`,
    }],
  };
}

function createSkillDownloadFetch(release, archive) {
  const requests = { releases: 0, archive: 0 };

  return {
    requests,
    fetch: async url => {
      if (url.includes('/releases?')) {
        requests.releases += 1;
        return {
          ok: true,
          json: async () => [release],
        };
      }

      requests.archive += 1;
      return {
        ok: true,
        arrayBuffer: async () => archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength),
      };
    },
  };
}

function runCLI(args) {
  try {
    const output = execFileSync('node', [CLI_PATH, ...args], {
      cwd: PKG_DIR,
      encoding: 'utf8',
      env: {
        ...process.env,
        YOUTRACK_SKILL_HOME: TEST_HOME,
        NO_COLOR: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return { success: true, output };
  } catch (error) {
    return {
      success: false,
      output: `${error.stdout || ''}${error.stderr || ''}`,
      error,
    };
  }
}

function agentConfigDir(agent) {
  return {
    claude: '.claude',
    codex: '.codex',
    junie: '.junie',
  }[agent];
}

function targetDir(agent, scope = 'global') {
  const root = scope === 'global' ? TEST_HOME : TEST_PROJECT;
  return path.join(root, agentConfigDir(agent), 'skills', SKILL_NAME);
}

function targetDirFor(root, agent) {
  return path.join(root, agentConfigDir(agent), 'skills', SKILL_NAME);
}

describe('Agent skill CLI', () => {
  beforeEach(() => {
    fs.rmSync(TEST_HOME, { recursive: true, force: true });
    fs.rmSync(TEST_PROJECT, { recursive: true, force: true });
    fs.rmSync(TEST_SOURCE, { recursive: true, force: true });
    fs.mkdirSync(TEST_PROJECT, { recursive: true });
    fs.mkdirSync(TEST_SOURCE, { recursive: true });
    fs.writeFileSync(path.join(TEST_SOURCE, 'SKILL.md'), '# Test skill\n');
    fs.writeFileSync(path.join(TEST_PROJECT, 'package.json'), '{"name":"test-project"}\n');
  });

  afterEach(() => {
    fs.rmSync(TEST_HOME, { recursive: true, force: true });
    fs.rmSync(TEST_PROJECT, { recursive: true, force: true });
    fs.rmSync(TEST_SOURCE, { recursive: true, force: true });
  });

  test('skill install uses global symlinks for all supported agents', async () => {
    await installSkill({ homeDir: TEST_HOME, sourceDir: TEST_SOURCE });
    assert.strictEqual(fs.existsSync(path.join(targetDir('codex'), 'SKILL.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetDir('claude'), 'SKILL.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetDir('junie'), 'SKILL.md')), true);
    assert.strictEqual(fs.lstatSync(targetDir('codex')).isSymbolicLink(), true);
    assert.strictEqual(fs.lstatSync(targetDir('claude')).isSymbolicLink(), true);
    assert.strictEqual(fs.lstatSync(targetDir('junie')).isSymbolicLink(), true);
    assert.match(fs.readFileSync(path.join(targetDir('codex'), 'SKILL.md'), 'utf8'), /Test skill/);
  });

  test('selects the newest published skill release that has the expected ZIP asset', async () => {
    const createRelease = (version, publishedAt) => ({
      tag_name: `skill/youtrack-apps-skill/v${version}`,
      published_at: publishedAt,
      assets: [{
        name: `youtrack-apps-skill-v${version}.zip`,
        browser_download_url: `https://example.test/${version}.zip`,
      }],
    });
    const latestRelease = await getLatestSkillRelease({
      fetch: async () => ({
        ok: true,
        json: async () => [createRelease('1.0.0', '2026-08-13T10:00:00Z'), createRelease('1.1.0', '2026-08-13T11:00:00Z')],
      }),
    });

    assert.strictEqual(latestRelease.details.version, '1.1.0');
  });

  test('downloads, extracts, and reuses a cached skill release on Unix-like systems', {
    skip: !UNIX_PLATFORMS.includes(process.platform),
  }, async () => {
    const release = createSkillRelease('1.2.3');
    const archive = createStoredZip([{
      name: `${SKILL_NAME}/SKILL.md`,
      contents: '# Downloaded skill\n',
    }]);
    const { fetch, requests } = createSkillDownloadFetch(release, archive);

    const cacheDir = await downloadSkillRelease({ homeDir: TEST_HOME, fetch });

    assert.strictEqual(cacheDir, path.join(TEST_HOME, '.youtrack', 'skills', SKILL_NAME, '1.2.3'));
    assert.strictEqual(fs.readFileSync(path.join(cacheDir, 'SKILL.md'), 'utf8'), '# Downloaded skill\n');
    assert.deepStrictEqual(requests, { releases: 1, archive: 1 });

    const cachedDir = await downloadSkillRelease({ homeDir: TEST_HOME, fetch });

    assert.strictEqual(cachedDir, cacheDir);
    assert.deepStrictEqual(requests, { releases: 2, archive: 1 });
  });

  test('uses PowerShell extraction when downloading a skill on Windows', async () => {
    const release = createSkillRelease('2.0.0');
    const archive = createStoredZip([{
      name: `${SKILL_NAME}/SKILL.md`,
      contents: '# Windows skill\n',
    }]);
    const { fetch } = createSkillDownloadFetch(release, archive);
    const commands = [];
    const cacheDir = await downloadSkillRelease({
      homeDir: TEST_HOME,
      fetch,
      platform: 'win32',
      spawnSync: (command, args, options) => {
        commands.push({ command, args, options });
        const extractedSkillDir = path.join(args.at(-1), SKILL_NAME);
        fs.mkdirSync(extractedSkillDir, { recursive: true });
        fs.writeFileSync(path.join(extractedSkillDir, 'SKILL.md'), '# Windows skill\n');
        return { status: 0, stderr: '' };
      },
    });

    assert.strictEqual(fs.readFileSync(path.join(cacheDir, 'SKILL.md'), 'utf8'), '# Windows skill\n');
    assert.strictEqual(commands.length, 1);
    assert.strictEqual(commands[0].command, 'powershell.exe');
    assert.ok(commands[0].args.includes('-NoProfile'));
    assert.ok(commands[0].args.some(arg => arg.includes('Expand-Archive')));
    assert.strictEqual(commands[0].options.shell, false);
  });

  test('--version prints the package version', () => {
    const result = runCLI(['--version']);

    assert.strictEqual(result.success, true, result.output);
    assert.strictEqual(result.output.trim(), require('../package.json').version);
  });

  test('package declares the Node.js version required for skill downloads', () => {
    assert.strictEqual(require('../package.json').engines.node, '>=18');
  });

  test('project-level install uses hard copies', async () => {
    const results = await installSkill({
      sourceDir: TEST_SOURCE,
      agent: 'codex',
      scope: 'project',
      cwd: TEST_PROJECT,
      homeDir: TEST_HOME,
    });

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].deploymentType, 'copy');
    assert.strictEqual(fs.existsSync(path.join(targetDir('codex', 'project'), 'SKILL.md')), true);
    assert.strictEqual(fs.lstatSync(targetDir('codex', 'project')).isSymbolicLink(), false);
  });

  test('project-level install uses the current directory without searching parent project markers', async () => {
    const nestedProjectDir = path.join(TEST_PROJECT, 'examples', 'nested-app');
    fs.mkdirSync(nestedProjectDir, { recursive: true });
    fs.mkdirSync(path.join(TEST_PROJECT, '.git'));

    const results = await installSkill({
      sourceDir: TEST_SOURCE,
      agent: 'codex',
      scope: 'project',
      cwd: nestedProjectDir,
      homeDir: TEST_HOME,
    });

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].targetDir, targetDirFor(nestedProjectDir, 'codex'));
    assert.strictEqual(fs.existsSync(path.join(targetDirFor(nestedProjectDir, 'codex'), 'SKILL.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetDir('codex', 'project'), 'SKILL.md')), false);
  });

  test('status reports installed and not installed based on target directories', async () => {
    await installSkill({
      sourceDir: TEST_SOURCE,
      agent: 'codex',
      scope: 'global',
      homeDir: TEST_HOME,
    });

    const statuses = getSkillStatus({
      agent: 'all',
      scope: 'global',
      homeDir: TEST_HOME,
      cwd: TEST_PROJECT,
    });

    const codex = statuses.find(status => status.agent === 'codex');
    const claude = statuses.find(status => status.agent === 'claude');
    const junie = statuses.find(status => status.agent === 'junie');

    assert.strictEqual(codex.installed, true);
    assert.strictEqual(codex.isSymlink, true);
    assert.strictEqual(claude.installed, false);
    assert.strictEqual(junie.installed, false);
  });

  test('agent discovery scans only supported agents', () => {
    const results = runSystemAgentScan({
      homeDir: TEST_HOME,
      cwd: TEST_PROJECT,
      env: { PATH: process.env.PATH || '' },
    });

    assert.deepStrictEqual(results.map(result => result.agent).sort(), ['claude', 'codex', 'junie']);
    assert.strictEqual(results.every(result => result.projectAvailable), true);
    assert.strictEqual(results.every(result => result.projectRoot === TEST_PROJECT), true);
  });

  test('invalid skill command fails with a clear error', () => {
    const result = runCLI(['skill', 'discover']);

    assert.strictEqual(result.success, false, 'Command should fail');
    assert.match(result.output, /Unknown command "skill discover"/);
  });
});
