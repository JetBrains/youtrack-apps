import { PluggableObjectUsage } from "../../types";
import { GroupKey, GROUP_ORDER, groupRulesByType } from "./tableModel";

export const PRIORITY_GROUP: GroupKey = "on-change";

export const isPriorityGroup = (group: GroupKey) => group === PRIORITY_GROUP;

const withPriority = (rules: PluggableObjectUsage[]) =>
  rules.map((rule, index, array) => ({
    ...rule,
    priority: array.length - index,
  }));

export const buildPriorityPayload = (nextOnChange: PluggableObjectUsage[]) =>
  withPriority(nextOnChange).map((rule) => ({ id: rule.id, priority: rule.priority }));

export const rebuildPriorityRules = (
  allRules: PluggableObjectUsage[],
  nextOnChange: PluggableObjectUsage[],
) => {
  const updated = withPriority(nextOnChange);
  const updatedIds = new Set(updated.map((rule) => rule.id));
  const remaining = allRules.filter((rule) => !updatedIds.has(rule.id));
  return [...updated, ...remaining];
};

export const groupedRulesFromFlat = (rules: PluggableObjectUsage[]) => groupRulesByType(rules);

export const flattenGroupedRules = (grouped: Record<GroupKey, PluggableObjectUsage[]>) =>
  GROUP_ORDER.flatMap((key) => grouped[key]);

export const extractPriorityRules = (rules: PluggableObjectUsage[]) =>
  rules.filter((rule) => rule.pluggableObject.typeAlias === PRIORITY_GROUP);

export const withPriorityApplied = (rules: PluggableObjectUsage[]) =>
  rules.map((rule, index, array) => ({
    ...rule,
    priority: array.length - index,
  }));
