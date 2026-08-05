const path = require('node:path');
const fs = require('node:fs');
const {
  VALID_RULE_TYPES,
  renderRuleTemplate,
  resolveRuleTarget,
  validateRuleName,
  validateRuleType,
} = require('../../../utils/rule-scaffold');

module.exports = {
  prompt: async ({ prompter, args }) => {
    const answers = {};

    if (args.type) {
      answers.ruleType = String(args.type);
    } else {
      const response = await prompter.prompt({
        type: 'select',
        name: 'ruleType',
        message: 'Which workflow rule type do you want to create?',
        choices: VALID_RULE_TYPES.map(ruleType => ({ name: ruleType, message: ruleType })),
      });
      answers.ruleType = response.ruleType;
    }

    if (args.name) {
      answers.name = String(args.name);
    } else {
      const response = await prompter.prompt({
        type: 'input',
        name: 'name',
        message: 'What is the rule file name?',
        initial: 'notify-on-change',
      });
      answers.name = response.name;
    }

    validateRuleType(answers.ruleType);
    validateRuleName(answers.name);

    const isEnhancedDX = args.enhanced === true || args.enhanced === 'true';
    const targetCwd = path.resolve(process.cwd(), args.cwd || '.');
    const target = resolveRuleTarget(targetCwd, answers.name, isEnhancedDX);
    if (fs.existsSync(target.absolutePath)) {
      throw new Error(`Workflow rule already exists at ${target.relativePath}`);
    }

    return {
      ...answers,
      isEnhancedDX,
      content: renderRuleTemplate(answers.ruleType, isEnhancedDX),
    };
  },
};
