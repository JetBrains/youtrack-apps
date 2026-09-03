export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

// Shared data contracts between parser, engine, renderer, and writer. Raw JSDoc
// fields are optional because different JSDoc kinds expose different shapes.

export interface DocItem {
  kind?: string;
  longname?: string;
  name?: string;
  memberof?: string;
  scope?: string;
  description?: string;
  classdesc?: string;
  type?: { names?: string[] };
  params?: NamedBlock[];
  returns?: NamedBlock[];
  properties?: NamedBlock[];
  examples?: string[];
  augments?: string[];
  see?: string[];
  since?: string;
  deprecated?: string | boolean;
  readonly?: boolean;
  meta?: {
    filename?: string;
    lineno?: number;
    path?: string;
  };
}

export interface NamedBlock {
  name?: string;
  description?: string;
  type?: { names?: string[] };
  optional?: boolean;
  defaultvalue?: string | number | boolean;
}

export interface DocBlock {
  kind?: string;
  longname?: string;
  name?: string;
  description?: string;
  classdesc?: string;
  type?: string[];
  params?: NamedBlock[];
  returns?: NamedBlock[];
  properties?: NamedBlock[];
  examples?: string[];
  augments?: string[];
  see?: string[];
  since?: string;
  deprecated?: string | boolean;
  readonly?: boolean;
}

export interface TypeGroup {
  name: string;
  typeDoc: DocBlock | null;
  properties: DocBlock[];
  methods: DocBlock[];
}

export interface ModuleGroup {
  key: string;
  longname: string;
  moduleDoc: DocBlock | null;
  functions: DocBlock[];
  types: Record<string, TypeGroup>;
}

export interface ModuleBuildContext {
  modules: Record<string, ModuleGroup>;
  ownerModules: Record<string, string>;
}

export interface GeneratedFile {
  filePath: string;
  content: string;
}

export interface ConstructorBlock {
  name: string;
  doc: DocBlock;
}

export interface TypePageModel {
  typeDoc: DocBlock | null;
  typeProperties: NamedBlock[];
  properties: DocBlock[];
  methods: DocBlock[];
  constructors: ConstructorBlock[];
  hierarchy: string[];
}

export interface MethodGroup {
  heading: string;
  methods: DocBlock[];
}

export type ApiObjectKind =
  // Generated object kinds used by config selectors.
  | "module"
  | "function"
  | "type"
  | "constructor"
  | "method"
  | "property"
  | "object-property"
  | "callback"
  | "owned-typedef";

export interface ApiObject {
  kind: ApiObjectKind;
  module: string;
  name?: string;
  owner?: string;
  scope?: string;
  rawKind?: string;
}

export interface GeneratorOptions {
  outputDir: string;
  youtrackVersion?: string;
}
