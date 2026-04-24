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
    message: "What is the name you want to assign to this app package?",
  },
  {
    type: "input",
    name: "title",
    initial: 'My App',
    message: "What is the title (a user-friendly name) you want to give this app?",
  },
  {
    type: "input",
    name: "description",
    message: "What is the description you want to give to this app?",
  },
  {
    type: "input",
    name: "vendor",
    message: "Who is the vendor (or creator) of this app?",
  },
  {
    type: "input",
    name: "vendorUrl",
    message: "What is the URL of the app vendor's website?",
  },
];
