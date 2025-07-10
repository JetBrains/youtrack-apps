const { injectJSCallback } = require("../../injectJsCallback");
const entities = require("@jetbrains/youtrack-scripting-api/entities");
const fs = require("node:fs");
const path = require("node:path");

const entitiesTypes = Object.keys(entities).map((entity) => ({
  name: entity,
  message: entity,
}));

const primitiveTypes = ["String", "Integer", "Float", "Boolean"].map(
  (type) => ({
    name: type.toLowerCase(),
    message: type,
  })
);

module.exports = {
  prompt: injectJSCallback(injectEntity, ({ prompter, args }) =>
    prompter.prompt([
      {
        type: "input",
        name: "name",
        message: "What is the name of the extension property",
      },
      {
        type: "autocomplete",
        name: "type",
        message: "What is the type of the extension property",
        limit: 6,
        choices: [...primitiveTypes, ...entitiesTypes],
      },
      {
        type: "confirm",
        name: "isSet",
        message: "Is it a set of values?",
        skip() {
          return primitiveTypes.some(
            (primitive) => primitive.name === this.state.answers.type
          );
        },
      },
      {
        type: "autocomplete",
        name: "target",
        message: "What is the target extending entity?",
        limit: 6,
        choices: [
          { name: "AppGlobalStorage", message: "Global Storage" },
          ...entitiesTypes,
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
