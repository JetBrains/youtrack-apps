// Config interpreter. Other modules ask these helpers for policy decisions instead of reading ENGINE_CONFIG directly.
import { ENGINE_CONFIG } from "../config.ts";
import { methodObject, moduleObject, typeObject } from "./api-objects.ts";
import type { RuleApiObject } from "./api-objects.ts";
import type { MergedTypeRule, MethodSplitRule, ModuleTypeMode, ObjectRule } from "./config-types.ts";
import type { ApiObjectKind, DocBlock, DocItem, MethodGroup, ModuleGroup } from "../types.ts";

function objectRules(): ObjectRule[] {
  return ENGINE_CONFIG.objects as ObjectRule[];
}

function hasText(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function matchesValue(selectorValue: string | string[] | undefined, actualValue: string | undefined): boolean {
  if (selectorValue === undefined) {
    return true;
  }
  if (actualValue === undefined) {
    return false;
  }

  const values = Array.isArray(selectorValue) ? selectorValue : [selectorValue];
  return values.includes(actualValue);
}

function matchesKind(selectorValue: ApiObjectKind | ApiObjectKind[], actualValue: ApiObjectKind): boolean {
  const values = Array.isArray(selectorValue) ? selectorValue : [selectorValue];
  return values.includes(actualValue);
}

function selectorMatches(rule: ObjectRule, object: RuleApiObject): boolean {
  // Generated objects are matched by kind/module/owner/name, plus lightweight
  // prefix/suffix checks for inheritance and method grouping.
  const selector = rule.object;
  if (!matchesKind(selector.kind, object.kind)) {
    return false;
  }
  if (!matchesValue(selector.module, object.module)) {
    return false;
  }
  if (!matchesValue(selector.owner, object.owner)) {
    return false;
  }
  if (!matchesValue(selector.name, object.name)) {
    return false;
  }
  if (selector.nameStartsWith && !object.name?.startsWith(selector.nameStartsWith)) {
    return false;
  }
  if (selector.nameSuffix && !object.name?.endsWith(selector.nameSuffix)) {
    return false;
  }
  if (selector.ancestorStartsWith && !(object.ancestors || []).some((name) => name.startsWith(selector.ancestorStartsWith))) {
    return false;
  }
  return true;
}

function firstRule(object: RuleApiObject): ObjectRule | undefined {
  return objectRules().find((rule) => selectorMatches(rule, object));
}

export function relevantDocKinds(): Set<string> {
  return new Set(ENGINE_CONFIG.docs.relevantKinds);
}

export function isExcludedDocName(name: string | undefined): boolean {
  return Boolean(name && ENGINE_CONFIG.docs.excludeNames.includes(name));
}

export function isFunctionTypeDoc(doc: DocItem): boolean {
  return doc.kind === "typedef" && Boolean(doc.type?.names?.includes("function"));
}

export function isPublicTypeDoc(doc: DocItem, moduleLongname: string): boolean {
  if (!doc.name || doc.memberof !== moduleLongname) {
    return false;
  }

  // The inspected API shapes show public objects have classdesc or a property
  // schema; property schemas include JsonFor* typedefs.
  return hasText(doc.classdesc) || Boolean(doc.properties?.length);
}

export function shouldInlineModuleTypes(moduleKey: string, module: ModuleGroup): boolean {
  // "auto" keeps small modules in one file and splits large modules into type
  // detail files without needing explicit rules for every module.
  const mode =
    firstRule(moduleObject(moduleKey))?.position?.types ??
    (ENGINE_CONFIG.defaults.types as ModuleTypeMode);

  if (mode === "merge") {
    return true;
  }
  if (mode === "split") {
    return false;
  }
  return Object.keys(module.types).length <= ENGINE_CONFIG.defaults.splitTypesAfter;
}

export function rootTypeRule(moduleKey: string, typeName: string): { filename: string } | undefined {
  const rule = firstRule(typeObject(moduleKey, typeName));
  if (!rule?.position?.file || rule.merge) {
    return undefined;
  }
  return { filename: rule.position.file };
}

export function mergedTypeRule(moduleKey: string, typeName: string): MergedTypeRule | undefined {
  const rule = firstRule(typeObject(moduleKey, typeName));
  if (!rule?.position?.file || !rule.merge) {
    return undefined;
  }

  const selectorName = rule.object.name;
  const names = Array.isArray(selectorName) ? selectorName : selectorName ? [selectorName] : [typeName];
  return {
    filename: rule.position.file,
    names,
    title: rule.merge.title,
    primaryName: rule.merge.title,
    sectionNames: rule.merge.sections,
  };
}

export function typeFolderForObject(moduleKey: string, typeName: string, ancestors: string[]): string {
  return firstRule(typeObject(moduleKey, typeName, ancestors))?.position?.folder || "";
}

function titleFromPathName(value: string): string {
  return value
    .replace(/\.md$/i, "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function typePositionGroupsForModule(moduleKey: string): Array<{ key: string; title: string }> {
  const groups: Array<{ key: string; title: string }> = [];
  for (const rule of objectRules()) {
    const positionName = rule.position?.folder || rule.position?.file;
    if (
      !positionName ||
      !matchesKind(rule.object.kind, "type") ||
      !matchesValue(rule.object.module, moduleKey) ||
      groups.some((group) => group.key === positionName)
    ) {
      continue;
    }
    groups.push({ key: positionName, title: rule.merge?.title || titleFromPathName(positionName) });
  }
  return groups;
}

export function shouldLinkTypeFromModule(moduleKey: string, folder: string): boolean {
  const rule = objectRules().find(
    (item) =>
      matchesKind(item.object.kind, "type") &&
      matchesValue(item.object.module, moduleKey) &&
      item.position?.folder === folder,
  );
  return rule?.position?.linkFromModule ?? true;
}

export function shouldIncludeInheritedMembers(moduleKey: string, typeName: string): boolean {
  return firstRule(typeObject(moduleKey, typeName))?.members?.includeInherited ?? false;
}

function methodMatchesSplit(method: DocBlock, split: MethodSplitRule): boolean {
  if (split.nameSuffix && !method.name?.endsWith(split.nameSuffix)) {
    return false;
  }
  return !(split.excludeNameSuffix || []).some((suffix) => method.name?.endsWith(suffix));
}

export function methodGroupsForTypePage(
  moduleKey: string | undefined,
  typeName: string,
  methods: DocBlock[],
): MethodGroup[] {
  if (!moduleKey) {
    return [];
  }

  const rule = firstRule(methodObject(moduleKey, typeName));
  const splits = rule?.split?.methods;
  if (!splits?.length) {
    return [];
  }

  return splits
    .map((split) => ({
      heading: split.title,
      methods: methods.filter((method) => methodMatchesSplit(method, split)),
    }))
    .filter((group) => group.methods.length > 0);
}

export function cleanupFolders(): string[] {
  return ENGINE_CONFIG.cleanup.folders;
}

export function staleRootFiles(): string[] {
  return ENGINE_CONFIG.cleanup.staleRootFiles;
}

export function typeReferencePostProcessors(): Array<{ typeName: string; targetFile: string }> {
  return objectRules()
    .filter((rule) => rule.referencedOn)
    .map((rule) => ({
      typeName: rule.referencedOn?.text as string,
      targetFile: rule.referencedOn?.file || rule.position?.file || "",
    }))
    .filter((rule) => rule.targetFile);
}

export type { MergedTypeRule };
