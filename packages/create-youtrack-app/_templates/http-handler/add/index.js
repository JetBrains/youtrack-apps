const {validateNotEmpty} = require('../../utils');
const {PERMISSIONS} = require('../../consts');

// If Enhanced DX flow is invoked, skip legacy prompts entirely.
// We detect it by presence of a sub-command token 'enhanced-dx' or explicit flags passed from index.js (e.g., --ytScope/--edx).
const argv = process.argv || [];
const isEnhancedDX = !!process.env.EDX || argv.includes('enhanced-dx') || argv.includes('--ytScope') || argv.includes('--edx');

if (isEnhancedDX) {
  module.exports = [];
  return;
}

module.exports = [
  {
    type: "input",
    name: "handlerName",
    initial: 'http-handler',
    validate: validateNotEmpty,
    message: "What is the name of your HTTP handler?",
  },
  {
    type: "input",
    name: "path",
    initial: 'my-path',
    validate: validateNotEmpty,
    message: "What path should your handler respond to?",
  },
  {
    type: "select",
    name: "method",
    initial: 'GET',
    message: "What HTTP method should your handler respond to?",
    choices: ['GET', 'POST', 'PUT', 'DELETE']
  },
  {
    type: "select",
    name: "handlerScope",
    message: "Would you like to attach your HTTP handler to some entityt scope or should it be globally available",
    choices: ['global', 'user', 'issue', 'article', 'project']
  },
  {
    type: "multiselect",
    name: "permissions",
    message: "Would you like to limit access to this handler? Leave empty to keep it awailable for everyone",
    choices: PERMISSIONS.map(({ key, description }) => ({
      message: `"${key}": ${description}`,
      name: key,
    }))
  }
];
