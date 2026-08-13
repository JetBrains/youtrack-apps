const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Buffer } = require('node:buffer');
const { spawnSync } = require('node:child_process');

const SKILL_NAME = 'youtrack-apps-skill';
const SKILL_RELEASE_TAG_PREFIX = `skill/${SKILL_NAME}/v`;
const SKILL_RELEASES_URL = 'https://api.github.com/repos/JetBrains/youtrack-apps/releases?per_page=100';

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

function getHomeDir(options = {}) {
  return options.homeDir || process.env.YOUTRACK_SKILL_HOME || os.homedir();
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
    ? getHomeDir(options)
    : resolveProjectRoot(options);

  return path.join(rootDir, agent.configDir, 'skills');
}

function getGitHubHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': '@jetbrains/create-youtrack-app',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function getSkillReleaseDetails(release) {
  if (!release || typeof release.tag_name !== 'string' || !release.tag_name.startsWith(SKILL_RELEASE_TAG_PREFIX)) {
    return null;
  }

  const version = release.tag_name.slice(SKILL_RELEASE_TAG_PREFIX.length);
  if (!version || !/^[0-9A-Za-z._-]+$/.test(version)) {
    return null;
  }

  const archiveName = `${SKILL_NAME}-v${version}.zip`;
  const asset = Array.isArray(release.assets)
    ? release.assets.find(candidate => candidate && candidate.name === archiveName && candidate.browser_download_url)
    : null;

  return asset ? { asset, version } : null;
}

function getFetch(options = {}) {
  const fetchFn = options.fetch || globalThis.fetch;
  if (typeof fetchFn !== 'function') {
    throw new Error('Downloading the YouTrack Apps skill requires Node.js 18 or later.');
  }

  return fetchFn;
}

async function getLatestSkillRelease(options = {}) {
  const fetchFn = getFetch(options);
  let response;

  try {
    response = await fetchFn(SKILL_RELEASES_URL, { headers: getGitHubHeaders() });
  } catch (error) {
    throw new Error(`Could not reach GitHub to download the YouTrack Apps skill: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(`Could not list YouTrack Apps skill releases from GitHub (HTTP ${response.status}).`);
  }

  const releases = await response.json();
  if (!Array.isArray(releases)) {
    throw new Error('GitHub returned an invalid skill release response.');
  }

  const matchingReleases = releases
    .filter(release => !release.draft && !release.prerelease)
    .map(release => ({ release, details: getSkillReleaseDetails(release) }))
    .filter(candidate => candidate.details)
    .sort((left, right) => {
      const leftDate = Date.parse(left.release.published_at || left.release.created_at || 0);
      const rightDate = Date.parse(right.release.published_at || right.release.created_at || 0);
      return rightDate - leftDate;
    });

  if (matchingReleases.length === 0) {
    throw new Error('Could not find a published YouTrack Apps skill release with its ZIP archive.');
  }

  return matchingReleases[0];
}

function getSkillCacheDir(version, options = {}) {
  return path.join(getHomeDir(options), '.youtrack', 'skills', SKILL_NAME, version);
}

function getZipExtractionCommand(archivePath, destinationDir, platform = process.platform) {
  if (platform === 'win32') {
    return {
      command: 'powershell.exe',
      args: [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        '$ErrorActionPreference = "Stop"; Expand-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force',
        archivePath,
        destinationDir,
      ],
      unavailableMessage: 'PowerShell with Expand-Archive is required to extract the YouTrack Apps skill on Windows.',
    };
  }

  if (['aix', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos'].includes(platform)) {
    return {
      command: 'unzip',
      args: ['-q', archivePath, '-d', destinationDir],
      unavailableMessage: 'The unzip command is required to extract the YouTrack Apps skill on Unix-like systems.',
    };
  }

  throw new Error(`Unsupported platform for YouTrack Apps skill extraction: ${platform}`);
}

function extractZipArchive(archivePath, destinationDir, options = {}) {
  const extraction = getZipExtractionCommand(archivePath, destinationDir, options.platform);
  const runCommand = options.spawnSync || spawnSync;
  const result = runCommand(extraction.command, extraction.args, {
    encoding: 'utf8',
    shell: false,
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  if (result.error || result.status !== 0) {
    const detail = String(result.stderr || result.error?.message || '').trim();
    throw new Error(`${extraction.unavailableMessage}${detail ? ` ${detail}` : ''}`);
  }
}

async function downloadSkillRelease(options = {}) {
  const { release, details } = await getLatestSkillRelease(options);
  const cacheDir = getSkillCacheDir(details.version, options);

  if (fs.existsSync(path.join(cacheDir, 'SKILL.md'))) {
    return cacheDir;
  }

  const cacheParentDir = path.dirname(cacheDir);
  fs.mkdirSync(cacheParentDir, { recursive: true });
  const stagingDir = fs.mkdtempSync(path.join(cacheParentDir, `.${SKILL_NAME}-`));

  try {
    const fetchFn = getFetch(options);
    const response = await fetchFn(details.asset.browser_download_url, {
      headers: getGitHubHeaders(),
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Could not download YouTrack Apps skill ${release.tag_name} (HTTP ${response.status}).`);
    }

    const archivePath = path.join(stagingDir, details.asset.name);
    fs.writeFileSync(archivePath, Buffer.from(await response.arrayBuffer()));
    extractZipArchive(archivePath, stagingDir, options);

    const extractedSkillDir = path.join(stagingDir, SKILL_NAME);
    if (!fs.existsSync(path.join(extractedSkillDir, 'SKILL.md'))) {
      throw new Error(`The YouTrack Apps skill archive for ${release.tag_name} does not contain ${SKILL_NAME}/SKILL.md.`);
    }

    fs.rmSync(cacheDir, { recursive: true, force: true });
    fs.renameSync(extractedSkillDir, cacheDir);
    return cacheDir;
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
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
  const sourceDir = options.sourceDir || await downloadSkillRelease(options);
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
  const homeDir = getHomeDir(options);
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
  const lines = [`${verb} YouTrack Apps skill:`];

  for (const result of results) {
    lines.push(`- ${formatAgentName(result.agent)} (${result.scope}, ${result.deploymentType}): ${result.targetDir}`);
  }

  return lines.join('\n');
}

function formatStatusResults(statuses) {
  const lines = ['YouTrack Apps skill status:'];

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
  downloadSkillRelease,
  formatInstallResults,
  formatStatusResults,
  getLatestSkillRelease,
  getSkillStatus,
  installSkill,
  runSystemAgentScan,
};
