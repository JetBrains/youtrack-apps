const chalk = require('chalk');

// Note: see how to use chalk for output formatting https://github.com/chalk/chalk?tab=readme-ov-file#usage


console.log(chalk`
To generate a new app, run the following command

===
${chalk.magenta('npm init @jetbrains/youtrack-app')}
===

... and follow the prompts. ${chalk.bold('Enhanced DX (experimental) features are available and described below.')}

After you have generated an app, you may want to add more features. Add new features quickly with one of these commands:

* ${chalk.magenta('npx @jetbrains/create-youtrack-app --help')} to view a list of available commands
* ${chalk.magenta('npx @jetbrains/create-youtrack-app settings init')} to add a settings declaration (${chalk.underline('https://www.jetbrains.com/help/youtrack/devportal-apps/app-settings.html')})
* ${chalk.magenta('npx @jetbrains/create-youtrack-app settings add')} to add one or more properties to the setting scheme created using the command listed above
* ${chalk.magenta('npx @jetbrains/create-youtrack-app widget add')} to add another widget (${chalk.underline('https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-extension-points.html')})
* ${chalk.magenta('npx @jetbrains/create-youtrack-app extension-property add')} to declare an extension property (${chalk.underline('https://www.jetbrains.com/help/youtrack/devportal-apps/apps-extension-properties.html')})
* ${chalk.magenta('npx @jetbrains/create-youtrack-app http-handler add')} to add an HTTP handler (${chalk.underline('https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html')})
* ${chalk.magenta('npx @jetbrains/create-youtrack-app endpoint add')} to generate a router endpoint


${chalk.bold('Enhanced DX (experimental)')}

${chalk.bold('Usage:')}
  - Choose "Enhanced DX" when prompted and follow the instructions as usual. Sample ${chalk.cyan('MAIN_MENU_ITEM')} widget with backend endpoints will be added automatically.
  - Run ${chalk.magenta('npm run watch-update')} to continuously update the app.

${chalk.bold('Features:')}
• ${chalk.bold('File-based Routing:')} Create endpoints by adding files in ${chalk.cyan('src/backend/router/SCOPE/NAME/METHOD.ts')}
  - e.g. ${chalk.cyan('src/backend/router/project/demo/GET.ts')} for GET request

• ${chalk.bold('TypeScript Backend:')} TypeScript support with automatic type generation
  - Use  ${chalk.magenta('@zod-to-schema')} annotation for the endpoint Request and Response types (check out sample endpoints)
  - Annotated types are used to generate schemas (${chalk.cyan('api.zod.ts')}) and type definitions (${chalk.cyan('api.d.ts')}) in ${chalk.cyan('src/api/')} folder

• ${chalk.bold('Client:')} Custom TS endpoints are accessible via type-safe API client with autocompletion and type checking
  - ${chalk.magenta('import { createApi } from "@/api";')}
  - ${chalk.magenta('const host = await YTApp.register(); const api = createApi(host);')}
  - ${chalk.magenta('const result = await api.project.demo.GET({ projectId: "ABC", message: "hello" });')}

• ${chalk.bold('Zod Validation:')} Runtime validation in development mode. Use ${chalk.magenta('NODE_ENV=development npm run watch-update')}

• ${chalk.bold('Vite-powered:')} Custom plugins handle routing and type generation
  - api plugin: ${chalk.bold('vite-plugin-youtrack-api-generator.ts')}
  - router plugin: ${chalk.bold('vite-plugin-youtrack-router.ts')}

${chalk.bold('Limitations:')}
• ${chalk.bold('YouTrack Types:')} ${chalk.cyan('src/api/youtrack-types.d.ts')} contains incomplete TypeScript definitions (partial jsStubs migration)
• ${chalk.bold('Development builds:')} ${chalk.magenta('watch-update')} uses ${chalk.cyan('build:nolint')} for speed - run ${chalk.magenta('npm run build')} before production
`);
