import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Eta } from "eta";
import { markdownCell, markdownText, markdownType } from "./markdown-format.ts";
import type { ConstructorBlock, DocBlock, MethodGroup, NamedBlock } from "../types.ts";

const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const eta = new Eta({
  autoEscape: false,
  autoTrim: false,
  views: path.join(PACKAGE_DIR, "templates"),
});

export interface MarkdownLinkModel {
  label: string;
  href: string;
  code?: boolean;
}

export interface OptionalMarkdownLinkModel {
  label: string;
  href?: string;
}

export interface ContentsMethodGroupModel {
  heading: string;
  href: string;
  methods: MarkdownLinkModel[];
}

export interface ContentsTemplateModel {
  headingLevel: number;
  constructors: MarkdownLinkModel[];
  properties: OptionalMarkdownLinkModel[];
  methodGroups: ContentsMethodGroupModel[];
  methods: MarkdownLinkModel[];
}

export interface TypeMembersTemplateModel {
  headingLevel: number;
  parentTypes: string[];
  contents: ContentsTemplateModel | null;
  examples: string[];
  constructors: ConstructorBlock[];
  typeProperties: NamedBlock[];
  properties: DocBlock[];
  methodGroups: MethodGroup[];
  methods: DocBlock[];
}

export interface TypeSectionTemplateModel {
  name: string;
  headingLevel: number;
  anchor?: string;
  doc: DocBlock | null;
  members: TypeMembersTemplateModel;
}

export interface InlineTypeGroupTemplateModel {
  title: string;
  anchor: string;
  types: TypeSectionTemplateModel[];
}

export interface MergedTypeSectionTemplateModel {
  name: string;
  doc: DocBlock | null;
  typeProperties: NamedBlock[];
  properties: DocBlock[];
  methods: DocBlock[];
}

export interface ModuleTemplateModel {
  name: string;
  doc: DocBlock | null;
  types: MarkdownLinkModel[];
  functions: DocBlock[];
  inlineGroups: InlineTypeGroupTemplateModel[];
  inlineTypes: TypeSectionTemplateModel[];
}

export interface TypeTemplateModel {
  name: string;
  doc: DocBlock | null;
  members: TypeMembersTemplateModel | null;
  contents: MarkdownLinkModel[];
  sections: MergedTypeSectionTemplateModel[];
}

export interface ApiReferenceTemplateModel {
  modules: Array<{
    key: string;
    link: string;
    importName: string;
  }>;
}

export function renderModuleTemplate(model: ModuleTemplateModel): string {
  return renderTemplate("module.md.eta", model);
}

export function renderTypeTemplate(model: TypeTemplateModel): string {
  return renderTemplate("type.md.eta", model);
}

export function renderApiReferenceTemplate(model: ApiReferenceTemplateModel): string {
  return renderTemplate("api-reference.md.eta", model);
}

function renderTemplate(template: string, model: object): string {
  return normalizeMarkdown(eta.render(template, {
    ...model,
    helpers: {
      cell: markdownCell,
      text: markdownText,
      type: markdownType,
    },
  }));
}

function normalizeMarkdown(markdown: string): string {
  return `${markdown.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}
