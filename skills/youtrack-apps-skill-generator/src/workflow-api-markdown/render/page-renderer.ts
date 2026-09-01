import * as fs from "node:fs";
import * as path from "node:path";

// Builds structured page models. Eta templates own the Markdown layout.
import { mergedTypeRule, methodGroupsForTypePage, rootTypeRule, typePositionGroupsForModule } from "../engine/rules.ts";
import { markdownAnchor, markdownFilename } from "./markdown-format.ts";
import { buildTypePageModel, outputFolderForType } from "./type-model.ts";
import { renderModuleTemplate, renderTypeTemplate } from "./template-renderer.ts";
import type {
  ContentsTemplateModel,
  InlineTypeGroupTemplateModel,
  MarkdownLinkModel,
  MergedTypeSectionTemplateModel,
  TypeMembersTemplateModel,
  TypeSectionTemplateModel,
} from "./template-renderer.ts";
import type { DocBlock, GeneratedFile, MethodGroup, ModuleGroup, NamedBlock, TypePageModel } from "../types.ts";
import type { MergedTypeRule } from "../engine/rules.ts";

interface TypeListGroup {
  key: string;
  title: string;
  typeNames: string[];
}

const UNGROUPED_TYPE_KEY = "__ungrouped__";

class InjectionSnippets {
  private directory = path.join(path.dirname(path.resolve(process.argv[1] || ".")), "injections");

  setDirectory(dir: string): void {
    this.directory = path.resolve(dir);
  }

  read(filename: string): string {
    const filePath = path.join(this.directory, filename);
    if (!fs.existsSync(filePath)) {
      return "";
    }
    return fs.readFileSync(filePath, "utf8").trim();
  }
}

const injectionSnippets = new InjectionSnippets();

export function setInjectionsDir(dir: string): void {
  injectionSnippets.setDirectory(dir);
}

export function uniqueTypePageFilename(name: string, used: Set<string>): string {
  let filename = markdownFilename(name);
  while (used.has(filename)) {
    filename = markdownFilename(`${name}-${used.size + 1}`);
  }
  used.add(filename);
  return filename;
}

function configuredMethodGroups(moduleKey: string | undefined, typeName: string, methods: DocBlock[]): MethodGroup[] {
  return moduleKey ? methodGroupsForTypePage(moduleKey, typeName, methods, (filename) => injectionSnippets.read(filename)) : [];
}

function namedProperties(typeProperties: NamedBlock[] | undefined, propertyDocs: TypePageModel["properties"]): string[] {
  return [
    ...(typeProperties || []).map((property) => property.name).filter((name): name is string => Boolean(name)),
    ...propertyDocs.map((doc) => doc.name).filter((name): name is string => Boolean(name)),
  ];
}

function buildContents(
  model: TypePageModel,
  headingLevel: number,
  methodGroups: MethodGroup[],
): ContentsTemplateModel | null {
  const propertyNames = namedProperties(model.typeProperties, model.properties);
  const methodNames = model.methods.map((doc) => doc.name).filter((name): name is string => Boolean(name));

  if (model.constructors.length === 0 && propertyNames.length === 0 && methodNames.length === 0) {
    return null;
  }

  return {
    headingLevel,
    constructors: model.constructors.map((constructor) => ({
      label: constructor.name,
      href: `#new-${markdownAnchor(constructor.name)}`,
    })),
    properties: propertyNames.map((name) => {
      const hasDetailedHeading = model.properties.some((doc) => doc.name === name);
      return hasDetailedHeading ? { label: name, href: `#${markdownAnchor(name)}` } : { label: name };
    }),
    methodGroups: methodGroups
      .filter((group) => group.methods.length > 0)
      .map((group) => ({
        heading: group.heading,
        href: `#${markdownAnchor(group.heading)}`,
        methods: group.methods
          .filter((method): method is DocBlock & { name: string } => Boolean(method.name))
          .map((method) => ({ label: method.name, href: `#${markdownAnchor(method.name)}` })),
      })),
    methods: methodGroups.length === 0
      ? methodNames.map((name) => ({ label: name, href: `#${markdownAnchor(name)}` }))
      : [],
  };
}

function buildTypeMembers(typeName: string, model: TypePageModel, moduleKey: string | undefined, headingLevel: number): TypeMembersTemplateModel {
  const methodGroups = configuredMethodGroups(moduleKey, typeName, model.methods);

  return {
    headingLevel: headingLevel + 1,
    parentTypes: model.hierarchy.slice(0, -1),
    contents: buildContents(model, headingLevel + 1, methodGroups),
    examples: model.typeDoc?.examples || [],
    constructors: model.constructors,
    typeProperties: model.typeProperties,
    properties: model.properties,
    methodGroups,
    methods: methodGroups.length === 0 ? model.methods : [],
  };
}

function buildTypeSection(
  typeName: string,
  model: TypePageModel,
  headingLevel: number,
  moduleKey?: string,
  anchor?: string,
): TypeSectionTemplateModel {
  return {
    name: typeName,
    headingLevel,
    anchor,
    doc: model.typeDoc,
    members: buildTypeMembers(typeName, model, moduleKey, headingLevel),
  };
}

function inlineGroupAnchor(group: TypeListGroup): string {
  return `types-${markdownAnchor(group.title)}`;
}

