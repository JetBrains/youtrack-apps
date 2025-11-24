#!/usr/bin/env node

const { runner } = require("hygen");
const chalk = require('chalk');
const execa = require("execa");
const { Confirm, Select, MultiSelect, Input } = require("enquirer");
const Logger = require("hygen/dist/logger");
const path = require("node:path");
const fs = require('node:fs');
const defaultTemplates = path.join(__dirname, "_templates");
const argv = process.argv.slice(2);
const args = require("minimist")(argv);
const cwd = path.resolve(process.cwd(), args.cwd || ".");
const { trimPathSegments } = require('./utils/sanitize');

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
  const hasHygenParams = ["init", "enhanced-dx", "extension-property", "widget", "settings", "http-handler", "endpoint"].some(
    (key) => new Set(argv).has(key)
  );

  // If some hygen-related params passed in, we call generator directly
  if (hasHygenParams) {
    // Intercept Enhanced DX http-handler flow for richer experience
    const isHttpHandlerCmd = new Set(argv).has('http-handler') && (new Set(argv).has('add') || !argv.find(a => a === 'init' || a === 'enhanced-dx' || a === 'settings' || a === 'widget' || a === 'extension-property' || a === 'endpoint'));
    if (isHttpHandlerCmd) {
      try {
        const pkgPath = path.join(cwd, 'package.json');
        const hasPkg = fs.existsSync(pkgPath);
        const pkg = hasPkg ? JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) : {};
        const isEnhancedDX = pkg.enhancedDX === true || pkg.enhancedDX === 'true';

        if (!isEnhancedDX) {
          // Fallback to legacy templates/flow
          return runHygen();
        }

        // Enhanced DX interactive flow
        const method = await new Select({
          name: 'method',
          message: 'Choose HTTP method:',
          choices: ['GET', 'POST', 'PUT', 'DELETE']
        }).run();

        const scope = await new Select({
          name: 'scope',
          message: 'Choose scope (first path segment):',
          choices: ['global', 'project', 'issue']
        }).run();

        // Unix-like, segment-aware tab completion for route path under src/backend/router/<scope>
        const scopeRoot = path.join(cwd, 'src', 'backend', 'router', scope);

        const listDirnames = (absDir) => {
          try {
            if (!fs.existsSync(absDir)) return [];
            return fs.readdirSync(absDir, { withFileTypes: true })
              .filter(d => d.isDirectory() && !d.name.startsWith('.'))
              .map(d => d.name);
          } catch { return []; }
        };

        const splitInput = (input) => {
          const normalized = String(input || '').replace(/\\+/g, '/').replace(/^\/+/, '');
          const idx = normalized.lastIndexOf('/');
          if (idx === -1) return { base: '', segment: normalized };
          return { base: normalized.slice(0, idx + 1), segment: normalized.slice(idx + 1) };
        };

        const lcp = (arr) => {
          if (!arr.length) return '';
          let prefix = arr[0];
          for (let i = 1; i < arr.length; i++) {
            let j = 0;
            while (j < prefix.length && j < arr[i].length && prefix[j] === arr[i][j]) j++;
            prefix = prefix.slice(0, j);
            if (!prefix) break;
          }
          return prefix;
        };

        const computeSuggestions = (input) => {
          const { base, segment } = splitInput(input);
          const absBase = path.join(scopeRoot, base);
          const dirs = listDirnames(absBase);
          const matches = segment ? dirs.filter(d => d.startsWith(segment)) : dirs;
          return matches.map(name => `${base}${name}/`);
        };

        // Input prompt with Unix-like tab completion (no selection list, Enter always accepts)
        const pathPrompt = new Input({
          name: 'routePath',
          message: 'Route path under src/backend/router/' + scope + ' (Tab: complete/cycle • Shift+Tab: previous • Enter: accept • empty: root):',
          initial: ''
        });

        // Cycling state for repeated Tab presses when there is no longer LCP extension
        let lastTabInput = '';
        let cycleIndex = 0;
        let lastTabTs = 0;
        // Maintain a dynamic footer text and expose it via a function, since Enquirer calls this.footer()
        let footerText = '';
        pathPrompt.footer = () => footerText;

        const updateFooter = (val) => {
          const suggestions = computeSuggestions(val || '');
          if (!suggestions.length) {
            footerText = chalk.dim('No matches • new segments will be created');
          } else {
            const maxShow = 10;
            const shown = suggestions.slice(0, maxShow).join('  ');
            const more = suggestions.length > maxShow ? chalk.dim(`  +${suggestions.length - maxShow} more`) : '';
            footerText = chalk.dim('Matches: ') + shown + more;
          }
        };

        pathPrompt.on('keypress', (_, key) => {
          const current = (pathPrompt.input || '').replace(/\\+/g, '/');
          if (key && key.name === 'tab') {
            const { base, segment } = splitInput(current);
            const suggestions = computeSuggestions(current);

            if (suggestions.length === 0) {
              process.stdout.write('\x07'); // bell
              updateFooter(current);
              if (typeof pathPrompt.render === 'function') pathPrompt.render();
              return;
            }

            const names = suggestions.map(s => s.slice(base.length).replace(/\/$/, ''));
            const prefix = lcp(names);

            let next = current;
            const now = Date.now();
            const isDoubleTab = now - lastTabTs < 500;
            lastTabTs = now;

            if (key.shift) {
              // Reverse cycle
              if (lastTabInput !== current) {
                cycleIndex = names.length; // start from end
              }
              cycleIndex = (cycleIndex - 1 + names.length) % names.length;
              const name = names[cycleIndex];
              next = `${base}${name}${name.endsWith('/') ? '' : '/'}`;
              lastTabInput = next;
            } else if (prefix && prefix.length > (segment || '').length) {
              // Extend to LCP
              next = `${base}${prefix}`;
              if (names.length === 1 && !next.endsWith('/')) next += '/';
              cycleIndex = 0;
              lastTabInput = next;
            } else {
              // No extension possible: cycle through candidates on repeated Tab
              if (lastTabInput !== current) {
                cycleIndex = 0;
              }
              const name = names[cycleIndex % names.length];
              next = `${base}${name}${name.endsWith('/') ? '' : '/'}`;
              cycleIndex++;
              lastTabInput = next;
            }

            // On double-Tab, just update footer to show all options prominently
            if (isDoubleTab && suggestions.length > 1) {
              const maxShow = 30;
              const shown = suggestions.slice(0, maxShow).join('  ');
              const more = suggestions.length > maxShow ? chalk.dim(`  +${suggestions.length - maxShow} more`) : '';
              footerText = chalk.dim('Matches: ') + shown + more;
            }

            pathPrompt.input = next;
            // Ensure cursor moves to the end after completion/cycling
            if (typeof next === 'string') {
              try { pathPrompt.cursor = next.length; } catch {}
            }
            updateFooter(next);
            if (typeof pathPrompt.render === 'function') pathPrompt.render();
            return;
          }

          // For other keys, keep footer up-to-date
          updateFooter(current);
          if (typeof pathPrompt.render === 'function') pathPrompt.render();
        });

        // Initialize footer before showing the prompt
        updateFooter('');
        let routePath = await pathPrompt.run();

        // Normalize routePath (trim repeated, leading & trailing slashes)
        routePath = trimPathSegments(routePath);

        // Permissions (optional)
        const { PERMISSIONS } = require(path.join(defaultTemplates, 'consts.js'));
        const permChoices = PERMISSIONS.map(p => ({ name: p.key, message: p.key }));
        const permissions = await new MultiSelect({
          name: 'permissions',
          message: 'Select permissions (optional, space to toggle, enter to confirm):',
          choices: permChoices,
          hint: 'Space to select, enter to confirm',
          validate: () => true
        }).run();

        // Confirm target file and overwrite if exists
        const targetRel = path.join('src', 'backend', 'router', scope, routePath ? routePath : '', `${method}.ts`);
        const targetAbs = path.join(cwd, targetRel);
        if (fs.existsSync(targetAbs)) {
          const overwrite = await new Confirm({
            initial: false,
            message: `File already exists: ${chalk.bold(targetRel)}. Overwrite?`
          }).run();
          if (!overwrite) {
            console.log(chalk.yellow('Aborted. No files were changed.'));
            return;
          }
        }

        const hygenArgs = [
          'http-handler',
          'enhanced-dx',
          '--ytScope', scope,
          '--routePath', routePath,
          '--method', method,
          '--permissions', permissions.join(',')
        ];

        // Mark Enhanced DX mode for any underlying prompts and run the specific action
        process.env.EDX = '1';
        await runHygen(hygenArgs);
        return;
      } catch (e) {
        console.error(chalk.red('Failed to generate http-handler:'), e);
        process.exitCode = 1;
        return;
      }
    }
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

  const appType = await new Select({
    name: 'appType',
    message: 'Choose your development approach:',
    choices: [
      {
        name: 'js',
        message: 'JavaScript (Basic widgets and backend.js)',
        hint: 'Simple approach with traditional backend.js file'
      },
      {
        name: 'ts',
        message: 'TypeScript (Enhanced DX with file-based routing)',
        hint: 'Advanced approach with type-safe APIs, file-based routing, and Zod validation'
      }
    ]
  }).run();

  const appName = await new Input({
    name: 'appName',
    message: 'Enter your app name:',
    initial: 'my-youtrack-app'
  }).run();

  // Auto-generate other required parameters
  const title = appName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const description = `A YouTrack app created with ${appType === 'ts' ? 'TypeScript' : 'JavaScript'}`;
  const vendor = 'VendorName';
  const vendorUrl = 'https://vendor.com';

  // Map js/ts to actual template names
  const templateName = appType === 'js' ? 'vite-app' : 'enhanced-dx';
  const appRes = await runHygen(["init", templateName, "--appName", appName, "--title", title, "--description", description, "--vendor", vendor, "--vendorUrl", vendorUrl, ...argv]);
  if (!appRes.success) {
    return;
  }

  console.log(`
====================================

Your enhanced-dx app has been created with demo examples!
To add more widgets later, run: ${chalk.magenta('npx @jetbrains/create-youtrack-app widget add')}
To add app settings later, run: ${chalk.magenta('npx @jetbrains/create-youtrack-app settings init')}

====================================
  `);

  console.log(`
${chalk.bold('======= Your app has been created! =======')}

Please wait for just a moment. Dependencies are being installed by npm ${chalk.magenta('npm install')}:
`);


  const installProcess = execa("npm", ["link", "@jetbrains/youtrack-enhanced-dx-tools"], {cwd});
  installProcess.stdout.pipe(process.stdout);
  await installProcess;

  // No explicit build of @jetbrains/youtrack-enhanced-dx-tools here.
  // The tools are consumed as Vite plugins and will be resolved/compiled by the app toolchain during dev/build.


  const buildCommand = 'npm run build';
  const additionalInfo = appType === 'ts' ? `

${chalk.bold('🚀 Enhanced DX Features:')}
- Type-safe API endpoints with automatic type generation
- File-based routing in src/backend/router/
- Zod schema validation in development
- Example endpoints: /global/health, /project/settings, /issue/metadata

${chalk.bold('Development workflow:')}
1. Add endpoints: Create {GET|POST}.ts files in src/backend/router/
2. Use @zod-to-schema comments for automatic validation
3. Import and use the type-safe API client in your widgets

` : '';

  console.log(`
${chalk.bold('Done. All dependencies are now installed!')}
${additionalInfo}
If you want to upload and test the app in your YouTrack site, you'll need to generate a permanent access token first.

For instructions, please visit https://www.jetbrains.com/help/youtrack/server/manage-permanent-token.html

Once you have this token, open your development environment and use the following commands to compile and upload the app:

1. ${chalk.magenta(buildCommand)}
2. ${chalk.magenta('npm run upload -- --host http://your-youtrack.url --token perm:cm9...')}

To add more features to your app, run the generator script again.
Run ${chalk.magenta('npx @jetbrains/create-youtrack-app --help')} to explore available options.`);
})();
