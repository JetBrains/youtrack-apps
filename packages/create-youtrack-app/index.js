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
      message: `This will generate the scaffolding for a new YouTrack app in the following directory: ${chalk.bold(cwd)}\n\nContinue?`,
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

Let's add your first widget!
To add more widgets later, run the following command: ${chalk.magenta('npx @jetbrains/create-youtrack-app widget add')}

====================================
  `);
  await runHygen(["widget", "add", ...argv]);

  if (
    await new Confirm({
      initial: true,
      message: `Would you like your app to have its own settings (to define these settings later, run ${chalk.magenta('npx @jetbrains/create-youtrack-app settings init')})`,
    }).run()
  ) {
    await runHygen(["settings", "init", ...argv]);
  }

  console.log(`
${chalk.bold('======= Your app has been created! =======')}

Please wait for just a moment. Dependencies are being installed by npm ${chalk.magenta('npm install')}:
`);

  const installProcess = execa("npm", ["install"], {cwd});
  installProcess.stdout.pipe(process.stdout);
  await installProcess;

  console.log(`
${chalk.bold('Done. All dependencies are now installed!')}

If you want to upload and test the app in your YouTrack site, you'll need to generate a permanent access token first.

For instructions, please visit https://www.jetbrains.com/help/youtrack/server/manage-permanent-token.html

Once you have this token, open your development environment and use the following commands to compile and upload the app:

1. ${chalk.magenta('npm run build')}
2. ${chalk.magenta('npm run upload -- --host http://your-youtrack.url --token perm:cm9...')}

To add more features to your app, run the generator script again.
Run ${chalk.magenta('npx @jetbrains/create-youtrack-app --help')} to explore available options.`);
})();
