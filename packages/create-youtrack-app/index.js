#!/usr/bin/env node

const { runner } = require("hygen");
const chalk = require('chalk');
const execa = require("execa");
const { Confirm } = require("enquirer");
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
    logger: new Logger.default((msg, ...res) => {
      if (msg.startsWith('Loaded templates:')) {
        return;
      }
      return console.log(msg, ...res);
    }),
    createPrompter: () => require("enquirer"),
    exec: (action, body) => {
      const opts = body && body.length > 0 ? { input: body } : {};
      return execa.shell(action, opts);
    },
    debug: !!process.env.DEBUG,
  });
}

(async function run() {
  if ('help' in args || 'h' in args) {
    require('./help');
    return;
  }
  const hasHygenParams = ["init", "extension-property", "widget", "settings", "http-handler"].some(
    (key) => new Set(argv).has(key)
  );

  // If some hygen-related params passed in, we call generator directly
  if (hasHygenParams) {
    return runHygen();
  }

  if (
    !(await new Confirm({
      initial: true,
      message: `New YouTrack App will be created in a directory ${chalk.bold(cwd)}\n\nContinue?`,
    }).run())
  ) {
    return;
  }

  const appRes = await runHygen(["init", "vite-app", ...argv]);
  if (!appRes.success) {
    return;
  }

  console.log(`
====================================

Now let's add first widget!
You can add more later by running ${chalk.magenta('npx @jetbrains/create-youtrack-app widget add')}

====================================
  `);
  await runHygen(["widget", "add", ...argv]);

  if (
    await new Confirm({
      initial: true,
      message: `Would you like your App to have Settings (you can do it later by running ${chalk.magenta('npx @jetbrains/create-youtrack-app settings init')})`,
    }).run()
  ) {
    await runHygen(["settings", "init", ...argv]);
  }

  console.log(`
${chalk.bold('======= Your App is created! =======')}

We are now installing dependencies by running ${chalk.magenta('npm install')}:
`);

  const installProcess = execa("npm", ["install"], {cwd});
  installProcess.stdout.pipe(process.stdout);
  await installProcess;

  console.log(`
${chalk.bold('Done!')}

Now you would need to create a Permanent Token to upload the app into YouTrack isntance

See documentation https://www.jetbrains.com/help/youtrack/server/manage-permanent-token.html

Once you have this token, you could build and upload the App:

1. ${chalk.magenta('npm run build')}
2. ${chalk.magenta('npm run upload -- --host http://your-youtrack.url --token perm:cm9...')}

You can add more features to your app by running generator again.
Run ${chalk.magenta('npx @jetbrains/create-youtrack-app --help')} to explore available options.`);
})();
