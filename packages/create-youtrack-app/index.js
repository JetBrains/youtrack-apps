#!/usr/bin/env node

const { runner } = require("hygen");
const { prompt } = require("enquirer");
const Logger = require("hygen/dist/logger");
const path = require("node:path");
const defaultTemplates = path.join(__dirname, "_templates");
const argv = process.argv.slice(2);
const args = require("minimist")(argv);
const cwd = path.resolve(process.cwd(), args.cwd || ".");

(async function run() {
  const hasHygenParams = ["init", "entity", "widget", "property"].some(
    (key) => !!args[key]
  );

  if (!hasHygenParams) {
    const response = await prompt({
      type: "confirm",
      name: "new-app",
      initial: true,
      message: `New YouTrack App will be created in a directory "${cwd}".\n\nContinue?`,
    });
    if (response === false) {
      return;
    }
    argv.unshift('init', 'vite-app');
  }

  runner(argv, {
    templates: defaultTemplates,
    cwd,
    logger: new Logger.default(console.log.bind(console)),
    createPrompter: () => require("enquirer"),
    exec: (action, body) => {
      const opts = body && body.length > 0 ? { input: body } : {};
      return require("execa").shell(action, opts);
    },
    debug: true,
  });
})();
