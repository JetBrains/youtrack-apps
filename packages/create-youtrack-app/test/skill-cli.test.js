const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const {
  findSkillDirectory,
  downloadSkill,
  installSkill,
  getSkillStatus,
  runSystemAgentScan,
} = require('../utils/agent-skill');

const PKG_DIR = path.join(__dirname, '..');
const CLI_PATH = path.join(PKG_DIR, 'index.js');
const TEST_HOME = path.join(PKG_DIR, 'tmp', 'test-skill-home');
const TEST_PROJECT = path.join(PKG_DIR, 'tmp', 'test-skill-project');
const TEST_SOURCE = path.join(PKG_DIR, 'tmp', 'test-skill-source');
const SKILL_NAME = 'youtrack-apps-skill';

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

  test('findSkillDirectory locates a nested skill directory', () => {
    const nested = path.join(TEST_SOURCE, 'release', SKILL_NAME);
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, 'SKILL.md'), '# Test skill\n');
    assert.strictEqual(findSkillDirectory(path.join(TEST_SOURCE, 'release')), nested);

    const empty = path.join(TEST_SOURCE, 'empty');
    fs.mkdirSync(empty, { recursive: true });
    assert.strictEqual(findSkillDirectory(empty), null);
  });

  test('skill download authenticates release and asset requests with GITHUB_TOKEN', async () => {
    const requests = [];
    const fetch = async (url, options) => {
      requests.push({ url, options });

      if (requests.length === 1) {
        return {
          ok: true,
          json: async () => ({
            assets: [{
              name: 'youtrack-apps-skill.zip',
              url: 'https://api.github.com/repos/JetBrains/youtrack-app-agent-kit/releases/assets/1',
            }],
          }),
        };
      }

      return { ok: false, status: 500 };
    };

    await assert.rejects(
      downloadSkill({
        cacheDir: path.join(TEST_HOME, 'authenticated-cache'),
        fetch,
        githubToken: 'test-token',
      }),
      /HTTP 500/
    );

    assert.strictEqual(requests.length, 2);
    assert.strictEqual(requests[0].options.headers.Authorization, 'Bearer test-token');
    assert.strictEqual(requests[1].options.headers.Authorization, 'Bearer test-token');
    assert.strictEqual(requests[0].options.headers.Accept, 'application/vnd.github+json');
    assert.strictEqual(requests[1].options.headers.Accept, 'application/octet-stream');
  });

  test('skill download does not send authorization without a GitHub token', async () => {
    const requests = [];
    const fetch = async (url, options) => {
      requests.push({ url, options });
      return { ok: false, status: 404 };
    };

    await assert.rejects(
      downloadSkill({
        cacheDir: path.join(TEST_HOME, 'unauthenticated-cache'),
        fetch,
        githubToken: '',
      }),
      /release is not available yet/
    );

    assert.strictEqual(requests.length, 1);
    assert.strictEqual('Authorization' in requests[0].options.headers, false);
  });

  afterEach(() => {
    fs.rmSync(TEST_HOME, { recursive: true, force: true });
    fs.rmSync(TEST_PROJECT, { recursive: true, force: true });
    fs.rmSync(TEST_SOURCE, { recursive: true, force: true });
  });

  test('skill install defaults to global symlinks for all supported agents', async () => {
    await installSkill({ sourceDir: TEST_SOURCE, homeDir: TEST_HOME });
    assert.strictEqual(fs.existsSync(path.join(targetDir('codex'), 'SKILL.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetDir('claude'), 'SKILL.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetDir('junie'), 'SKILL.md')), true);
    assert.strictEqual(fs.lstatSync(targetDir('codex')).isSymbolicLink(), true);
    assert.strictEqual(fs.lstatSync(targetDir('claude')).isSymbolicLink(), true);
    assert.strictEqual(fs.lstatSync(targetDir('junie')).isSymbolicLink(), true);
  });

  test('--version prints the package version', () => {
    const result = runCLI(['--version']);

    assert.strictEqual(result.success, true, result.output);
    assert.strictEqual(result.output.trim(), require('../package.json').version);
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
