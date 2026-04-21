#!/usr/bin/env node

const { runner } = require("hygen");
const { styleText } = require("node:util");
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

function isCancelled(e) {
  return e === '' || (e && e.code === 'ERR_USE_AFTER_CLOSE');
}

process.on('uncaughtException', (e) => {
  if (isCancelled(e)) {
    console.log(styleText("yellow", '\nCancelled.'));
    process.exit(0);
  }
  throw e;
});

process.on('unhandledRejection', (reason) => {
  if (isCancelled(reason)) {
    console.log(styleText("yellow", '\nCancelled.'));
    process.exit(0);
  }
});

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

  // Map short aliases to full commands for NestJS-style simplicity
  const aliasMap = {
    'handler': 'http-handler',
    'h': 'http-handler',
    'property': 'extension-property',
    'prop': 'extension-property',
    'p': 'extension-property',
    'setting': 'settings',
    's': 'settings'
  };

  // Replace aliases in argv (create new array to avoid mutation issues)
  const normalizedArgv = argv.map(arg => aliasMap[arg] || arg);

  // Smart pattern detection for positional arguments

  // Pattern 1: HTTP Handler - scope/path syntax
  // Usage: handler global/health [--method GET] [--permissions read-issue]
  const handlerIndex = normalizedArgv.findIndex(a => a === 'http-handler');
  if (handlerIndex !== -1 && normalizedArgv[handlerIndex + 1]) {
    const pathArg = normalizedArgv[handlerIndex + 1];

    // Pattern: scope/path (e.g., "global/health" or "project/users/profile")
    if (pathArg.includes('/') && !pathArg.startsWith('--')) {
      const segments = pathArg.split('/');
      const scope = segments[0]; // first segment is scope
      const routePath = segments.slice(1).join('/'); // rest is path

      // Validate scope
      const validScopes = ['global', 'project', 'issue', 'article', 'user'];
      if (!validScopes.includes(scope)) {
        console.error(styleText("red", `Invalid scope: ${scope}. Must be one of: ${validScopes.join(', ')}`));
        process.exit(1);
      }

      const method = args.method || 'GET'; // Default to GET
      const permissions = args.permissions || '';

      // Check if enhanced-dx project
      const pkgPath = path.join(cwd, 'package.json');
      const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) : {};
      const isEnhancedDX = pkg.enhancedDX === true || pkg.enhancedDX === 'true';

      if (!isEnhancedDX) {
        console.error(styleText("red", 'This command requires an enhanced-dx project.'));
        process.exit(1);
      }

      // Confirm target file
      const targetRel = path.join('src', 'backend', 'router', scope, routePath || '', `${method}.ts`);
      const targetAbs = path.join(cwd, targetRel);

      if (fs.existsSync(targetAbs)) {
        const overwrite = await new Confirm({
          initial: false,
          message: `File already exists: ${styleText("bold", targetRel)}. Overwrite?`
        }).run();
        if (!overwrite) {
          console.log(styleText("yellow", 'Aborted.'));
          return;
        }
      }

      const hygenArgs = [
        'http-handler',
        'enhanced-dx',
        '--ytScope', scope,
        '--routePath', routePath,
        '--method', method,
        '--permissions', permissions
      ];

      process.env.EDX = '1';
      console.log(styleText("cyan", `\nGenerating ${method} handler at ${targetRel}...\n`));
      await runHygen(hygenArgs);
      console.log(styleText("green", `\n✓ HTTP handler created successfully!\n`));
      return;
    }
  }

  // Pattern 2: Extension Property - Entity.propertyName syntax
  // Usage: property Issue.customStatus [--type string] [--set | --multi true]
  const propIndex = normalizedArgv.findIndex(a => a === 'extension-property');
  if (propIndex !== -1 && normalizedArgv[propIndex + 1]) {
    const propArg = normalizedArgv[propIndex + 1];

    // Pattern: Entity.propertyName (e.g., "Issue.customStatus" or "Comment.rating")
    if (propArg.includes('.') && !propArg.startsWith('--')) {
      const [target, name] = propArg.split('.');

      // Validate target entity
      const validTargets = ['Issue', 'User', 'Project', 'Article'];
      if (!validTargets.includes(target)) {
        console.error(styleText("red", `Invalid target: ${target}. Must be one of: ${validTargets.join(', ')}`));
        process.exit(1);
      }

      // Validate property name (basic check)
      if (!name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        console.error(styleText("red", `Invalid property name: ${name}. Must be a valid identifier.`));
        process.exit(1);
      }

      const type = args.type || 'string'; // Default to string
      const validTypes = ['string', 'integer', 'float', 'boolean', 'Issue', 'User', 'Project', 'Article'];
      if (!validTypes.includes(type)) {
        console.error(styleText("red", `Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`));
        process.exit(1);
      }

      const isSet = args.set === true || args.set === 'true' || args.multi === true || args.multi === 'true';

      // Directly manipulate the entity-extensions.json file
      const entityExtensionsPath = path.join(cwd, 'src', 'entity-extensions.json');
      let entityExtensions;

      if (fs.existsSync(entityExtensionsPath)) {
        try {
          entityExtensions = JSON.parse(fs.readFileSync(entityExtensionsPath, 'utf-8'));
        } catch (err) {
          console.error(styleText("red", `Error: entity-extensions.json is invalid JSON: ${(err && err.message) || String(err)}`));
          process.exit(1);
        }
      } else {
        entityExtensions = { entityTypeExtensions: [] };
      }

      // Find or create the entity
      let extendingEntity = entityExtensions.entityTypeExtensions.find(
        (e) => e.entityType === target
      );

      if (!extendingEntity) {
        extendingEntity = {
          entityType: target,
          properties: {}
        };
        entityExtensions.entityTypeExtensions.push(extendingEntity);
      }

      // Add the property
      extendingEntity.properties[name] = {
        type: type,
        multi: isSet
      };

      // Write back to file
      fs.writeFileSync(entityExtensionsPath, JSON.stringify(entityExtensions, null, 2));

      console.log(styleText("green", `\n✓ Extension property created: ${target}.${name} (${type}${isSet ? '[]' : ''})\n`));
      return;
    }
  }

  // Pattern 3: Settings init - settings init syntax with optional args
  // Usage: settings init [--title "..."] [--description "..."]
  const settingsIndex = normalizedArgv.findIndex(a => a === 'settings');
  if (settingsIndex !== -1 && normalizedArgv[settingsIndex + 1] === 'init') {
    const title = args.title;
    const description = args.description;

    // If both args provided, create settings.json directly (bypasses interactive prompts)
    if (title && description) {
      const settingsPath = path.join(cwd, 'src', 'settings.json');

      // Check if settings.json already exists
      if (fs.existsSync(settingsPath)) {
        console.error(styleText("red", 'Error: settings.json already exists at src/settings.json'));
        process.exit(1);
      }

      // Create the settings schema
      const schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "title": title,
        "description": description,
        "properties": {},
        "required": []
      };

      fs.writeFileSync(settingsPath, JSON.stringify(schema, null, 2));
      console.log(styleText("green", `\n✓ Settings schema created at src/settings.json\n`));
      return;
    }

    // If args not provided, fall through to Hygen for interactive prompts
  }

  // Pattern 4: Settings add — always non-interactive, never falls through to Hygen
  // Usage: settings add --name <name> --type <type> [options...]
  if (settingsIndex !== -1 && normalizedArgv[settingsIndex + 1] === 'add') {
    const VALID_TYPES    = ['string', 'integer', 'number', 'boolean', 'object', 'array'];
    const VALID_SCOPES   = ['global', 'project', 'none'];
    const VALID_ENTITIES = ['Issue', 'User', 'Project', 'UserGroup', 'Article'];

    // -- Validate --name (String() guards against minimist numeric-parsing edge cases)
    const name = args.name != null ? String(args.name) : undefined;
    if (!name) {
      console.error(styleText("red", 'Error: --name is required'));
      process.exit(1);
    }
    if (/\s/.test(name)) {
      console.error(styleText("red", `Error: Invalid property name "${name}". Must not contain whitespace.`));
      process.exit(1);
    }

    // -- Validate --type
    const type = args.type;
    if (!type) {
      console.error(styleText("red", 'Error: --type is required'));
      process.exit(1);
    }
    if (!VALID_TYPES.includes(type)) {
      console.error(styleText("red", `Invalid type: "${type}". Must be one of: ${VALID_TYPES.join(', ')}`));
      process.exit(1);
    }

    // -- Validate --scope (optional)
    const scope = args.scope;
    if (scope !== undefined && !VALID_SCOPES.includes(scope)) {
      console.error(styleText("red", `Invalid scope: "${scope}". Must be one of: ${VALID_SCOPES.join(', ')}`));
      process.exit(1);
    }

    // -- Validate --entity (optional, only valid with object/array)
    const entity = args.entity != null ? String(args.entity) : undefined;
    if (entity !== undefined) {
      if (!['object', 'array'].includes(type)) {
        console.error(styleText("red", `Error: --entity can only be used with --type object or --type array`));
        process.exit(1);
      }
      if (!VALID_ENTITIES.includes(entity)) {
        console.error(styleText("red", `Invalid entity: "${entity}". Must be one of: ${VALID_ENTITIES.join(', ')}`));
        process.exit(1);
      }
    }

    // -- Require settings.json to exist
    const settingsPath = path.join(cwd, 'src', 'settings.json');
    if (!fs.existsSync(settingsPath)) {
      console.error(styleText("red", 'Error: settings.json does not exist at src/settings.json. Run "settings init" first.'));
      process.exit(1);
    }

    // -- Parse settings.json
    let schema;
    try {
      schema = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch (e) {
      console.error(styleText("red", `Error: Could not parse settings.json: ${e.message}`));
      process.exit(1);
    }

    // -- Guard duplicate property name
    if (schema.properties && schema.properties[name] !== undefined) {
      console.error(styleText("red", `Error: Property "${name}" already exists in settings.json`));
      process.exit(1);
    }

    // -- Build the property schema object
    const prop = { type };

    if (args.title)       prop.title       = args.title;
    if (args.description) prop.description = args.description;

    // String constraints
    if (type === 'string') {
      // Use !== undefined (not truthiness) so value 0 is never dropped
      if (args['min-length'] !== undefined) prop.minLength = Number(args['min-length']);
      if (args['max-length'] !== undefined) prop.maxLength = Number(args['max-length']);
      if (args.format)                      prop.format    = args.format;
      if (args.enum) {
        prop.enum = String(args.enum).split(',').map(v => v.trim());
      }
    }

    // Numeric constraints — exclusive variants take precedence over inclusive
    if (type === 'integer' || type === 'number') {
      if (args['exclusive-min'] !== undefined) {
        prop.exclusiveMinimum = Number(args['exclusive-min']);
      } else if (args.min !== undefined) {
        prop.minimum = Number(args.min);
      }
      if (args['exclusive-max'] !== undefined) {
        prop.exclusiveMaximum = Number(args['exclusive-max']);
      } else if (args.max !== undefined) {
        prop.maximum = Number(args.max);
      }
      if (args['multiple-of'] !== undefined) prop.multipleOf = Number(args['multiple-of']);
    }

    // Entity reference: stored directly on object, under items for array
    if (type === 'object' && entity) prop['x-entity'] = entity;
    if (type === 'array'  && entity) prop.items = { type: 'object', 'x-entity': entity };

    // Read-only + optional constant value
    if (args.readonly) {
      prop.readOnly = true;
      if (args.const !== undefined) {
        if (type === 'integer' || type === 'number') {
          prop.const = Number(args.const);
        } else {
          try { prop.const = JSON.parse(String(args.const)); }
          catch { prop.const = String(args.const); }
        }
      }
    }

    // Write-only
    if (args['write-only']) prop.writeOnly = true;

    // Scope (omit the key entirely when scope is "none" or not provided)
    if (scope && scope !== 'none') prop['x-scope'] = scope;

    // -- Mutate schema and write back
    if (!schema.properties) schema.properties = {};
    if (!Array.isArray(schema.required)) schema.required = [];

    schema.properties[name] = prop;
    if (args.required) schema.required.push(name);

    fs.writeFileSync(settingsPath, JSON.stringify(schema, null, 2));
    console.log(styleText("green", `\n✓ Added property "${name}" to src/settings.json\n`));
    return;
  }

  // Pattern 5: Widget - --key flag syntax (non-interactive when --key is provided)
  // Usage: widget --key <key> --extension-point <ep> [--name <name>] [--description <desc>]
  //                            [--permissions PERM1,PERM2] [--width <w>] [--height <h>]
  const widgetIndex = normalizedArgv.findIndex(a => a === 'widget');
  if (widgetIndex !== -1 && args.key !== undefined) {
    const key = String(args.key);

    const VALID_WIDGET_EXTENSION_POINTS = [
      'ADMINISTRATION_MENU_ITEM', 'ARTICLE_ABOVE_ACTIVITY_STREAM', 'ARTICLE_OPTIONS_MENU_ITEM',
      'DASHBOARD_WIDGET', 'HELPDESK_CHANNEL', 'ISSUE_ABOVE_ACTIVITY_STREAM', 'ISSUE_BELOW_SUMMARY',
      'ISSUE_FIELD_PANEL_FIRST', 'ISSUE_FIELD_PANEL_LAST', 'ISSUE_OPTIONS_MENU_ITEM',
      'MAIN_MENU_ITEM', 'MARKDOWN', 'PROJECT_SETTINGS', 'USER_CARD', 'USER_PROFILE_SETTINGS',
    ];

    if (!/^[a-z][a-z0-9-]*$/.test(key)) {
      console.error(styleText("red", `Invalid widget key: "${key}". Must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens.`));
      process.exit(1);
    }

    const manifestPath = path.join(cwd, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        if (manifest.widgets && manifest.widgets.some(w => w.key === key)) {
          console.error(styleText("red", `Error: Widget with key "${key}" already exists in manifest.json`));
          process.exit(1);
        }
      } catch (e) {
        console.error(styleText("red", `Error: Could not parse manifest.json: ${e.message}`));
        process.exit(1);
      }
    }

    const extensionPoint = args['extension-point'] || args.extensionPoint;
    if (!extensionPoint) {
      console.error(styleText("red", 'Error: --extension-point is required'));
      process.exit(1);
    }
    if (!VALID_WIDGET_EXTENSION_POINTS.includes(extensionPoint)) {
      console.error(styleText("red", `Invalid extension point: "${extensionPoint}". Must be one of: ${VALID_WIDGET_EXTENSION_POINTS.join(', ')}`));
      process.exit(1);
    }

    const name = args.name || key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const description = args.description || '';
    const rawPerms = args.permissions
      ? String(args.permissions).split(',').map(p => p.trim()).filter(Boolean)
      : [];
    const width = args.width != null ? Number(args.width) : undefined;
    const height = args.height != null ? Number(args.height) : undefined;
    const hasPerms = rawPerms.length > 0;
    const hasDims = width != null || height != null;

    const hygenArgs = [
      'widget', 'add',
      '--key', key,
      '--name', name,
      '--extensionPoint', extensionPoint,
      '--description', description,
      '--limitPermissions', String(hasPerms),
      '--addDimensions', String(hasDims),
    ];

    // inject-manifest.js uses args.cwd to locate manifest.json; pass the resolved path
    hygenArgs.push('--cwd', cwd);
    if (hasPerms) hygenArgs.push('--permissions', rawPerms.join(','));
    if (width != null) hygenArgs.push('--width', String(width));
    if (height != null) hygenArgs.push('--height', String(height));

    console.log(styleText("cyan", `\nGenerating widget "${name}" (${key})...\n`));
    await runHygen(hygenArgs);
    console.log(styleText("green", `\n✓ Widget created successfully!\n`));
    return;
  }

  const hasHygenParams = ["init", "enhanced-dx", "extension-property", "widget", "settings", "http-handler", "endpoint"].some(
    (key) => new Set(normalizedArgv).has(key)
  );

  // If some hygen-related params passed in, we call generator directly
  if (hasHygenParams) {
    // Intercept Enhanced DX http-handler flow for richer experience
    const isHttpHandlerCmd = new Set(normalizedArgv).has('http-handler') && (new Set(normalizedArgv).has('add') || !normalizedArgv.find(a => a === 'init' || a === 'enhanced-dx' || a === 'settings' || a === 'widget' || a === 'extension-property' || a === 'endpoint'));
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
          choices: ['global', 'project', 'issue', 'article', 'user']
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
            footerText = styleText("dim", 'No matches • new segments will be created');
          } else {
            const maxShow = 10;
            const shown = suggestions.slice(0, maxShow).join('  ');
            const more = suggestions.length > maxShow ? styleText("dim", `  +${suggestions.length - maxShow} more`) : '';
            footerText = styleText("dim", 'Matches: ') + shown + more;
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

            let next;
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
              const more = suggestions.length > maxShow ? styleText("dim", `  +${suggestions.length - maxShow} more`) : '';
              footerText = styleText("dim", 'Matches: ') + shown + more;
            }

            pathPrompt.input = next;
            // Ensure cursor moves to the end after completion/cycling
            try {
              pathPrompt.cursor = next.length;
            } catch {
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
            message: `File already exists: ${styleText("bold", targetRel)}. Overwrite?`
          }).run();
          if (!overwrite) {
            console.log(styleText("yellow", 'Aborted. No files were changed.'));
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
        if (isCancelled(e)) {
          console.log(styleText("yellow", '\nCancelled.'));
          return;
        }
        console.error(styleText("red", 'Failed to generate http-handler:'), e);
        process.exitCode = 1;
        return;
      }
    }
    return runHygen();
  }

  // Check if we're in an existing enhanced-dx app
  const pkgPath = path.join(cwd, 'package.json');
  const hasPkg = fs.existsSync(pkgPath);
  if (hasPkg) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const isEnhancedDX = pkg.enhancedDX === true || pkg.enhancedDX === 'true';

    if (isEnhancedDX) {
      // Show interactive menu for what to generate
      const action = await new Select({
        name: 'action',
        message: 'What would you like to generate?',
        choices: [
          { name: 'http-handler', message: 'HTTP Handler (API endpoint)' },
          { name: 'extension-property', message: 'Extension Property (entity field)' },
          { name: 'settings', message: 'App Settings (settings.json)' },
          { name: 'widget', message: 'Widget (UI component)' },
        ]
      }).run();

      if (action === 'http-handler') {
        // Interactive flow for http-handler
        const method = await new Select({
          name: 'method',
          message: 'Choose HTTP method:',
          choices: ['GET', 'POST', 'PUT', 'DELETE']
        }).run();

        const scope = await new Select({
          name: 'scope',
          message: 'Choose scope (first path segment):',
          choices: ['global', 'project', 'issue', 'article', 'user']
        }).run();

        const routePath = await new Input({
          name: 'routePath',
          message: `Route path under ${scope}/ (leave empty for root):`,
          initial: ''
        }).run();

        const { PERMISSIONS } = require(path.join(defaultTemplates, 'consts.js'));
        const permChoices = PERMISSIONS.map(p => ({ name: p.key, message: p.key }));
        const permissions = await new MultiSelect({
          name: 'permissions',
          message: 'Select permissions (optional, space to toggle, enter to confirm):',
          choices: permChoices,
          hint: 'Space to select, enter to confirm',
          validate: () => true
        }).run();

        const targetRel = path.join('src', 'backend', 'router', scope, routePath || '', `${method}.ts`);
        const targetAbs = path.join(cwd, targetRel);

        if (fs.existsSync(targetAbs)) {
          const overwrite = await new Confirm({
            initial: false,
            message: `File already exists: ${styleText("bold", targetRel)}. Overwrite?`
          }).run();
          if (!overwrite) {
            console.log(styleText("yellow", 'Aborted.'));
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

        process.env.EDX = '1';
        console.log(styleText("cyan", `\nGenerating ${method} handler at ${targetRel}...\n`));
        await runHygen(hygenArgs);
        console.log(styleText("green", `\n✓ HTTP handler created successfully!\n`));
        return;
      } else if (action === 'extension-property') {
        // Interactive flow for extension-property
        const target = await new Select({
          name: 'target',
          message: 'What is the target extending entity?',
          choices: [
            { name: 'Issue', message: 'Issue' },
            { name: 'User', message: 'User' },
            { name: 'Project', message: 'Project' },
            { name: 'Article', message: 'Article' },
          ]
        }).run();

        const name = await new Input({
          name: 'name',
          message: 'What is the name of the extension property?',
          validate: (val) => val && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(val) ? true : 'Must be a valid identifier'
        }).run();

        const type = await new Select({
          name: 'type',
          message: 'What is the type of the extension property?',
          choices: [
            { name: 'string', message: 'String' },
            { name: 'integer', message: 'Integer' },
            { name: 'float', message: 'Float' },
            { name: 'boolean', message: 'Boolean' },
            { name: 'Issue', message: 'Issue (reference)' },
            { name: 'User', message: 'User (reference)' },
            { name: 'Project', message: 'Project (reference)' },
            { name: 'Article', message: 'Article (reference)' },
          ]
        }).run();

        const isSet = await new Confirm({
          name: 'isSet',
          message: 'Is it a set of values?',
          initial: false
        }).run();

        const entityExtensionsPath = path.join(cwd, 'src', 'entity-extensions.json');
        let entityExtensions;
        if (fs.existsSync(entityExtensionsPath)) {
          try {
            entityExtensions = JSON.parse(fs.readFileSync(entityExtensionsPath, 'utf-8'));
          } catch (err) {
            console.error(styleText("red", `Error: entity-extensions.json is invalid JSON: ${(err && err.message) || String(err)}`));
            process.exitCode = 1;
            return;
          }
        } else {
          entityExtensions = { entityTypeExtensions: [] };
        }

        let extendingEntity = entityExtensions.entityTypeExtensions.find((e) => e.entityType === target);
        if (!extendingEntity) {
          extendingEntity = { entityType: target, properties: {} };
          entityExtensions.entityTypeExtensions.push(extendingEntity);
        }
        extendingEntity.properties[name] = { type, multi: isSet };

        fs.writeFileSync(entityExtensionsPath, JSON.stringify(entityExtensions, null, 2));
        console.log(styleText("green", `\n✓ Extension property created: ${target}.${name} (${type}${isSet ? '[]' : ''})\n`));
        return;
      } else if (action === 'settings') {
        // Interactive flow for settings
        const settingsAction = await new Select({
          name: 'settingsAction',
          message: 'What would you like to do with settings?',
          choices: [
            { name: 'init', message: 'Initialize settings.json (create new)' },
            { name: 'add', message: 'Add property to existing settings.json' },
          ]
        }).run();

        if (settingsAction === 'init') {
          // Check if settings.json already exists
          const settingsPath = path.join(cwd, 'src', 'settings.json');
          if (fs.existsSync(settingsPath)) {
            console.error(styleText("red", '\nError: settings.json already exists at src/settings.json'));
            console.log(styleText("yellow", 'Use "add" option to add properties to existing settings.\n'));
            return;
          }

          // Run hygen for settings init
          const hygenArgs = ['settings', 'init'];
          await runHygen(hygenArgs);
          console.log(styleText("green", '\n✓ Settings schema created at src/settings.json\n'));
        } else if (settingsAction === 'add') {
          // Check if settings.json exists
          const settingsPath = path.join(cwd, 'src', 'settings.json');
          if (!fs.existsSync(settingsPath)) {
            console.error(styleText("red", '\nError: settings.json does not exist'));
            console.log(styleText("yellow", 'Use "init" option first to create settings.json.\n'));
            return;
          }

          // Run hygen for settings add
          const hygenArgs = ['settings', 'add'];
          await runHygen(hygenArgs);
          console.log(styleText("green", '\n✓ Setting property added to settings.json\n'));
        }
        return;
      } else if (action === 'widget') {
        // Run hygen for widget
        return runHygen(['widget', 'add']);
      }
    }
  }

  if (
    !(await new Confirm({
      initial: true,
      message: `This will generate the scaffolding for a new YouTrack app in the following directory: ${styleText("bold", cwd)}\n\nContinue?`,
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
To add more widgets later, run: ${styleText("magenta", 'npx @jetbrains/create-youtrack-app widget add')}
To add app settings later, run: ${styleText("magenta", 'npx @jetbrains/create-youtrack-app settings init')}

====================================
  `);

  const toolsPackageDir = path.join(__dirname, '..', 'youtrack-enhanced-dx-tools');
  const isLocalWorkspace = fs.existsSync(toolsPackageDir);

  console.log(`
${styleText("bold", '======= Your app has been created! =======')}

Please wait for just a moment. Dependencies are being installed:
`);

  if (isLocalWorkspace) {
    // Running from a local monorepo clone — link the local build instead of pulling from npm
    const installProcess = execa("npm", ["link", "@jetbrains/youtrack-enhanced-dx-tools"], {cwd});
    installProcess.stdout.pipe(process.stdout);
    await installProcess;
  } else {
    // Running from npm — install dependencies from the registry
    const installProcess = execa("npm", ["install"], {cwd});
    installProcess.stdout.pipe(process.stdout);
    await installProcess;
  }

  // No explicit build of @jetbrains/youtrack-enhanced-dx-tools here.
  // The tools are consumed as Vite plugins and will be resolved/compiled by the app toolchain during dev/build.


  const buildCommand = 'npm run build';
  const additionalInfo = appType === 'ts' ? `

${styleText("bold", '🚀 Enhanced DX Features:')}
- Type-safe API endpoints with automatic type generation
- File-based routing in src/backend/router/
- Zod schema validation in dev builds (tree-shaken from production)
- Example endpoints: /global/health, /project/settings, /issue/metadata

${styleText("bold", 'Development workflow:')}
1. Add endpoints: Create {GET|POST}.ts files in src/backend/router/
2. Use @zod-to-schema comments for automatic validation
3. Import and use the type-safe API client in your widgets

` : '';

  console.log(`
${styleText("bold", 'Done. All dependencies are now installed!')}
${additionalInfo}
If you want to upload and test the app in your YouTrack site, you'll need to generate a permanent access token first.

For instructions, please visit https://www.jetbrains.com/help/youtrack/server/manage-permanent-token.html

Once you have this token, open your development environment and use the following commands to compile and upload the app:

1. ${styleText("magenta", buildCommand)}
2. ${styleText("magenta", 'npm run upload -- --host http://your-youtrack.url --token perm:cm9...')}

To add more features to your app, run the generator script again.
Run ${styleText("magenta", 'npx @jetbrains/create-youtrack-app --help')} to explore available options.`);
})().catch((e) => {
  if (isCancelled(e)) {
    console.log(styleText("yellow", '\nCancelled.'));
    process.exit(0);
  }
  throw e;
});