function inlineTypeAnchor(typeName: string): string {
  return `type-${markdownAnchor(typeName)}`;
}

function groupKeyForInlineType(module: ModuleGroup, typeName: string): string {
  const mergeRule = mergedTypeRule(module.key, typeName);
  if (mergeRule) {
    return mergeRule.filename;
  }

  const rootRule = rootTypeRule(module.key, typeName);
  if (rootRule) {
    return rootRule.filename;
  }

  return outputFolderForType(module, typeName) || UNGROUPED_TYPE_KEY;
}

function inlineTypeGroups(module: ModuleGroup, inlineTypeNames: string[]): TypeListGroup[] {
  const configuredGroups: TypeListGroup[] = typePositionGroupsForModule(module.key).map((group) => ({
    ...group,
    typeNames: [],
  }));
  const groupsByKey = new Map(configuredGroups.map((group) => [group.key, group]));
  const ungrouped: TypeListGroup = { key: UNGROUPED_TYPE_KEY, title: "Other Types", typeNames: [] };

  for (const typeName of [...inlineTypeNames].sort()) {
    const key = groupKeyForInlineType(module, typeName);
    const group = groupsByKey.get(key) || ungrouped;
    group.typeNames.push(typeName);
  }

  return [...configuredGroups.filter((group) => group.typeNames.length > 0), ...(ungrouped.typeNames.length > 0 ? [ungrouped] : [])];
}

function shouldGroupInlineTypes(module: ModuleGroup, inlineTypeNames: string[]): boolean {
  return inlineTypeNames.length > 0 && typePositionGroupsForModule(module.key).length > 0;
}

function buildTypesList(
  module: ModuleGroup,
  typeLinks: Record<string, string>,
  inlineTypeNames: string[],
): MarkdownLinkModel[] {
  const typeNames = Object.keys(typeLinks).sort();
  if (typeNames.length === 0) {
    return [];
  }

  if (shouldGroupInlineTypes(module, inlineTypeNames)) {
    return inlineTypeGroups(module, inlineTypeNames).map((group) => ({
      label: group.title,
      href: `#${inlineGroupAnchor(group)}`,
    }));
  }

  return typeNames.map((name) => ({
    label: name,
    href: typeLinks[name] || `#${markdownAnchor(name)}`,
    code: true,
  }));
}

function buildGroupedInlineTypeSections(module: ModuleGroup, inlineTypeNames: string[]): InlineTypeGroupTemplateModel[] {
  return inlineTypeGroups(module, inlineTypeNames).map((group) => ({
    title: group.title,
    anchor: inlineGroupAnchor(group),
    types: group.typeNames.map((typeName) => buildTypeSection(
      typeName,
      buildTypePageModel(module, typeName, false),
      3,
      module.key,
      inlineTypeAnchor(typeName),
    )),
  }));
}

export function renderModulePage(
  module: ModuleGroup,
  outputDir: string,
  typeLinks: Record<string, string>,
  inlineTypeNames: string[] = [],
): GeneratedFile {
  const groupedInlineTypes = shouldGroupInlineTypes(module, inlineTypeNames);

  return {
    filePath: path.join(outputDir, `${module.key}.md`),
    content: renderModuleTemplate({
      name: module.key,
      doc: module.moduleDoc,
      types: buildTypesList(module, typeLinks, inlineTypeNames),
      functions: module.functions,
      inlineGroups: groupedInlineTypes ? buildGroupedInlineTypeSections(module, inlineTypeNames) : [],
      inlineTypes: groupedInlineTypes
        ? []
        : inlineTypeNames.map((typeName) => buildTypeSection(
          typeName,
          buildTypePageModel(module, typeName, false),
          2,
          module.key,
        )),
    }),
  };
}

export function renderTypePage(filePath: string, typeName: string, model: TypePageModel): GeneratedFile {
  return {
    filePath,
    content: renderTypeTemplate({
      name: typeName,
      doc: model.typeDoc,
      members: buildTypeMembers(typeName, model, undefined, 1),
      contents: [],
      sections: [],
    }),
  };
}

function buildMergedTypeSection(module: ModuleGroup, typeName: string): MergedTypeSectionTemplateModel {
  const model = buildTypePageModel(module, typeName, false);
  return {
    name: typeName,
    doc: model.typeDoc,
    typeProperties: model.typeProperties,
    properties: model.properties,
    methods: model.methods,
  };
}

export function renderMergedTypePage(filePath: string, module: ModuleGroup, rule: MergedTypeRule): GeneratedFile {
  const primaryName = rule.primaryName || rule.names[0];
  const sectionNames = rule.sectionNames || rule.names.filter((name) => name !== primaryName);
  const primary = module.types[primaryName] ? buildTypePageModel(module, primaryName, false) : null;
  const existingSectionNames = sectionNames.filter((name) => module.types[name]);

  return {
    filePath,
    content: renderTypeTemplate({
      name: rule.title,
      doc: primary?.typeDoc || null,
      members: null,
      contents: existingSectionNames.map((sectionName) => ({
        label: sectionName,
        href: `#${markdownAnchor(sectionName)}`,
      })),
      sections: existingSectionNames.map((sectionName) => buildMergedTypeSection(module, sectionName)),
    }),
  };
}
