import { PluggableObjectUsage } from "../../types";

export interface TableRowData {
  id: string;
  rule: string;
  ruleSubtitle: string;
  app: string;
  appTitle: string;
  appName: string;
  isDisabled: boolean;
  isActive: boolean;
  enabled: boolean;
  isBroken: boolean;
  configEnabled: boolean;
  configMissingRequiredSettings: boolean;
  globalConfigEnabled: boolean;
  globalConfigMissingRequiredSettings: boolean;
  activeTooltip: string[];
  priority: number;
  appId: string;
  pluggableObjectId: string;
  autoAttach: boolean;
  errors?: string[];
}

export type GroupKey = "on-change" | "action" | "on-schedule" | "statemachine";
export const GROUP_ORDER: GroupKey[] = ["on-change", "action", "on-schedule", "statemachine"];

export type SortKey = "priority" | "rule" | "active" | "enabled" | "autoAttach";
export type SortOrder = "asc" | "desc";
export type SortState = Record<GroupKey, { key: SortKey; order: SortOrder }>;

export const DEFAULT_SORT_STATE: SortState = {
  "on-change": { key: "priority", order: "desc" },
  action: { key: "rule", order: "asc" },
  "on-schedule": { key: "rule", order: "asc" },
  statemachine: { key: "rule", order: "asc" },
};

export const getGroupTitle = (groupName: GroupKey): string => {
  const titles: Record<GroupKey, string> = {
    "on-change": "On-Change Rules",
    "on-schedule": "On-Schedule Rules",
    statemachine: "State-Machine Rules",
    action: "Action Rules",
  };
  return titles[groupName];
};

export type TokenOperator = "and" | "or";

export interface FilterToken {
  field: string;
  value: string | boolean | number;
  operator: TokenOperator;
  negated: boolean;
}

const FIELD_ALIASES: Record<string, string> = {
  rule: "rule",
  name: "rule",
  title: "rule",
  app: "app",
  appname: "app",
  appName: "app",
  appid: "appId",
  id: "id",
  priority: "priority",
  enabled: "enabled",
  disabled: "disabled",
  active: "active",
  autoattach: "autoAttach",
  group: "group",
  text: "text",
};

const lowerCase = (value: string) => value.toLowerCase();

const pickFirstString = (...values: Array<string | null | undefined>) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0);

const normalizeValue = (input: string) => input.trim().replace(/^"|"$/g, "");

const booleanFromString = (value: string) => {
  const normalized = lowerCase(value);
  if (normalized === "true" || normalized === "yes" || normalized === "1") {
    return true;
  }
  if (normalized === "false" || normalized === "no" || normalized === "0") {
    return false;
  }
  return null;
};

const extractFieldAndValue = (segment: string) => {
  const [fieldPart, ...valueParts] = segment.split(":");
  const rawField = fieldPart ?? "";
  const rawValue = valueParts.join(":");
  return { rawField, rawValue };
};

const interpretValue = (rawValue: string): string | boolean | number => {
  const cleaned = normalizeValue(rawValue);
  const asBoolean = booleanFromString(cleaned);
  if (asBoolean !== null) {
    return asBoolean;
  }
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
    return Number(cleaned);
  }
  return cleaned;
};

const parseSegment = (segment: string, defaultOperator: TokenOperator): FilterToken | null => {
  if (!segment) {
    return null;
  }

  let operator = defaultOperator;
  let text = segment;

  if (/^or\s+/i.test(text)) {
    operator = "or";
    text = text.replace(/^or\s+/i, "");
  } else if (/^and\s+/i.test(text)) {
    operator = "and";
    text = text.replace(/^and\s+/i, "");
  }

  let negated = false;
  if (text.startsWith("-")) {
    negated = true;
    text = text.slice(1);
  }

  const { rawField, rawValue } = extractFieldAndValue(text);

  if (!rawValue) {
    return {
      field: "text",
      value: normalizeValue(rawField),
      operator,
      negated,
    };
  }

  const candidateField = lowerCase(rawField.trim());
  const field = FIELD_ALIASES[candidateField] ?? "text";

  return {
    field,
    value: interpretValue(rawValue),
    operator,
    negated,
  };
};

const parseQueryTokens = (query: string): FilterToken[] => {
  const segments = query
    .split(/\s+(?=and\s+|or\s+|-[^\s]+:?)/i)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const tokens: FilterToken[] = [];

  segments.forEach((segment, index) => {
    const token = parseSegment(segment, "and");
    if (token) {
      if (index > 0) {
        tokens[tokens.length - 1].operator = token.operator;
        token.operator = "and";
      }
      tokens.push(token);
    }
  });
  return tokens;
};

