const chalk = require('chalk');

// Note: see how to use chalk for output formatting https://github.com/chalk/chalk?tab=readme-ov-file#usage


console.log(chalk`
To generate a new app, run

===
${chalk.magenta('npm init @jetbrains/youtrack-app')}
===

And follow the promts

Once App is generated, one may need to add more features. See list of awailable commands:

* ${chalk.magenta('npx @jetbrains/create-youtrack-app --help')} to see list of possible commands
* ${chalk.magenta('npx @jetbrains/create-youtrack-app settings add')} to add a settings declaration (${chalk.underline('https://www.jetbrains.com/help/youtrack/devportal-apps/app-settings.html')})
* ${chalk.magenta('npx @jetbrains/create-youtrack-app settings add')} to add one more property into Settings, created by command above
* ${chalk.magenta('npx @jetbrains/create-youtrack-app widget add')} to add one more widget (${chalk.underline('https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-extension-points.html')})
* ${chalk.magenta('npx @jetbrains/create-youtrack-app extension-property add')} to add extension property (${chalk.underline('https://www.jetbrains.com/help/youtrack/devportal-apps/apps-extension-properties.html')})
* ${chalk.magenta('npx @jetbrains/create-youtrack-app http-handler add')} to add an HTTP handler (${chalk.underline('https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html')})
`);
