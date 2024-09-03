#!/usr/bin/env node

const { runner } = require("hygen");
const { Confirm } = require('enquirer');
const Logger = require("hygen/dist/logger");
const path = require("node:path");
const defaultTemplates = path.join(__dirname, "_templates");
const argv = process.argv.slice(2);
const args = require("minimist")(argv);
const cwd = path.resolve(process.cwd(), args.cwd || ".");

function runHygen(hygenArgs = argv) {
  return runner(hygenArgs, {
    templates: defaultTemplates,
    cwd,
    logger: new Logger.default(console.log.bind(console)),
    createPrompter: () => require("enquirer"),
    exec: (action, body) => {
      const opts = body && body.length > 0 ? { input: body } : {};
      return require("execa").shell(action, opts);
    },
    debug: !!process.env.DEBUG
  });
}

(async function run() {
  const hasHygenParams = ["init", "entity", "widget", "property", "help"].some((key) =>
    new Set(argv).has(key)
  );

  // If some hygen-related params passed in, we call generator directly
  if (hasHygenParams) {
    return runHygen();
  }

  if (
    !(await new Confirm({
      initial: true,
      message: `New YouTrack App will be created in a directory "${cwd}".\n\nContinue?`,
    }).run())
  ) {
    return;
  }

  const appRes = await runHygen(['init', 'vite-app', ...argv]);
  if (!appRes.success) {
    return;
  }

  console.log(`
======= Your App is created ========

Now let's add first widget!
You can add more later by running "npx @jetbrains/create-youtrack-app widget add"

====================================
  `)
  await runHygen(['widget', 'add', ...argv]);

  if (
    !(await new Confirm({
      initial: true,
      message: `Would you like your App to have Settings (you can do it later by running "npx @jetbrains/create-youtrack-app init settings")`,
    }).run())
  ) {
    return;
  }

  await runHygen(['init', 'settings', ...argv]);

  console.log(`
Done. Now run:

1. npm install
2. npm run build
3. npm run upload -- --host http://your-youtrack.url
4. Follow command output to generate API token

You can add more features to your app by running generator again. See help:`);
  await runHygen(['help', 'show', ...argv]);
})();