export const tokenizeFilterQuery = (query: string): FilterToken[] => parseQueryTokens(query);

const shouldQuoteValue = (value: string) => /[\s:]/.test(value);

const escapeQuotes = (value: string) => value.replace(/"/g, '\\"');

const stringifyValue = (value: string | boolean | number) => {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return String(value);
  }
  const trimmed = value.trim();
  if (shouldQuoteValue(trimmed)) {
    return `"${escapeQuotes(trimmed)}"`;
  }
  return trimmed;
};

const stringifyToken = (token: FilterToken, index: number) => {
  const operator = index === 0 ? "" : `${token.operator} `;
  const prefix = token.negated ? "-" : "";
  if (token.field === "text") {
    return `${operator}${prefix}${stringifyValue(token.value)}`.trim();
  }
  return `${operator}${prefix}${token.field}:${stringifyValue(token.value)}`.trim();
};

export const stringifyTokens = (tokens: FilterToken[]): string => {
  if (tokens.length === 0) {
    return "";
  }
  return tokens
    .map((token, index) => stringifyToken(token, index))
    .filter((part) => part.length > 0)
    .join(" ")
    .trim();
};

const matchBoolean = (candidate: boolean, expected: string | boolean | number) => {
  if (typeof expected === "boolean") {
    return candidate === expected;
  }
  return candidate === booleanFromString(String(expected));
};

const matchStringIncludes = (source: string, expected: string | boolean | number) => {
  const text = typeof expected === "string" ? expected : String(expected);
  return source.toLowerCase().includes(text.toLowerCase());
};

const BOOLEAN_FIELDS: Map<string, (row: TableRowData) => boolean> = new Map([
  ["enabled", (row) => row.enabled],
  ["disabled", (row) => !row.enabled],
  ["active", (row) => row.isActive],
  ["autoAttach", (row) => row.autoAttach],
]);

const TEXT_FIELDS: Map<string, (row: TableRowData) => string> = new Map([
  ["rule", (row) => row.rule],
  ["title", (row) => row.rule],
  ["name", (row) => row.rule],
  ["appId", (row) => row.appId],
  ["appid", (row) => row.appId],
  ["id", (row) => row.id],
]);

const matchesPriority = (row: TableRowData, value: string | boolean | number) => {
  if (typeof value === "number") {
    return row.priority === value;
  }
  return matchStringIncludes(String(row.priority), value);
};

const matchesText = (row: TableRowData, value: string | boolean | number) =>
  matchStringIncludes(row.rule, value) ||
  matchStringIncludes(row.ruleSubtitle, value) ||
  matchStringIncludes(row.app, value) ||
  matchStringIncludes(row.id, value);

const matchesApp = (row: TableRowData, value: string | boolean | number) =>
  matchStringIncludes(row.appName, value) || matchStringIncludes(row.appTitle, value);

const evaluateToken = (row: TableRowData, token: FilterToken, groupName: GroupKey) => {
  if (token.field === "group") {
    return matchStringIncludes(groupName, token.value);
  }

  if (token.field === "app") {
    return matchesApp(row, token.value);
  }

  const textResolver = TEXT_FIELDS.get(token.field);
  if (textResolver) {
    return matchStringIncludes(textResolver(row), token.value);
  }

  if (token.field === "priority") {
    return matchesPriority(row, token.value);
  }

  if (token.field === "text") {
    return matchesText(row, token.value);
  }

  const booleanResolver = BOOLEAN_FIELDS.get(token.field);
  if (booleanResolver) {
    return matchBoolean(booleanResolver(row), token.value);
  }

  return true;
};

const combineResults = (current: boolean, next: boolean, operator: TokenOperator) =>
  operator === "or" ? current || next : current && next;

const buildEvaluationChain = (row: TableRowData, tokens: FilterToken[], groupName: GroupKey) =>
  tokens.reduce(
    (state, token) => {
      const evaluation = evaluateToken(row, token, groupName);
      const finalResult = token.negated ? !evaluation : evaluation;
      return {
        result: combineResults(state.result, finalResult, state.operator),
        operator: token.operator,
      };
    },
    { result: true, operator: "and" as TokenOperator },
  ).result;

