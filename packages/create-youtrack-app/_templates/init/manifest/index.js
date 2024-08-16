module.exports = {
  prompt: ({ prompter, args }) =>
    prompter.prompt([
      {
        type: "input",
        name: "appName",
        message: "What is the name of your app?",
      },
      {
        type: "input",
        name: "title",
        message: `What is the title of your app?`,
      },
      {
        type: "input",
        name: "description",
        message: `What is the description of your app?`,
      },
      {
        type: "input",
        name: "vendor",
        message: `What is the vendor of your app?`,
      },
      {
        type: "input",
        name: "vendorUrl",
        message: `What is the vendor URL of your app?`,
      },
      {
        type: "input",
        name: "icon",
        initial: "icon.svg",
        message: `What is the icon of your app?`,
      },
      {
        type: "input",
        name: "iconDark",
        initial: "darkIcon.svg",
        message: `What is the dark icon of your app?`,
      },
    ]),
};
