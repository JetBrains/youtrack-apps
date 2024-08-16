module.exports = {
  prompt: async ({ prompter, args }) => {
    console.log("args", args);
    const { name } = await prompter.prompt({
      type: "input",
      name: "name",
      message: "What is the name of the property?",
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

    //type specific questions
    let xEntity;

    if (type === "object" || type === "array") {
      await prompter
        .prompt({
          type: "select",
          name: "xEntity",
          message: "What is the entity of new property?",
          choices: [
            { message: "Issue", name: "Issue" },
            { message: "User", name: "User" },
            { message: "Project", name: "Project" },
            { message: "Project", name: "Project" },
            { message: "UserGroup", name: "UserGroup" },
            { message: "Article", name: "Article" },
          ],
        })
        .then((res) => {
          xEntity = res.xEntity;
        });
    }

    let exclusiveMinimum, exclusiveMaximum, minimum, maximum, multipleOf;
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
          exclusiveMinimum = xMinimum;
        } else {
          minimum = xMinimum;
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
          exclusiveMaximum = xMaximum;
        } else {
          maximum = xMaximum;
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
        multipleOf = xMultipleOf;
      }
    }

    let minLength, maxLength, format, enumValues;
    if (type === "string") {
      const { hasMinLength } = await prompter.prompt({
        type: "confirm",
        name: "hasMinLength",
        message: "Do you want to set minimum length for this property?",
      });
      if (hasMinLength) {
        await prompter
          .prompt({
            type: "number",
            name: "minLength",
            message: "What is the minimum length of this property?",
          })
          .then((res) => {
            minLength = res.minLength;
          });
      }

      const { hasMaxLength } = await prompter.prompt({
        type: "confirm",
        name: "hasMaxLength",
        message: "Do you want to set maximum length for this property?",
      });
      if (hasMaxLength) {
        await prompter
          .prompt({
            type: "number",
            name: "maxLength",
            message: "What is the maximum length of this property?",
          })
          .then((res) => {
            maxLength = res.maxLength;
          });
      }
      await prompter
        .prompt({
          type: "input",
          name: "format",
          message: "What is the pattern of this property?",
        })
        .then((res) => {
          format = res.format;
        });

      const { hasEnum } = await prompter.prompt({
        type: "confirm",
        name: "hasEnum",
        message: "Do you want to set enum values for this property?",
      });
      if (hasEnum) {
        await prompter
          .prompt({
            type: "input",
            name: "enumString",
            message:
              "What is the enum values of this property? (comma separated)",
          })
          .then(({ enumString }) => {
            const values = enumString.split(/,\s*/);
            enumValues = JSON.stringify(values);
          });
      }
    }

    //read only specific questions
    const { readOnly } = await prompter.prompt({
      type: "confirm",
      name: "readOnly",
      message: `Do you want to make this property read only?`,
    });

    let constValue;

    if (readOnly) {
      await prompter
        .prompt({
          type: "input",
          name: "constValue",
          message: `What is the constant value of this property?`,
        })
        .then((res) => {
          if (type === "string") {
            constValue = `"res.constValue"`;
          } else {
            constValue = res.constValue;
          }
        });
    }

    const { xScope } = await prompter.prompt({
      type: "select",
      name: "xScope",
      message: `What is the scope of this property?`,
      choices: [
        { message: "Global", name: "global" },
        { message: "Project", name: "project" },
        { message: "Not set", name: "none" },
      ],
    });

    const { required } = await prompter.prompt({
      type: "confirm",
      name: "required",
      message: `Do you want to make this property required?`,
    });

    const { writeOnly } = await prompter.prompt({
      type: "confirm",
      name: "writeOnly",
      message: `Do you want to make this property write only?`,
    });

    return {
      name,
      title,
      description,
      type,
      xEntity,
      exclusiveMinimum,
      exclusiveMaximum,
      minimum,
      maximum,
      multipleOf,
      minLength,
      maxLength,
      format,
      writeOnly,
      readOnly,
      constValue,
      xScope,
      required,
      enumValues,
    };
  },
};
