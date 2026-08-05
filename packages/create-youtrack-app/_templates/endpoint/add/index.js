const { validateNotEmpty } = require("../../utils");

module.exports = {
  prompt: async ({ prompter, args }) => {
    const scopeChoices = ['global', 'issue', 'project', 'custom'];
    const methodChoices = ['GET', 'POST', 'PUT', 'DELETE'];
    const hasEndpointFlags = ['scope', 'path', 'method', 'request-type', 'response-type', 'controller']
      .some(flag => Object.hasOwn(args, flag));

    const pathPrefix = args.scope || (await prompter.prompt({
      type: 'select',
      name: 'pathPrefix',
      message: 'Which endpoint scope do you want to use?',
      choices: [
        { name: 'global', message: 'global - Global endpoint' },
        { name: 'issue', message: 'issue - Issue-specific endpoint' },
        { name: 'project', message: 'project - Project-specific endpoint' },
        { name: 'custom', message: 'custom - Enter a custom path' }
      ]
    })).pathPrefix;

    if (!scopeChoices.includes(String(pathPrefix))) {
      throw new Error(`Invalid endpoint scope: ${pathPrefix}`);
    }

    const pathSuffix = args.path || (await prompter.prompt({
      type: 'input',
      name: 'pathSuffix',
      message: pathPrefix === 'custom'
        ? 'What path should this endpoint use? (relative to router/, for example, integration/trigger)'
        : `What path should this endpoint use after ${pathPrefix}/? (for example, testSteps)`,
      validate: validateNotEmpty
    })).pathSuffix;

    const method = String(args.method || (await prompter.prompt({
      type: 'select',
      name: 'method',
      message: 'Which HTTP method should this endpoint use?',
      choices: methodChoices
    })).method).toUpperCase();
    if (!methodChoices.includes(method)) {
      throw new Error(`Invalid endpoint method: ${method}`);
    }

    let reqType = args['request-type'];
    if (reqType === undefined) {
      reqType = hasEndpointFlags
        ? 'never'
        : (await prompter.prompt({
          type: 'input',
          name: 'reqType',
          message: 'What request type should this endpoint use? (for example, MyReqDto or never)',
          initial: 'never'
        })).reqType;
    }

    let resType = args['response-type'];
    if (resType === undefined) {
      resType = hasEndpointFlags
        ? 'never'
        : (await prompter.prompt({
          type: 'input',
          name: 'resType',
          message: 'What response type should this endpoint use? (for example, MyResDto or never)',
          initial: 'never'
        })).resType;
    }

    const controller = args.controller !== undefined
      ? args.controller
      : hasEndpointFlags ? '' : (await prompter.prompt({
        type: 'input',
        name: 'controller',
        message: 'Which controller function should this endpoint call? Leave empty to generate the handler directly in this file.'
      })).controller;

    const endpointPath = pathPrefix === 'custom' ? pathSuffix : `${pathPrefix}/${pathSuffix}`;
    return {
      folderPath: endpointPath.replace(/^\//, ''),
      method,
      reqType: String(reqType || 'never'),
      resType: String(resType || 'never'),
      controller: String(controller || '')
    };
  }
};
