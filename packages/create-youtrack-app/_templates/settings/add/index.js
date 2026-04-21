const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  prompt: async ({ prompter, args }) => {
    const settingsPath = path.resolve(process.cwd(), args.cwd || '', 'src', 'settings.json');

    if (!fs.existsSync(settingsPath)) {
      console.error('\nError: settings.json does not exist at src/settings.json. Run "settings init" first.\n');
      process.exit(1);
    }

    let schema;
    try {
      schema = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch (e) {
      console.error(`\nError: Could not parse settings.json: ${e.message}\n`);
      process.exit(1);
    }

    const { name } = await prompter.prompt({
      type: "input",
      name: "name",
      message: "What is the name of the property?",
      validate: (val) => {
        if (!val || /\s/.test(val)) return 'Must be a non-empty string without whitespace';
        if (schema.properties && schema.properties[val] !== undefined) return `Property "${val}" already exists`;
        return true;
      }
    });

    const { title } = await prompter.prompt({
      type: "input",
      name: "title",
      message: "What is the title of new property?",
    });

    const { description } = await prompter.prompt({
      type: "input",
      name: "description",
      message: "What is the description of new property?",
    });

    const { type } = await prompter.prompt({
      type: "select",
      name: "type",
      message: "What is the type of new property?",
      choices: [
        { message: "String", name: "string" },
        { message: "Integer", name: "integer" },
        { message: "Number", name: "number" },
        { message: "Boolean", name: "boolean" },
        { message: "Object", name: "object" },
        { message: "Array", name: "array" },
      ],
    });

    const prop = { type };
    if (title) prop.title = title;
    if (description) prop.description = description;

    if (type === "object" || type === "array") {
      const { xEntity } = await prompter.prompt({
        type: "select",
        name: "xEntity",
        message: "What is the entity of new property?",
        choices: [
          { message: "Issue", name: "Issue" },
          { message: "User", name: "User" },
          { message: "Project", name: "Project" },
          { message: "UserGroup", name: "UserGroup" },
          { message: "Article", name: "Article" },
        ],
      });
      if (type === 'object') prop['x-entity'] = xEntity;
      if (type === 'array') prop.items = { type: 'object', 'x-entity': xEntity };
    }

    if (type === "integer" || type === "number") {
      const { hasMinimum } = await prompter.prompt({
        type: "confirm",
        name: "hasMinimum",
        message: "Do you want to set minimum value for this property?",
      });
      if (hasMinimum) {
        const { isExclusiveMinimum } = await prompter.prompt({
          type: "confirm",
          name: "isExclusiveMinimum",
          message:
            "Do you want to set exclusive minimum value for this property?",
        });
        const { xMinimum } = await prompter.prompt({
          type: "number",
          name: "xMinimum",
          message: "What is the minimum value for this property?",
        });
        if (isExclusiveMinimum) {
          prop.exclusiveMinimum = xMinimum;
        } else {
          prop.minimum = xMinimum;
        }
      }

      const { hasMaximum } = await prompter.prompt({
        type: "confirm",
        name: "hasMaximum",
        message: "Do you want to set maximum value for this property?",
      });
      if (hasMaximum) {
        const { isExclusiveMaximum } = await prompter.prompt({
          type: "confirm",
          name: "isExclusiveMaximum",
          message:
            "Do you want to set exclusive maximum value for this property?",
        });
        const { xMaximum } = await prompter.prompt({
          type: "number",
          name: "xMaximum",
          message: "What is the maximum value for this property?",
        });
        if (isExclusiveMaximum) {
          prop.exclusiveMaximum = xMaximum;
        } else {
          prop.maximum = xMaximum;
        }
      }

      const { hasMultipleOf } = await prompter.prompt({
        type: "confirm",
        name: "hasMultipleOf",
        message: "Do you want to set multiple value for this property?",
      });
      if (hasMultipleOf) {
        const { xMultipleOf } = await prompter.prompt({
          type: "number",
          name: "xMultipleOf",
          message: "What is the multiple value for this property?",
        });
        prop.multipleOf = xMultipleOf;
      }
    }

    if (type === "string") {
      const { hasMinLength } = await prompter.prompt({
        type: "confirm",
        name: "hasMinLength",
        message: "Do you want to set minimum length for this property?",
      });
      if (hasMinLength) {
        const { minLength } = await prompter.prompt({
          type: "number",
          name: "minLength",
          message: "What is the minimum length of this property?",
        });
        prop.minLength = minLength;
      }

      const { hasMaxLength } = await prompter.prompt({
        type: "confirm",
        name: "hasMaxLength",
        message: "Do you want to set maximum length for this property?",
      });
      if (hasMaxLength) {
        const { maxLength } = await prompter.prompt({
          type: "number",
          name: "maxLength",
          message: "What is the maximum length of this property?",
        });
        prop.maxLength = maxLength;
      }

      const { format } = await prompter.prompt({
        type: "input",
        name: "format",
        message: "What is the pattern of this property?",
      });
      if (format) prop.format = format;

      const { hasEnum } = await prompter.prompt({
        type: "confirm",
        name: "hasEnum",
        message: "Do you want to set enum values for this property?",
      });
      if (hasEnum) {
        const { enumString } = await prompter.prompt({
          type: "input",
          name: "enumString",
          message:
            "What is the enum values of this property? (comma separated)",
        });
        prop.enum = enumString.split(/,\s*/).filter(Boolean);
      }
    }

    const { readOnly } = await prompter.prompt({
      type: "confirm",
      name: "readOnly",
      message: "Do you want to make this property read only?",
    });
    if (readOnly) {
      prop.readOnly = true;
      const { constValue } = await prompter.prompt({
        type: "input",
        name: "constValue",
        message: "What is the constant value of this property?",
        validate: (val) => {
          if (!val) return true;
          if (type === 'integer' || type === 'number') {
            return !isNaN(Number(val)) || 'Must be a valid number';
          }
          return true;
        },
      });
      if (constValue) {
        if (type === 'integer' || type === 'number') {
          prop.const = Number(constValue);
        } else {
          try { prop.const = JSON.parse(constValue); }
          catch { prop.const = constValue; }
        }
      }
    }

    const { writeOnly } = await prompter.prompt({
      type: "confirm",
      name: "writeOnly",
      message: "Do you want to make this property write only?",
    });
    if (writeOnly) prop.writeOnly = true;

    const { xScope } = await prompter.prompt({
      type: "select",
      name: "xScope",
      message: "What is the scope of this property?",
      choices: [
        { message: "Global", name: "global" },
        { message: "Project", name: "project" },
        { message: "Not set", name: "none" },
      ],
    });
    if (xScope && xScope !== 'none') prop['x-scope'] = xScope;

    const { required } = await prompter.prompt({
      type: "confirm",
      name: "required",
      message: "Do you want to make this property required?",
    });

    // Programmatically update settings.json (avoids Hygen inject + EJS trailing comma issues)
    if (!schema.properties) schema.properties = {};
    if (!Array.isArray(schema.required)) schema.required = [];

    schema.properties[name] = prop;
    if (required) schema.required.push(name);

    // Remove empty required array for cleaner output
    if (schema.required.length === 0) delete schema.required;

    fs.writeFileSync(settingsPath, JSON.stringify(schema, null, 2));
    console.log(`\n✓ Added property "${name}" to src/settings.json\n`);

    // Return skip flag so Hygen templates produce no file output
    return { _skip: true };
  },
};
