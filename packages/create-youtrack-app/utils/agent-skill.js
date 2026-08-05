const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Buffer } = require('node:buffer');
const { execFileSync, spawnSync } = require('node:child_process');

const SKILL_NAME = 'youtrack-apps-skill';
const SKILL_REPOSITORY = 'JetBrains/youtrack-app-agent-kit';
const SKILL_RELEASES_URL = `https://api.github.com/repos/${SKILL_REPOSITORY}/releases/latest`;

const ALL_AGENTS = 'all';
const ALL_SCOPES = 'all';
const GLOBAL_SCOPE = 'global';
const PROJECT_SCOPE = 'project';
const DEFAULT_AGENT_SELECTION = ALL_AGENTS;
const DEFAULT_INSTALL_SCOPE = GLOBAL_SCOPE;

const SUPPORTED_AGENTS = [
  {
    id: 'claude',
    displayName: 'Claude Code',
    configDir: '.claude',
    binary: 'claude',
  },
  {
    id: 'codex',
    displayName: 'Codex CLI',
    configDir: '.codex',
    binary: 'codex',
  },
  {
    id: 'junie',
    displayName: 'Junie',
    configDir: '.junie',
    binary: 'junie',
  },
];

const SUPPORTED_AGENT_BY_ID = Object.fromEntries(
  SUPPORTED_AGENTS.map(agent => [agent.id, agent])
);
const SUPPORTED_AGENT_IDS = SUPPORTED_AGENTS.map(agent => agent.id);
const VALID_AGENT_VALUES = [...SUPPORTED_AGENT_IDS, ALL_AGENTS];
const VALID_SCOPE_VALUES = [GLOBAL_SCOPE, PROJECT_SCOPE];
const VALID_SCOPE_INPUT_VALUES = [...VALID_SCOPE_VALUES, ALL_SCOPES];
const DEPLOYMENT_BY_SCOPE = {
  [GLOBAL_SCOPE]: 'symlink',
  [PROJECT_SCOPE]: 'copy',
};

function getHomeDir() {
  return process.env.YOUTRACK_SKILL_HOME || os.homedir();
}

function assertSupportedAgent(agentId) {
  if (!SUPPORTED_AGENT_BY_ID[agentId]) {
    throw new Error(`Invalid agent: "${agentId}". Must be one of: ${VALID_AGENT_VALUES.join(', ')}.`);
  }
}

function expandAgents(agentInput = DEFAULT_AGENT_SELECTION) {
  const requestedAgents = String(agentInput || DEFAULT_AGENT_SELECTION)
    .split(',')
    .map(agent => agent.trim().toLowerCase())
    .filter(Boolean);
  const expandedAgents = [];

  for (const agentId of requestedAgents) {
    if (agentId === ALL_AGENTS) {
      expandedAgents.push(...SUPPORTED_AGENT_IDS);
      continue;
    }

    assertSupportedAgent(agentId);
    expandedAgents.push(agentId);
  }

  return [...new Set(expandedAgents)];
}

function expandScopes(scopeInput = DEFAULT_INSTALL_SCOPE) {
  const scope = String(scopeInput || DEFAULT_INSTALL_SCOPE).toLowerCase();

  if (!VALID_SCOPE_INPUT_VALUES.includes(scope)) {
    throw new Error(`Invalid skill scope: "${scopeInput}". Must be one of: ${VALID_SCOPE_INPUT_VALUES.join(', ')}.`);
  }

  return scope === ALL_SCOPES ? [...VALID_SCOPE_VALUES] : [scope];
}

function resolveProjectRoot(options = {}) {
  return path.resolve(options.projectRoot || options.cwd || process.cwd());
}

function getAgentSkillsDir(agentId, scope, options = {}) {
  assertSupportedAgent(agentId);

  const agent = SUPPORTED_AGENT_BY_ID[agentId];
  const rootDir = scope === GLOBAL_SCOPE
    ? (options.homeDir || getHomeDir())
    : resolveProjectRoot(options);

  return path.join(rootDir, agent.configDir, 'skills');
}

function getSkillCacheDir(options = {}) {
  return options.cacheDir || path.join(getHomeDir(), '.local', 'share', 'youtrack-app', SKILL_NAME);
}

