const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SKILL_NAME = 'youtrack-app-builder';
const METADATA_FILENAME = '.youtrack-skill-install.json';
const VALID_AGENT_VALUES = ['codex', 'claude', 'both'];
const AGENT_TARGETS = {
  codex: path.join('.agents', 'skills', SKILL_NAME),
  claude: path.join('.claude', 'skills', SKILL_NAME),
};

function getSkillSourceDir() {
  return path.join(__dirname, '..', 'resources', 'skill', SKILL_NAME);
}

function getPackageVersion() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return pkg.version;
}

function getHomeDir() {
  return process.env.YOUTRACK_SKILL_HOME || os.homedir();
}

function getTargetDir(agent, homeDir = getHomeDir()) {
  return path.join(homeDir, AGENT_TARGETS[agent]);
}

function normalizeAgent(agent = 'both') {
  const value = String(agent || 'both').toLowerCase();
  if (!VALID_AGENT_VALUES.includes(value)) {
    throw new Error(`Invalid agent: "${agent}". Must be one of: ${VALID_AGENT_VALUES.join(', ')}.`);
  }
  return value;
}

function expandAgents(agent = 'both') {
  const normalized = normalizeAgent(agent);
  return normalized === 'both' ? ['codex', 'claude'] : [normalized];
}

function ensureSkillSourceExists(sourceDir = getSkillSourceDir()) {
  const skillFile = path.join(sourceDir, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    throw new Error(`Bundled YouTrack app builder skill is missing at ${sourceDir}.`);
  }
}

function copySkillToTarget(sourceDir, targetDir) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

function writeInstallMetadata(targetDir, agent) {
  const metadata = {
    skill: SKILL_NAME,
    targetAgent: agent,
    sourcePackage: '@jetbrains/create-youtrack-app',
    sourcePackageVersion: getPackageVersion(),
    installedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(targetDir, METADATA_FILENAME),
    JSON.stringify(metadata, null, 2)
  );

  return metadata;
}

function installSkill(options = {}) {
  const sourceDir = getSkillSourceDir();
  ensureSkillSourceExists(sourceDir);

  return expandAgents(options.agent).map((agent) => {
    const targetDir = getTargetDir(agent, options.homeDir);
    copySkillToTarget(sourceDir, targetDir);
    const metadata = writeInstallMetadata(targetDir, agent);
    return { agent, targetDir, metadata };
  });
}

function readMetadata(targetDir) {
  const metadataPath = path.join(targetDir, METADATA_FILENAME);
  if (!fs.existsSync(metadataPath)) {
    return { metadata: null, metadataPath, error: null };
  }

  try {
    return {
      metadata: JSON.parse(fs.readFileSync(metadataPath, 'utf8')),
      metadataPath,
      error: null,
    };
  } catch (error) {
    return { metadata: null, metadataPath, error };
  }
}

function getSkillStatus(options = {}) {
  return expandAgents(options.agent).map((agent) => {
    const targetDir = getTargetDir(agent, options.homeDir);
    const skillFile = path.join(targetDir, 'SKILL.md');
    const metadataResult = readMetadata(targetDir);

    return {
      agent,
      targetDir,
      installed: Boolean(metadataResult.metadata && fs.existsSync(skillFile)),
      skillFileExists: fs.existsSync(skillFile),
      metadata: metadataResult.metadata,
      metadataPath: metadataResult.metadataPath,
      metadataError: metadataResult.error,
    };
  });
}

function formatAgentName(agent) {
  return agent.charAt(0).toUpperCase() + agent.slice(1);
}

function formatInstallResults(results, action) {
  const verb = action === 'update' ? 'Updated' : 'Installed';
  const lines = [`${verb} YouTrack app builder skill:`];

  for (const result of results) {
    lines.push(`- ${formatAgentName(result.agent)}: ${result.targetDir}`);
  }

  return lines.join('\n');
}

function formatStatusResults(statuses) {
  const lines = ['YouTrack app builder skill status:'];

  for (const status of statuses) {
    const agentName = formatAgentName(status.agent);

    if (status.installed) {
      const version = status.metadata.sourcePackageVersion || 'unknown';
      const installedAt = status.metadata.installedAt || 'unknown time';
      lines.push(`- ${agentName}: installed (version ${version}, installed ${installedAt})`);
    } else if (status.metadataError) {
      lines.push(`- ${agentName}: not installed (metadata is invalid)`);
    } else if (status.skillFileExists) {
      lines.push(`- ${agentName}: not installed (metadata is missing)`);
    } else {
      lines.push(`- ${agentName}: not installed`);
    }

    lines.push(`  ${status.targetDir}`);
  }

  return lines.join('\n');
}

module.exports = {
  AGENT_TARGETS,
  METADATA_FILENAME,
  VALID_AGENT_VALUES,
  expandAgents,
  formatInstallResults,
  formatStatusResults,
  getSkillStatus,
  installSkill,
};
