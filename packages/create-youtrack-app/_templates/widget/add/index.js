const { validateNotEmpty } = require("../../utils");
const { PERMISSIONS } = require("../../consts");

const extensionPoints = [
  {
    name: "A page that has its own item in the administration menu.",
    value: "ADMINISTRATION_MENU_ITEM",
  },
  {
    name: "The area in an article above the activity stream.",
    value: "ARTICLE_ABOVE_ACTIVITY_STREAM",
  },
  {
    name: "An item in the article toolbar that invokes the widget.",
    value: "ARTICLE_OPTIONS_MENU_ITEM",
  },
  {
    name: "An item in the options menu of an attachment",
    value: "ATTACHMENT_OPTIONS_MENU_ITEM",
  },
  {
    name: "An item in the options menu of a comment.",
    value: "COMMENT_OPTIONS_MENU_ITEM",
  },
  { name: "The dashboard.", value: "DASHBOARD_WIDGET" },
  {
    name: "An extra channel for tickets. This extension point is only available for helpdesk projects.",
    value: "HELPDESK_CHANNEL",
  },
  {
    name: "The area in an issue above the activity stream.",
    value: "ISSUE_ABOVE_ACTIVITY_STREAM",
  },
  {
    name: "The area in an issue below the issue summary.",
    value: "ISSUE_BELOW_SUMMARY",
  },
  {
    name: "The area in an issue above the custom field panel.",
    value: "ISSUE_FIELD_PANEL_FIRST",
  },
  {
    name: "The area in an issue below the custom field panel.",
    value: "ISSUE_FIELD_PANEL_LAST",
  },
  {
    name: "An item in the issue toolbar that invokes the widget.",
    value: "ISSUE_OPTIONS_MENU_ITEM",
  },
  {
    name: "A separate application page with a menu item in the header.",
    value: "MAIN_MENU_ITEM",
  },
  { name: "The area in a Markdown-formatted text.", value: "MARKDOWN" },
  {
    name: "A separate tab in the project settings.",
    value: "PROJECT_SETTINGS",
  },
  {
    name: "The area in the user card that you see when you hover over the username in an issue or article.",
    value: "USER_CARD",
  },
  {
    name: "A separate tab in the user profile.",
    value: "USER_PROFILE_SETTINGS",
  },
];

module.exports = {
  prompt: async ({ prompter, args, h }) => {
    const { key } = args.key ? args : await prompter.prompt({
      type: "input",
      name: "key",
      validate: validateNotEmpty,
      format: input => h.changeCase.lower(h.inflection.dasherize(input)),
      result: input => h.changeCase.lower(h.inflection.dasherize(input)),
      message: "What is the key of your widget?",
    });
    const { name } = args.name ? args : await prompter.prompt({
      type: "input",
      name: "name",
      validate: validateNotEmpty,
      message: "What is the name of your widget?",
      initial: h.inflection.titleize(key),
    });

    const { extensionPoint } = args.extensionPoint ? args : await prompter.prompt({
      type: "select",
      name: "extensionPoint",
      message: "What is the extension point of your widget?",
      choices: extensionPoints.map(({ name, value }) => ({
        message: `${name} (${value})`,
        name: value,
      })),
    });

    const { description } = args.description ? args : await prompter.prompt({
      type: "input",
      name: "description",
      message: "What is the description of your widget?",
    });

    const { limitPermissions } = args.limitPermissions ?? await prompter.prompt({
      type: "confirm",
      name: "limitPermissions",
      message: "Would you like to make widget visibility limited?",
    });

    let permissions = false;
    if (limitPermissions) {
      const res = await prompter.prompt({
        type: "multiselect",
        name: "permissions",
        message: "Would you like to limit visibility of this widget? Leave empty to keep it always visible",
        choices: PERMISSIONS.map(({ key, description }) => ({
          message: `"${key}": ${description}`,
          name: key,
        })),
      });
      permissions = res.permissions;
    }

    const { addDimensions } = args.addDimensions ?? await prompter.prompt({
      type: "confirm",
      name: "addDimensions",
      message: "Do you want to add dimensions to your widget?",
    });

    let width;
    let height;
    if (addDimensions) {
      await prompter
        .prompt({
          type: "number",
          name: "width",
          message: "What is the width of your widget in pixels?",
        })
        .then((res) => {
          width = res.width;
        });

      await prompter
        .prompt({
          type: "number",
          name: "height",
          message: "What is the height of your widget in pixels?",
        })
        .then((res) => {
          height = res.height;
        });
    }

    return {
      key,
      name,
      permissions,
      folderName: h.changeCase.path(key),
      indexPath: `${h.changeCase.path(key)}/index.html`,
      extensionPoint,
      description,
      addDimensions,
      width,
      height,
    };
  },
};
