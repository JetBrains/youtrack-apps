const path = require('node:path');

const VALID_RULE_TYPES = Object.freeze([
  'onChange',
  'onSchedule',
  'action',
  'stateMachine',
  'sla',
]);

function validateRuleType(ruleType) {
  if (!VALID_RULE_TYPES.includes(ruleType)) {
    throw new Error(`Invalid rule type: "${ruleType}". Must be one of: ${VALID_RULE_TYPES.join(', ')}.`);
  }
}

function validateRuleName(name) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('Invalid rule name: must be a lowercase dashed filename stem.');
  }

  if (name.includes('/') || name.includes('\\')) {
    throw new Error(`Invalid rule name: "${name}". Nested paths are not supported.`);
  }

  if (name.includes('.')) {
    throw new Error(`Invalid rule name: "${name}". Do not include a file extension.`);
  }

  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`Invalid rule name: "${name}". Must use lowercase letters, numbers, and single hyphens.`);
  }
}

function getRuleExtension(isEnhancedDX = false) {
  return isEnhancedDX ? 'ts' : 'js';
}

function resolveRuleTarget(cwd, name, isEnhancedDX = false) {
  const relativePath = isEnhancedDX
    ? path.join('src', 'workflows', `${name}.ts`)
    : path.join('src', `${name}.js`);

  return {
    relativePath,
    absolutePath: path.join(cwd, relativePath),
  };
}

function renderJsRequirements() {
  return '  requirements: { /* TODO: add requirements */ },';
}

function renderTsRequirements() {
  return '  requirements,';
}

function buildRuleBodies(renderRequirements) {
  return {
    onChange: `  title: '', // TODO: add rule title
  guard: (ctx) => {
    // TODO: return true when the rule should run
    return false;
  },
  action: (ctx) => {
    // TODO: implement rule action
  },
${renderRequirements()}`,

    onSchedule: `  title: '', // TODO: add rule title
  search: '', // TODO: add issue search query
  cron: '', // TODO: add cron expression
  action: (ctx) => {
    // TODO: implement scheduled action
  },
${renderRequirements()}`,

    action: `  title: '', // TODO: add rule title
  command: '', // TODO: add command name
  guard: (ctx) => {
    // TODO: return true when the action should be available
    return false;
  },
  action: (ctx) => {
    // TODO: implement action
  },
${renderRequirements()}`,

    stateMachine: `  title: '', // TODO: add rule title
  fieldName: '', // TODO: add field name
  states: { /* TODO: define states and transitions */ },
${renderRequirements()}`,

    sla: `  title: '', // TODO: add SLA title
  guard: (ctx) => {
    // TODO: return true when this SLA policy should apply
    return false;
  },
  onEnter: (ctx) => {
    // TODO: initialize SLA timers
  },
  action: (ctx) => {
    // TODO: update SLA timers
  },
  onBreach: (ctx) => {
    // TODO: handle breached SLA goal
  },
${renderRequirements()}`,
  };
}

function renderRuleTemplate(ruleType, isEnhancedDX = false) {
  validateRuleType(ruleType);

  const ruleBodies = buildRuleBodies(isEnhancedDX ? renderTsRequirements : renderJsRequirements);

  if (isEnhancedDX) {
    return `import { Issue } from '@jetbrains/youtrack-scripting-api/entities';
import { requirements } from '../backend/requirements';

export const rule = Issue.${ruleType}({
${ruleBodies[ruleType]}
});
`;
  }

  return `const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.rule = entities.Issue.${ruleType}({
${ruleBodies[ruleType]}
});
`;
}

function buildRuleScaffold(cwd, ruleType, name, isEnhancedDX = false) {
  validateRuleType(ruleType);
  validateRuleName(name);

  return {
    ...resolveRuleTarget(cwd, name, isEnhancedDX),
    content: renderRuleTemplate(ruleType, isEnhancedDX),
  };
}

module.exports = {
  VALID_RULE_TYPES,
  buildRuleScaffold,
  getRuleExtension,
  renderRuleTemplate,
  resolveRuleTarget,
  validateRuleName,
  validateRuleType,
};
