module.exports = {
  prompt: ({ prompter, args }) =>
    prompter.prompt([
      {
        type: "input",
        name: "appName",
        message: "What is the name you want to assign to this app package?",
      },
      {
        type: "input",
        name: "title",
        message: "What is the title (a user-friendly name) you want to give this app?",
      },
      {
        type: "input",
        name: "description",
        message: "What is the description you want to give to this app?",
      },
      {
        type: "input",
        name: "vendor",
        message: "Who is the vendor (or creator) of this app?",
      },
      {
        type: "input",
        name: "vendorUrl",
        message: "What is the URL of the app vendor's website?",
      },
      {
        type: "input",
        name: "icon",
        initial: "icon.svg",
        message: "What is the filename of the icon for your app?",
      },
      {
        type: "input",
        name: "iconDark",
        initial: "darkIcon.svg",
        message: "What is the filename of the icon for your app in dark mode?",
      },
    ]),
};