function findSkillDirectory(rootDir) {
  if (fs.existsSync(path.join(rootDir, 'SKILL.md'))) {
    return rootDir;
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      const nestedSkillDir = findSkillDirectory(entryPath);
      if (nestedSkillDir) return nestedSkillDir;
    }
  }

  return null;
}

function getGitHubHeaders(accept, options = {}) {
  const headers = { Accept: accept };
  const token = options.githubToken ?? process.env.GITHUB_TOKEN;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function downloadSkill(options = {}) {
  const cacheDir = getSkillCacheDir(options);
  if (fs.existsSync(path.join(cacheDir, 'SKILL.md'))) {
    return cacheDir;
  }

  const downloadDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'youtrack-skill-'));
  const archivePath = path.join(downloadDir, 'skill.zip');
  const extractDir = path.join(downloadDir, 'extract');
  const fetchImpl = options.fetch || globalThis.fetch;

  try {
    const releaseResponse = await fetchImpl(SKILL_RELEASES_URL, {
      headers: getGitHubHeaders('application/vnd.github+json', options),
      signal: globalThis.AbortSignal.timeout(30_000),
    });
    if (!releaseResponse.ok) {
      if (releaseResponse.status === 404) {
        throw new Error('YouTrack app builder skill release is not available yet.');
      }
      throw new Error(`Could not find the latest skill release on GitHub (HTTP ${releaseResponse.status}).`);
    }

    const release = await releaseResponse.json();
    const releaseAsset = release.assets?.find(asset => asset.name === 'youtrack-apps-skill.zip');
    if (!releaseAsset?.url) {
      throw new Error('The latest skill release does not contain youtrack-apps-skill.zip.');
    }

    const response = await fetchImpl(releaseAsset.url, {
      headers: getGitHubHeaders('application/octet-stream', options),
      signal: globalThis.AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('YouTrack app builder skill release is not available yet.');
      }
      throw new Error(`Could not download the YouTrack app builder skill from GitHub (HTTP ${response.status}).`);
    }

    fs.writeFileSync(archivePath, Buffer.from(await response.arrayBuffer()));
    fs.mkdirSync(extractDir, { recursive: true });
    execFileSync('tar', ['-xf', archivePath, '-C', extractDir], { stdio: 'ignore' });

    const sourceDir = findSkillDirectory(extractDir);
    if (!sourceDir) {
      throw new Error(`The YouTrack app builder release does not contain ${SKILL_NAME}/SKILL.md.`);
    }

    const stagingDir = `${cacheDir}.tmp`;
    fs.rmSync(stagingDir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(cacheDir), { recursive: true });
    fs.cpSync(sourceDir, stagingDir, { recursive: true });
    fs.rmSync(cacheDir, { recursive: true, force: true });
    fs.renameSync(stagingDir, cacheDir);
    return cacheDir;
  } catch (error) {
    if (error?.cause?.code === 'ENOTFOUND') {
      throw new Error(`Could not reach GitHub while downloading the YouTrack app builder skill: ${error.message}`);
    }
    throw error;
  } finally {
    fs.rmSync(downloadDir, { recursive: true, force: true });
  }
}

function createInstallPlan(sourceDir, options = {}) {
  const agents = expandAgents(options.agent || DEFAULT_AGENT_SELECTION);
  const scopes = expandScopes(options.scope || DEFAULT_INSTALL_SCOPE);

  return scopes.flatMap(scope => agents.map(agentId => {
    const targetDir = path.join(getAgentSkillsDir(agentId, scope, options), SKILL_NAME);
    const deploymentType = DEPLOYMENT_BY_SCOPE[scope];

    return {
      agent: agentId,
      scope,
      sourceDir,
      targetDir,
      deploymentType,
    };
  }));
}

function removePreviousInstall(targetDir) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}

function prepareTargetParent(targetDir) {
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
}