export const evaluateFilterQuery = (rows: TableRowData[], groupName: GroupKey, query: string) => {
  const tokens = tokenizeFilterQuery(query);
  if (tokens.length === 0) {
    return rows;
  }
  return rows.filter((row) => buildEvaluationChain(row, tokens, groupName));
};

const resolveRuleTitle = (ruleUsage: PluggableObjectUsage) =>
  pickFirstString(ruleUsage.pluggableObject?.title, ruleUsage.pluggableObject?.name, ruleUsage.id) ?? ruleUsage.id;

const resolveAppTitle = (ruleUsage: PluggableObjectUsage) =>
  pickFirstString(ruleUsage.configuration?.app?.title, ruleUsage.configuration?.app?.name) ?? "";

const resolveAppName = (ruleUsage: PluggableObjectUsage) => ruleUsage.configuration?.app?.name ?? "";

const resolveWorkflowRuleName = (ruleUsage: PluggableObjectUsage) =>
  pickFirstString(ruleUsage.pluggableObject?.name, ruleUsage.pluggableObject?.title, ruleUsage.id) ?? ruleUsage.id;

const resolveRuleSubtitle = (ruleUsage: PluggableObjectUsage, appName: string, appTitle: string) => {
  const workflowName = pickFirstString(appName, appTitle) ?? "";
  const ruleName = resolveWorkflowRuleName(ruleUsage);
  const parts = [workflowName, ruleName].filter((value) => value && value.length > 0) as string[];
  return parts.length > 0 ? parts.join("/") : ruleUsage.id;
};

const buildRuleMeta = (ruleUsage: PluggableObjectUsage) => {
  const appTitle = resolveAppTitle(ruleUsage);
  const appName = resolveAppName(ruleUsage);
  const ruleTitle = resolveRuleTitle(ruleUsage);
  const ruleSubtitle = resolveRuleSubtitle(ruleUsage, appName, appTitle);
  return {
    ruleTitle,
    ruleSubtitle,
    appTitle,
    appName,
  };
};

const toBoolean = (value: boolean | null | undefined) => Boolean(value);

const compareStrings = (a: string | null | undefined, b: string | null | undefined, ascending: boolean) => {
  const result = (a ?? "").localeCompare(b ?? "", undefined, { sensitivity: "base" });
  return ascending ? result : -result;
};

const compareNumbers = (a: number, b: number, ascending: boolean) => {
  const result = a - b;
  return ascending ? result : -result;
};

const compareBoolean = (a: boolean | null | undefined, b: boolean | null | undefined, ascending: boolean) => {
  const normalizedA = toBoolean(a) ? 1 : 0;
  const normalizedB = toBoolean(b) ? 1 : 0;
  return ascending ? normalizedA - normalizedB : normalizedB - normalizedA;
};

const isRuleEnabled = (ruleUsage: PluggableObjectUsage) => ruleUsage.enabled;
const isRuleHealthy = (ruleUsage: PluggableObjectUsage) => !ruleUsage.isBroken;
const isProjectAppEnabled = (ruleUsage: PluggableObjectUsage) => ruleUsage.configuration.enabled;
const hasProjectAppSettings = (ruleUsage: PluggableObjectUsage) => !ruleUsage.configuration.missingRequiredSettings;
const isGlobalAppEnabled = (ruleUsage: PluggableObjectUsage) => ruleUsage.configuration.app.globalConfig.enabled;
const hasGlobalAppSettings = (ruleUsage: PluggableObjectUsage) => !ruleUsage.configuration.app.globalConfig.missingRequiredSettings;

const calculateActiveStatus = (ruleUsage: PluggableObjectUsage) => {
  const enabled = isRuleEnabled(ruleUsage);
  const healthy = isRuleHealthy(ruleUsage);
  const projectEnabled = isProjectAppEnabled(ruleUsage);
  const projectConfigured = hasProjectAppSettings(ruleUsage);
  const globalEnabled = isGlobalAppEnabled(ruleUsage);
  const globalConfigured = hasGlobalAppSettings(ruleUsage);

  const isActive = enabled && healthy && projectEnabled && projectConfigured && globalEnabled && globalConfigured;

  return {
    isActive,
    enabled,
    notIsBroken: healthy,
    configEnabled: projectEnabled,
    notConfigMissingRequiredSettings: projectConfigured,
    globalConfigEnabled: globalEnabled,
    notGlobalConfigMissingRequiredSettings: globalConfigured,
  };
};

