const { styleText } = require("node:util");

const createApp = 'npx @jetbrains/create-youtrack-app';

console.log(`
${styleText("bold", 'Create YouTrack App')}

Use this generator to create a new YouTrack app or add features to an existing
app directory. Run commands from the directory where the app should be created
or modified.

${styleText("bold", 'Create a New App')}

Interactive setup:
  ${styleText("magenta", createApp)}
  ${styleText("dim", '# npm create @jetbrains/youtrack-app and npm init @jetbrains/youtrack-app run the same initializer flow')}

Non-interactive setup:
  ${styleText("magenta", `${createApp} --name my-youtrack-app`)}
  ${styleText("dim", '# Only --name is required. Title, description, vendor, and vendor URL are optional.')}

Choose the generated app shape:
  ${styleText("magenta", `${createApp} --name my-ts-app`)} ${styleText("dim", '# TypeScript Enhanced DX app; default')}
  ${styleText("magenta", `${createApp} --name my-js-app --type js`)} ${styleText("dim", '# JavaScript app shell')}
  ${styleText("magenta", `${createApp} --name backend-api --type ts --backend-only`)} ${styleText("dim", '# Enhanced DX without the sample widget')}

${styleText("bold", 'Commands for both ts and js apps')}

These commands work in both JavaScript and TypeScript app directories.

  ${styleText("magenta", `${createApp} settings init`)}
    Interactive: create src/settings.json.

  ${styleText("magenta", `${createApp} settings init --title "Settings" --description "App configuration"`)}
    Non-interactive: create src/settings.json.

  ${styleText("magenta", `${createApp} settings add`)}
    Interactive: add a property to src/settings.json.

  ${styleText("magenta", `${createApp} settings add --name apiUrl --type string`)}
    Non-interactive: add a property to src/settings.json.

  ${styleText("magenta", `${createApp} widget add`)}
    Interactive: add a widget.

  ${styleText("magenta", `${createApp} widget --key issue-panel --extension-point ISSUE_BELOW_SUMMARY`)}
    Non-interactive: add a widget.

  ${styleText("magenta", `${createApp} widget --key dashboard-card --extension-point DASHBOARD_WIDGET --name "Dashboard Card"`)}
    Non-interactive: add a named dashboard widget.

  ${styleText("magenta", `${createApp} extension-property add`)}
    Interactive: declare an app-owned entity extension property.

  ${styleText("magenta", `${createApp} property Issue.customStatus`)}
    Non-interactive: declare an extension property.

  ${styleText("magenta", `${createApp} p Issue.tags --type string --set`)}
    Non-interactive: declare a multi-value extension property using the short alias.

  ${styleText("magenta", `${createApp} http-handler add`)}
    Interactive: add an HTTP handler.
    
  ${styleText("magenta", 'npm run build')}
    Build backend and frontend, then validate dist. Works for backend only apps as well.

${styleText("bold", 'JavaScript App (--type js)')}

JavaScript apps start as backend.js and manifest.js. Add rule/script types.

Classic workflow rule templates:
  ${styleText("magenta", `${createApp} rule add onChange notify-on-change`)}
  ${styleText("magenta", `${createApp} rule add onSchedule weekly-digest`)}
  ${styleText("magenta", `${createApp} rule add action apply-template`)}
  ${styleText("magenta", `${createApp} rule add stateMachine issue-state`)}
  ${styleText("magenta", `${createApp} rule add sla first-reply-sla`)}

Generated files:
  ${styleText("cyan", 'src/workflows/<name>.js')}

Notes:
  ${styleText("dim", '- Widget generation creates src/widgets/<key>/, updates manifest.json, and adds a Vite entry.')}
  ${styleText("dim", '- npm run build can package backend-only apps before widgets exist.')}

${styleText("bold", 'TypeScript App (--type ts / Enhanced DX)')}

Enhanced DX apps include TypeScript, file-based backend routing, generated API
types, a typed frontend client, and Vite plugins for local development.
The default scaffold includes a sample ${styleText("cyan", 'MAIN_MENU_ITEM')} widget and example routes:
${styleText("cyan", 'global/demo')}, ${styleText("cyan", 'global/echo')} (${styleText("cyan", 'POST')}), ${styleText("cyan", 'issue/details')}, and ${styleText("cyan", 'project/demo')}.

Common commands:
  ${styleText("magenta", 'npm run dev')}
    Rebuild and upload continuously during development.

Enhanced DX-only generator commands:
  ${styleText("magenta", `${createApp} handler global/health`)}
    Non-interactive: add a GET handler.

  ${styleText("magenta", `${createApp} handler project/users --method POST`)}
    Non-interactive: add a POST handler.

  ${styleText("magenta", `${createApp} h issue/comments --method POST --permissions READ_ISSUE,UPDATE_ISSUE`)}
    Non-interactive: add a POST handler with permissions using the short alias.

  ${styleText("magenta", `${createApp} endpoint add`)}
    Interactive: add a typed router endpoint with scope, path, method, request type, and response type prompts.

Enhanced DX features:
  ${styleText("bold", 'File-based routing:')} create handlers in ${styleText("cyan", 'src/backend/router/<scope>/<path>/<METHOD>.ts')}.
  ${styleText("bold", 'Handler contracts:')} add ${styleText("magenta", '@zod-to-schema')} to exported request/response types and export ${styleText("cyan", 'type Handle = typeof handle')}.
  ${styleText("bold", 'Generated API types:')} backend builds generate route types in ${styleText("cyan", 'src/api/api.d.ts')} and Zod schemas in ${styleText("cyan", 'src/api/api.zod.ts')}.
  ${styleText("bold", 'Typed client:')} widgets call backend handlers through the generated client from ${styleText("cyan", 'src/api')}.
    ${styleText("magenta", 'import {createApi} from "@/api";')}
    ${styleText("magenta", 'const host = await YTApp.register();')}
    ${styleText("magenta", 'const api = createApi(host);')}
    ${styleText("magenta", 'const result = await api.project.demo.GET({projectId: "DEMO", message: "hello"});')}
  ${styleText("bold", 'Dev validation:')} Zod validation runs in development builds.
  ${styleText("bold", 'Build order:')} backend builds first so generated API files exist before frontend code imports them.
  ${styleText("bold", 'Widget generation:')} creates ${styleText("cyan", 'src/widgets/<key>/')} and updates ${styleText("cyan", 'manifest.json')}; Vite discovers widget entries automatically.

${styleText("bold", 'Agent Skill')}

  ${styleText("magenta", `${createApp} skill install`)}
    Interactive: install the YouTrack app builder skill for supported coding agents.

  ${styleText("magenta", `${createApp} skill status`)}
    Non-interactive: show installed skill status for supported coding agents.
`);
