const { validateNotEmpty } = require("../../utils");

module.exports = {
  prompt: ({ prompter }) => {
    return prompter
      .prompt([
        {
          type: 'select',
          name: 'pathPrefix',
          message: 'Select endpoint path prefix:',
          choices: [
            { name: 'global', message: 'global - Global endpoints' },
            { name: 'issue', message: 'issue - Issue-specific endpoints' },
            { name: 'project', message: 'project - Project-specific endpoints' },
            { name: 'custom', message: 'custom - Enter custom path' }
          ]
        },
        {
          type: 'input',
          name: 'pathSuffix',
          message: ({ pathPrefix }) => pathPrefix === 'custom' 
            ? 'Endpoint path (relative to router/, e.g. integration/trigger):'
            : `Endpoint path suffix (after ${pathPrefix}/, e.g. testSteps):`,
          validate: validateNotEmpty
        },
        {
          type: 'select',
          name: 'method',
          message: 'HTTP Method:',
          choices: ['GET', 'POST', 'PUT', 'DELETE']
        },
        {
          type: 'input',
          name: 'reqType',
          message: 'Request type (e.g. MyReqDto, never):',
          initial: 'never'
        },
        {
          type: 'input',
          name: 'resType',
          message: 'Response type (e.g. MyResDto, never):',
          initial: 'never'
        },
        {
          type: 'input',
          name: 'controller',
          message: 'Controller function to call (leave empty for inline):'
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
