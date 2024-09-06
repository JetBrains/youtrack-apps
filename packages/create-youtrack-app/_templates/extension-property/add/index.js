const { injectJSCallback } = require("../../injectJsCallback");
const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  prompt: injectJSCallback(injectEntity, ({ prompter, args }) =>
    prompter.prompt([
      {
        type: "input",
        name: "name",
        message: "What is the name of the extension property",
      },
      {
        type: "select",
        name: "type",
        message: "What is the type of the extension property",
        choices: [
          {
            name: "string",
            message: "String",
          },
          { name: "integer", message: "Integer" },
          { name: "boolean", message: "Boolean" },
          {
            name: "Issue",
            message: "Issue",
          },
        ],
      },
      {
        type: "confirm",
        name: "isSet",
        message: "Is it a set of values?",
      },
      {
        type: "select",
        name: "target",
        message: "What is the target extending entity?",
        choices: [
          { name: "Issue", message: "Issue" },
          { name: "Comment", message: "Comment" },
          { name: "User", message: "User" },
          { name: "AppGlobalStorage", message: "Global Storage" },
        ],
      },
    ]),
  ),
};

function injectEntity(payload) {
  const fileName = "entity-extensions.json";
  const filePath = path.join(process.cwd(), "src", fileName);
  const entityExtensions = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath))
    : { entityTypeExtensions: [] };
  const extendingEntity = entityExtensions.entityTypeExtensions.find(
    (e) => e.entityType === payload.target,
  );
  if (!extendingEntity) {
    entityExtensions.entityTypeExtensions.push({
      entityType: payload.target,
      properties: {
        [payload.name]: {
          type: payload.type,
          multi: payload.isSet,
        },
      },
    });
  } else {
    extendingEntity.properties[payload.name] = {
      type: payload.type,
      multi: payload.isSet,
    };
  }
  fs.writeFileSync(filePath, JSON.stringify(entityExtensions, null, 2));
}
