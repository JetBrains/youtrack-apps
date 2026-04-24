const { validateNotEmpty } = require("../../utils");

module.exports = {
  prompt: ({ prompter }) => {
    return prompter
      .prompt([
        {
          type: 'select',
          name: 'pathPrefix',
          message: 'Which endpoint scope do you want to use?',
          choices: [
            { name: 'global', message: 'global - Global endpoint' },
            { name: 'issue', message: 'issue - Issue-specific endpoint' },
            { name: 'project', message: 'project - Project-specific endpoint' },
            { name: 'custom', message: 'custom - Enter a custom path' }
          ]
        },
        {
          type: 'input',
          name: 'pathSuffix',
          message: ({ pathPrefix }) => pathPrefix === 'custom'
            ? 'What path should this endpoint use? (relative to router/, for example, integration/trigger)'
            : `What path should this endpoint use after ${pathPrefix}/? (for example, testSteps)`,
          validate: validateNotEmpty
        },
        {
          type: 'select',
          name: 'method',
          message: 'Which HTTP method should this endpoint use?',
          choices: ['GET', 'POST', 'PUT', 'DELETE']
        },
        {
          type: 'input',
          name: 'reqType',
          message: 'What request type should this endpoint use? (for example, MyReqDto or never)',
          initial: 'never'
        },
        {
          type: 'input',
          name: 'resType',
          message: 'What response type should this endpoint use? (for example, MyResDto or never)',
          initial: 'never'
        },
        {
          type: 'input',
          name: 'controller',
          message: 'Which controller function should this endpoint call? Leave empty to generate the handler directly in this file.'
        }
      ])
      .then(({ pathPrefix, pathSuffix, method, reqType, resType, controller }) => {
        const path = pathPrefix === 'custom' ? pathSuffix : `${pathPrefix}/${pathSuffix}`;
        const folderPath = path.replace(/^\//, ''); // strip leading slash
        return {
          folderPath,
          method: method.toUpperCase(),
          reqType,
          resType,
          controller
        };
      });
  }
};
