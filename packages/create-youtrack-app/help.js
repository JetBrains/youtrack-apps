const { styleText } = require("node:util");

// Note: Migrated from chalk to native Node.js util.styleText


console.log(`
To generate a new app, run the following command

===
${styleText("magenta", 'npm init @jetbrains/youtrack-app')}
===

... and follow the prompts. ${styleText("bold", 'Enhanced DX (experimental) features are described below.')}

After you have generated an app, you may want to add more features. Add new features quickly with one of these commands:

* ${styleText("magenta", 'npx @jetbrains/create-youtrack-app --help')} to view a list of available commands
* ${styleText("magenta", 'npx @jetbrains/create-youtrack-app settings init')} to add a declaration for the app settings (${styleText("underline", 'https://www.jetbrains.com/help/youtrack/devportal-apps/app-settings.html')})
* ${styleText("magenta", 'npx @jetbrains/create-youtrack-app settings add')} to add one or more properties to the setting schema created using the command listed above
* ${styleText("magenta", 'npx @jetbrains/create-youtrack-app widget add')} to add another widget (${styleText("underline", 'https://www.jetbrains.com/help/youtrack/devportal-apps/apps-widgets.html')})
* ${styleText("magenta", 'npx @jetbrains/create-youtrack-app extension-property add')} to declare an extension property (${styleText("underline", 'https://www.jetbrains.com/help/youtrack/devportal-apps/apps-extension-properties.html')})
* ${styleText("magenta", 'npx @jetbrains/create-youtrack-app http-handler add')} to add an HTTP handler (${styleText("underline", 'https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html')})
* ${styleText("magenta", 'npx @jetbrains/create-youtrack-app endpoint add')} to generate a router endpoint


${styleText("bold", 'Enhanced DX (experimental)')}

${styleText("bold", 'Usage:')}
  - Choose "TypeScript (Enhanced DX with file-based routing)" when prompted. A sample ${styleText("cyan", 'MAIN_MENU_ITEM')} widget with backend endpoints will be added automatically.
  - Run ${styleText("magenta", 'npm run watch')} to rebuild and update the app continuously.

${styleText("bold", 'Code Generation:')}
Inside an Enhanced DX app, use ${styleText("magenta", 'npm run generate')} (or ${styleText("magenta", 'npm run g')}) to add features:

${styleText("bold", 'Widgets:')}
  ${styleText("magenta", 'npm run g -- widget --key my-panel --extension-point ISSUE_BELOW_SUMMARY')}
  ${styleText("magenta", 'npm run g -- widget --key admin-page --extension-point MAIN_MENU_ITEM --name "Admin Page"')}
  ${styleText("dim", '# Creates src/widgets/<key>/ and injects an entry into manifest.json')}
  ${styleText("dim", '# Extension points: MAIN_MENU_ITEM, DASHBOARD_WIDGET, ISSUE_BELOW_SUMMARY, PROJECT_SETTINGS, ...')}

${styleText("bold", 'HTTP Handlers:')}
  ${styleText("magenta", 'npm run g -- handler global/health')}              ${styleText("dim", '# GET handler (default)')}
  ${styleText("magenta", 'npm run g -- handler project/users --method POST')} ${styleText("dim", '# POST handler')}
  ${styleText("magenta", 'npm run g -- h issue/comments --method POST --permissions read-issue,update-issue')}

${styleText("bold", 'Extension Properties:')}
  ${styleText("magenta", 'npm run g -- property Issue.customStatus')}         ${styleText("dim", '# string type (default)')}
  ${styleText("magenta", 'npm run g -- property Comment.rating --type integer')}
  ${styleText("magenta", 'npm run g -- p Issue.tags --type string --set')}    ${styleText("dim", '# multi-value property')}

${styleText("bold", 'App Settings:')}
  ${styleText("magenta", 'npm run g -- settings init --title "..." --description "..."')} ${styleText("dim", '# Create settings schema')}
  ${styleText("magenta", 'npm run g -- settings init')}                       ${styleText("dim", '# Interactive mode')}
  ${styleText("magenta", 'npm run g -- settings add')}                        ${styleText("dim", '# Add property (interactive)')}
  ${styleText("magenta", 'npm run g -- s init --title "..." --description "..."')}        ${styleText("dim", '# Short alias')}

${styleText("bold", 'Interactive Menu:')}
  ${styleText("magenta", 'npm run g')}                                        ${styleText("dim", '# Shows a menu for choosing what to generate')}

${styleText("bold", 'Features:')}
• ${styleText("bold", 'File-based Routing:')} Create endpoints by adding files in ${styleText("cyan", 'src/backend/router/SCOPE/NAME/METHOD.ts')}
  - e.g. ${styleText("cyan", 'src/backend/router/project/demo/GET.ts')} for a GET request

• ${styleText("bold", 'TypeScript Backend:')} TypeScript support with automatic type generation
  - Use ${styleText("magenta", '@zod-to-schema')} annotation for the endpoint Request and Response types (see the sample endpoints)
  - Annotated types are used to generate schemas (${styleText("cyan", 'api.zod.ts')}) and type definitions (${styleText("cyan", 'api.d.ts')}) in the ${styleText("cyan", 'src/api/')} folder

• ${styleText("bold", 'Client:')} Custom TS endpoints are accessible via type-safe API client with autocompletion and type checking
  - ${styleText("magenta", 'import { createApi } from "@/api";')}
  - ${styleText("magenta", 'const host = await YTApp.register(); const api = createApi(host);')}
  - ${styleText("magenta", 'const result = await api.project.demo.GET({ projectId: "ABC", message: "hello" });')}

• ${styleText("bold", 'Zod Validation:')} Runtime validation in development mode. Use ${styleText("magenta", 'npm run watch')}

• ${styleText("bold", 'Vite-powered:')} Custom plugins handle routing and type generation
  - api plugin: ${styleText("bold", 'vite-plugin-youtrack-api-generator.ts')}
  - router plugin: ${styleText("bold", 'vite-plugin-youtrack-router.ts')}
`);
