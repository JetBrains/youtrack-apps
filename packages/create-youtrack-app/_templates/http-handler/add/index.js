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

function parsePermissions(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined) {
    return undefined;
  }

  return String(value).split(',').map(permission => permission.trim()).filter(Boolean);
}

module.exports = {
  prompt: async ({ prompter, args }) => {
    const answers = {};

    if (args.handlerName) {
      answers.handlerName = String(args.handlerName);
    } else {
      const response = await prompter.prompt({
        type: "input",
        name: "handlerName",
        initial: 'http-handler',
        validate: validateNotEmpty,
        message: "What do you want to name this HTTP handler?",
      });
      answers.handlerName = response.handlerName;
    }

    if (args.path) {
      answers.path = String(args.path);
    } else {
      const response = await prompter.prompt({
        type: "input",
        name: "path",
        initial: 'my-path',
        validate: validateNotEmpty,
        message: "What path should this handler respond to?",
      });
      answers.path = response.path;
    }

    if (args.method) {
      answers.method = String(args.method).toUpperCase();
    } else {
      const response = await prompter.prompt({
        type: "select",
        name: "method",
        initial: 'GET',
        message: "Which HTTP method should this handler respond to?",
        choices: ['GET', 'POST', 'PUT', 'DELETE']
      });
      answers.method = response.method;
    }

    if (args.handlerScope) {
      answers.handlerScope = String(args.handlerScope);
    } else {
      const response = await prompter.prompt({
        type: "select",
        name: "handlerScope",
        message: "Do you want this HTTP handler to be globally available or scoped to an entity?",
        choices: ['global', 'user', 'issue', 'article', 'project']
      });
      answers.handlerScope = response.handlerScope;
    }

    const permissions = parsePermissions(args.permissions);
    if (permissions !== undefined) {
      answers.permissions = permissions;
    } else {
      const response = await prompter.prompt({
        type: "multiselect",
        name: "permissions",
        message: "Do you want to limit access to this handler based on permissions? Leave empty to make it available to everyone.",
        choices: PERMISSIONS.map(({ key, description }) => ({
          message: `"${key}": ${description}`,
          name: key,
        }))
      });
      answers.permissions = response.permissions;
    }

    return answers;
  },
};