function copySkillDirectory(sourceDir, targetDir) {
  removePreviousInstall(targetDir);
  prepareTargetParent(targetDir);
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

function symlinkSkillDirectory(sourceDir, targetDir) {
  removePreviousInstall(targetDir);
  prepareTargetParent(targetDir);
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  fs.symlinkSync(sourceDir, targetDir, linkType);
}

function deploySkill(planItem) {
  if (planItem.deploymentType === 'symlink') {
    symlinkSkillDirectory(planItem.sourceDir, planItem.targetDir);
    return;
  }

  copySkillDirectory(planItem.sourceDir, planItem.targetDir);
}

async function installSkill(options = {}) {
  const sourceDir = options.sourceDir || await downloadSkill(options);
  return createInstallPlan(sourceDir, options).map(planItem => {
    deploySkill(planItem);

    return {
      agent: planItem.agent,
      scope: planItem.scope,
      targetDir: planItem.targetDir,
      deploymentType: planItem.deploymentType,
    };
  });
}

function getInstallStatus(agentId, scope, options = {}) {
  const targetDir = path.join(getAgentSkillsDir(agentId, scope, options), SKILL_NAME);
  const targetExists = fs.existsSync(targetDir);
  const targetStats = targetExists ? fs.lstatSync(targetDir) : null;

  return {
    agent: agentId,
    scope,
    targetDir,
    installed: targetExists,
    isSymlink: Boolean(targetStats && targetStats.isSymbolicLink()),
  };
}

function getSkillStatus(options = {}) {
  const agents = expandAgents(options.agent || DEFAULT_AGENT_SELECTION);
  const scopes = expandScopes(options.scope || DEFAULT_INSTALL_SCOPE);

  return scopes.flatMap(scope => (
    agents.map(agentId => getInstallStatus(agentId, scope, options))
  ));
}

function findBinary(binary, options = {}) {
  const command = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(command, [binary], {
    encoding: 'utf8',
    env: options.env || process.env,
    shell: false,
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  if (result.status !== 0) {
    return null;
  }

  return String(result.stdout || '').split(/\r?\n/).find(Boolean) || null;
}

function getAgentDiscovery(agent, options = {}) {
  const homeDir = options.homeDir || getHomeDir();
  const projectRoot = resolveProjectRoot(options);
  const globalBaseDir = path.join(homeDir, agent.configDir);
  const binaryPath = findBinary(agent.binary, options);

  return {
    agent: agent.id,
    displayName: agent.displayName,
    configDir: agent.configDir,
    binary: agent.binary,
    binaryPath,
    binaryFound: Boolean(binaryPath),
    globalBaseDir,
    globalSkillsDir: path.join(globalBaseDir, 'skills'),
    globalConfigExists: fs.existsSync(globalBaseDir),
    detected: fs.existsSync(globalBaseDir) && Boolean(binaryPath),
    projectRoot,
    projectAvailable: true,
    projectSkillsDir: path.join(projectRoot, agent.configDir, 'skills'),
  };
}

function runSystemAgentScan(options = {}) {
  return SUPPORTED_AGENTS.map(agent => getAgentDiscovery(agent, options));
}

function formatAgentName(agentId) {
  const agent = SUPPORTED_AGENT_BY_ID[agentId];
  return agent ? agent.displayName : agentId.charAt(0).toUpperCase() + agentId.slice(1);
}

function formatInstallResults(results, action) {
  const verb = action === 'update' ? 'Updated' : 'Installed';
  const lines = [`${verb} YouTrack app builder skill:`];

  for (const result of results) {
    lines.push(`- ${formatAgentName(result.agent)} (${result.scope}, ${result.deploymentType}): ${result.targetDir}`);
  }

  return lines.join('\n');
}

function formatStatusResults(statuses) {
  const lines = ['YouTrack app builder skill status:'];

  for (const status of statuses) {
    const agentName = formatAgentName(status.agent);
    const deployment = status.isSymlink ? 'symlink' : 'copy';

    if (status.installed) {
      lines.push(`- ${agentName} (${status.scope}): installed (${deployment})`);
    } else {
      lines.push(`- ${agentName} (${status.scope}): not installed`);
    }

    lines.push(`  ${status.targetDir}`);
  }

  return lines.join('\n');
}

module.exports = {
  findSkillDirectory,
  formatInstallResults,
  formatStatusResults,
  getSkillStatus,
  installSkill,
  runSystemAgentScan,
  downloadSkill,
};
