const { injectJSCallback } = require("../../injectJsCallback");
const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  prompt: injectJSCallback(injectEntity, ({ prompter, args }) => {
    // If all required args are provided, skip prompts
    if (args.name && args.type && args.target && args.isSet !== undefined) {
      return Promise.resolve(args);
    }
    
    return prompter.prompt([
      {
        type: "input",
        name: "name",
        message: "What is the name of the extension property",
        skip: () => !!args.name,
        initial: args.name,
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
        skip: () => !!args.type,
        initial: args.type || 'string',
      },
      {
        type: "confirm",
        name: "isSet",
        message: "Is it a set of values?",
        skip: () => args.isSet !== undefined,
        initial: args.isSet === 'true' || args.isSet === true,
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
        skip: () => !!args.target,
        initial: args.target,
      },
    ]);
  }),
};

function injectEntity(payload, context) {
  const fileName = "entity-extensions.json";
  // Use the cwd from args if available, otherwise fallback to process.cwd()
  const targetCwd = (context && context.args && context.args.cwd) 
    ? path.resolve(process.cwd(), context.args.cwd)
    : process.cwd();
  const filePath = path.join(targetCwd, "src", fileName);
  let entityExtensions;
  if (fs.existsSync(filePath)) {
    try {
      entityExtensions = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (e) {
      throw new Error(`entity-extensions.json is invalid JSON: ${e.message}`);
    }
  } else {
    entityExtensions = { entityTypeExtensions: [] };
  }
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
