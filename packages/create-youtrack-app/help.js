const chalk = require('chalk');

// Note: see how to use chalk for output formatting https://github.com/chalk/chalk?tab=readme-ov-file#usage


console.log(chalk`
To generate a new app, run the following command

===
${chalk.magenta('npm init @jetbrains/youtrack-app')}
===

... and follow the prompts

After you have generated an app, you may want to add more features. Add new features quickly with one of these commands:

* ${chalk.magenta('npx @jetbrains/create-youtrack-app --help')} to view a list of available commands
* ${chalk.magenta('npx @jetbrains/create-youtrack-app settings init')} to add a settings declaration (${chalk.underline('https://www.jetbrains.com/help/youtrack/devportal-apps/app-settings.html')})
* ${chalk.magenta('npx @jetbrains/create-youtrack-app settings add')} to add one or more properties to the setting scheme created using the command listed above
* ${chalk.magenta('npx @jetbrains/create-youtrack-app widget add')} to add another widget (${chalk.underline('https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-extension-points.html')})
* ${chalk.magenta('npx @jetbrains/create-youtrack-app extension-property add')} to declare an extension property (${chalk.underline('https://www.jetbrains.com/help/youtrack/devportal-apps/apps-extension-properties.html')})
* ${chalk.magenta('npx @jetbrains/create-youtrack-app http-handler add')} to add an HTTP handler (${chalk.underline('https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html')})
`);