const collectActiveIssues = (status: ReturnType<typeof calculateActiveStatus>) => {
  const issues = [] as string[];
  if (!status.enabled) {
    issues.push("Rule is inactive");
  }
  if (!status.notIsBroken) {
    issues.push("Rule requirements are not met");
  }
  if (!status.configEnabled) {
    issues.push("App is deactivated in the project settings");
  }
  if (!status.notConfigMissingRequiredSettings) {
    issues.push("App settings required at the project level have not been set");
  }
  return issues;
};

const collectGlobalIssues = (status: ReturnType<typeof calculateActiveStatus>) => {
  const issues = [] as string[];
  if (!status.globalConfigEnabled) {
    issues.push("App is deactivated at the global level");
  }
  if (!status.notGlobalConfigMissingRequiredSettings) {
    issues.push("App settings required at the global level have not been set");
  }
  return issues;
};

const generateActiveTooltip = (status: ReturnType<typeof calculateActiveStatus>) => {
  if (status.isActive) {
    return [] as string[];
  }
  return [...collectActiveIssues(status), ...collectGlobalIssues(status)];
};

const resolveErrors = (ruleUsage: PluggableObjectUsage) => {
  const inlineErrors = ruleUsage.errors ?? [];
  const problemMessages = ruleUsage.problems?.map((problem) => problem.message) ?? [];
  return [...inlineErrors, ...problemMessages];
};

const normalizePriority = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

// eslint-disable-next-line complexity
const mapRow = (ruleUsage: PluggableObjectUsage): TableRowData => {
  const { ruleTitle, ruleSubtitle, appTitle, appName } = buildRuleMeta(ruleUsage);
  const activeStatus = calculateActiveStatus(ruleUsage);
  const activeTooltip = generateActiveTooltip(activeStatus);
  const isDisabled = !ruleUsage.enabled || !activeStatus.isActive;
  const errors = resolveErrors(ruleUsage);

  return {
    id: ruleUsage.id,
    rule: ruleTitle,
    ruleSubtitle,
    app: appName,
    appTitle,
    appName,
    isDisabled,
    isActive: activeStatus.isActive,
    enabled: ruleUsage.enabled,
    isBroken: ruleUsage.isBroken,
    configEnabled: ruleUsage.configuration.enabled,
    configMissingRequiredSettings: ruleUsage.configuration.missingRequiredSettings,
    globalConfigEnabled: ruleUsage.configuration.app.globalConfig.enabled,
    globalConfigMissingRequiredSettings: ruleUsage.configuration.app.globalConfig.missingRequiredSettings,
    activeTooltip,
    priority: normalizePriority(ruleUsage.priority),
    appId: ruleUsage.configuration.app.id,
    pluggableObjectId: ruleUsage.pluggableObject?.id ?? ruleUsage.id,
    autoAttach: Boolean(ruleUsage.configuration?.app?.autoAttach),
    errors,
  };
};

export const makeRowData = (rulesUsages: PluggableObjectUsage[]): TableRowData[] => rulesUsages.map(mapRow);

const ROW_COMPARATORS: Record<SortKey, (a: TableRowData, b: TableRowData, ascending: boolean) => number> = {
  priority: (a, b, asc) => compareNumbers(a.priority, b.priority, asc),
  rule: (a, b, asc) => compareStrings(a.rule, b.rule, asc),
  active: (a, b, asc) => compareBoolean(a.isActive, b.isActive, asc),
  enabled: (a, b, asc) => compareBoolean(a.enabled, b.enabled, asc),
  autoAttach: (a, b, asc) => compareBoolean(a.autoAttach, b.autoAttach, asc),
};

export const sortData = (data: TableRowData[], sort: { key: SortKey; order: SortOrder }) => {
  const comparator = ROW_COMPARATORS[sort.key];
  if (!comparator) {
    return [...data];
  }
  const ascending = sort.order === "asc";
  return [...data].sort((a, b) => comparator(a, b, ascending));
};

export const groupRulesByType = (rulesUsages: PluggableObjectUsage[]) => ({
  "on-change": rulesUsages
    .filter((ruleUsage) => ruleUsage.pluggableObject.typeAlias === "on-change")
    .sort((a, b) => normalizePriority(b.priority) - normalizePriority(a.priority)),
  action: rulesUsages.filter((ruleUsage) => ruleUsage.pluggableObject.typeAlias === "action"),
  "on-schedule": rulesUsages.filter((ruleUsage) => ruleUsage.pluggableObject.typeAlias === "on-schedule"),
  statemachine: rulesUsages.filter((ruleUsage) => ruleUsage.pluggableObject.typeAlias === "statemachine"),
});


