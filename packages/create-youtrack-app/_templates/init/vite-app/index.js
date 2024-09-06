const {validateNotEmpty} = require('../../utils');
const h = require('hygen/dist/helpers').default;

module.exports = [
  {
    type: "input",
    name: "appName",
    initial: 'my-app',
    validate: validateNotEmpty,
    format: input => h.changeCase.lower(h.inflection.dasherize(input)),
    result: input => h.changeCase.lower(h.inflection.dasherize(input)),
    message: "What is the name of your app?",
  },
  {
    type: "input",
    name: "title",
    initial: 'My App',
    message: "What is the title of your app?",
  },
  {
    type: "input",
    name: "description",
    message: "What is the description of your app?",
  },
  {
    type: "input",
    name: "vendor",
    message: "What is the vendor of your app?",
  },
  {
    type: "input",
    name: "vendorUrl",
    message: "What is the vendor URL of your app?",
  },
];
