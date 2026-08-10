const fs = require('node:fs');
const path = require('node:path');

const skillName = 'youtrack-apps-skill';
const sourceDir = path.resolve(__dirname, '..', '..', '..', 'skills', skillName);
const targetDir = path.resolve(__dirname, '..', 'skills', skillName);

if (process.argv.includes('--clean')) {
  fs.rmSync(path.dirname(targetDir), { recursive: true, force: true });
  process.exit(0);
}

if (!fs.existsSync(path.join(sourceDir, 'SKILL.md'))) {
  throw new Error(`Could not find the skill source at ${sourceDir}.`);
}

fs.rmSync(path.dirname(targetDir), { recursive: true, force: true });
fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });
