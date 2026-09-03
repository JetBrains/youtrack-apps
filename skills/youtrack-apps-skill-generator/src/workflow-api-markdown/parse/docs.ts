import * as fs from "node:fs";
// Reads workflowApi.json and converts raw JSDoc records into module/type groups
// consumed by the renderer.
import { DEFAULT_MODULE_LONGNAME, MODULE_PREFIX } from "../config.ts";
import { isExcludedDocName, isFunctionTypeDoc, isPublicTypeDoc, relevantDocKinds } from "../engine/rules.ts";
import type { DocBlock, TypeGroup, DocItem, JsonValue, ModuleBuildContext, ModuleGroup } from "../types.ts";

export function parseKnownDocs(jsonPath: string): DocItem[] {
  const raw = fs.readFileSync(jsonPath, "utf8");
  const parsed = JSON.parse(raw) as JsonValue;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected workflowApi.json to contain an object.");
  }

  const docs = (parsed as { docs?: JsonValue }).docs;
  if (!Array.isArray(docs)) {
    throw new Error("Expected workflowApi.json to contain a docs array.");
  }

  return docs
    .filter((doc): doc is DocItem => Boolean(doc) && typeof doc === "object" && !Array.isArray(doc))
    .filter((doc) => doc.kind !== undefined && relevantDocKinds().has(doc.kind))
    .filter((doc) => !isExcludedDocName(doc.name));
}

function slug(longname: string): string {
  return longname
    .replace(/^module:/, "")
    .replace("@jetbrains/youtrack-scripting-api/", "")
    .replace(/[~#.]/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function moduleLongnameForDoc(doc: DocItem, ownerModules: Record<string, string> = {}): string {
  // Generated docs mix module-qualified owners and bare owners. ownerModules
  // maps bare names like Issue back to the module where they were declared.
  const { longname, memberof } = doc;

  if (doc.kind === "module" && longname) {
    return longname;
  }
  if (longname?.startsWith("module:")) {
    return longname.split(/[.#~]/, 1)[0];
  }
  if (memberof?.startsWith("module:")) {
    return memberof.split(/[.#~]/, 1)[0];
  }
  if (memberof && ownerModules[memberof]) {
    return ownerModules[memberof];
  }
  if (longname) {
    const parentName = longname.split(/[.#~]/, 1)[0];
    if (ownerModules[parentName]) {
      return ownerModules[parentName];
    }
  }
  return DEFAULT_MODULE_LONGNAME;
}

function moduleKey(moduleLongname: string): string {
  if (moduleLongname.startsWith(MODULE_PREFIX)) {
    return moduleLongname.slice(MODULE_PREFIX.length);
  }
  return slug(moduleLongname);
}

function cleanNamedBlocks(blocks: DocItem["params"]): DocBlock["params"] {
  return blocks?.map((block) => {
    const cleaned = { ...block };
    delete cleaned.optional;
    return cleaned;
  });
}

function cleanDoc(doc: DocItem): DocBlock {
  const cleaned: DocBlock = {
    kind: doc.kind,
    longname: doc.longname,
    name: doc.name,
    description: doc.description,
    classdesc: doc.classdesc,
    type: doc.type?.names,
    params: cleanNamedBlocks(doc.params),
    returns: cleanNamedBlocks(doc.returns),
    properties: cleanNamedBlocks(doc.properties),
    examples: doc.examples,
    augments: doc.augments,
    see: doc.see,
    since: doc.since,
    deprecated: doc.deprecated,
    readonly: doc.readonly,
  };

  return Object.fromEntries(Object.entries(cleaned).filter(([, value]) => value !== undefined)) as DocBlock;
}

function emptyModule(moduleLongname: string): ModuleGroup {
  const key = moduleKey(moduleLongname);
  return {
    key,
    longname: moduleLongname,
    moduleDoc: null,
    functions: [],
    types: {},
  };
}

function emptyType(name: string): TypeGroup {
  return {
    name,
    typeDoc: null,
    properties: [],
    methods: [],
  };
}

function entityNameFromMemberof(memberof: string | undefined): string | undefined {
  if (!memberof || memberof === DEFAULT_MODULE_LONGNAME) {
    return undefined;
  }
  if (memberof.startsWith(DEFAULT_MODULE_LONGNAME)) {
    return memberof
      .replace(`${DEFAULT_MODULE_LONGNAME}~`, "")
      .split(".", 1)[0]
      .split("#", 1)[0];
  }
  return memberof.split(".", 1)[0].split("#", 1)[0];
}

function typeNameFromMemberof(memberof: string | undefined): string | undefined {
  if (!memberof) {
    return undefined;
  }
  if (memberof.startsWith("module:") && memberof.includes("~")) {
    return memberof.split("~").pop()?.split(".", 1)[0].split("#", 1)[0];
  }
  if (memberof.startsWith("module:")) {
    return undefined;
  }
  return memberof.split(".", 1)[0].split("#", 1)[0];
}

function isTypeDoc(doc: DocItem, ownerModules: Record<string, string>): boolean {
  return isPublicTypeDoc(doc, moduleLongnameForDoc(doc, ownerModules));
}

function sortDocs(docs: DocBlock[]): DocBlock[] {
  return docs.sort((a, b) => {
    const left = `${a.name ?? ""}\u0000${a.longname ?? ""}\u0000${a.kind ?? ""}`;
    const right = `${b.name ?? ""}\u0000${b.longname ?? ""}\u0000${b.kind ?? ""}`;
    return left.localeCompare(right);
  });
}

function sortModule(module: ModuleGroup): ModuleGroup {
  module.functions = sortDocs(module.functions);

  const sortedTypes: Record<string, TypeGroup> = {};
  for (const name of Object.keys(module.types).sort()) {
    const typeGroup = module.types[name];
    typeGroup.properties = sortDocs(typeGroup.properties);
    typeGroup.methods = sortDocs(typeGroup.methods);
    sortedTypes[name] = typeGroup;
  }
  module.types = sortedTypes;

  return module;
}

function buildModuleContext(docs: DocItem[]): ModuleBuildContext {
  const ownerModules: Record<string, string> = {};

  for (const rawDoc of docs) {
    const moduleLongname = moduleLongnameForDoc(rawDoc);
    if (rawDoc.longname) {
      ownerModules[rawDoc.longname] = moduleLongname;
    }
    if (rawDoc.name && !ownerModules[rawDoc.name]) {
      ownerModules[rawDoc.name] = moduleLongname;
    }
  }

  const modules: Record<string, ModuleGroup> = {};
  for (const rawDoc of docs) {
    const longname = moduleLongnameForDoc(rawDoc, ownerModules);
    modules[moduleKey(longname)] ??= emptyModule(longname);
  }

  return { modules, ownerModules };
}

function groupTypesAndMembers(docs: DocItem[], context: ModuleBuildContext): Record<string, ModuleGroup> {
  const { modules, ownerModules } = context;

  // Create type buckets first so methods/properties can attach to them during
  // the second pass regardless of JSON order.
  for (const rawDoc of docs) {
    const module = modules[moduleKey(moduleLongnameForDoc(rawDoc, ownerModules))];
    if (isTypeDoc(rawDoc, ownerModules) && rawDoc.name) {
      module.types[rawDoc.name] ??= emptyType(rawDoc.name);
    }
  }

  // Place each supported JSDoc record into the renderer's module tree.
  for (const rawDoc of docs) {
    const module = modules[moduleKey(moduleLongnameForDoc(rawDoc, ownerModules))];
    const { kind, name, memberof } = rawDoc;
    const doc = cleanDoc(rawDoc);

    if (kind === "module") {
      module.moduleDoc = doc;
      continue;
    }

    if (isTypeDoc(rawDoc, ownerModules) && name) {
      module.types[name] ??= emptyType(name);
      module.types[name].typeDoc = doc;
      continue;
    }

    const typeName = module.key === "entities" ? entityNameFromMemberof(memberof) : typeNameFromMemberof(memberof);
    const typeGroup = typeName ? module.types[typeName] : undefined;

    if (isFunctionTypeDoc(rawDoc)) {
      module.functions.push(doc);
    } else if (kind === "function") {
      if (rawDoc.scope === "static" && memberof === module.longname) {
        module.functions.push(doc);
      } else if (typeGroup) {
        typeGroup.methods.push(doc);
      } else {
        module.functions.push(doc);
      }
    } else if (kind === "member" && typeGroup) {
      typeGroup.properties.push(doc);
    }
  }

  return Object.fromEntries(
    Object.keys(modules)
      .sort()
      .map((key) => [key, sortModule(modules[key])]),
  );
}

export function groupDocsByModule(docs: DocItem[]): Record<string, ModuleGroup> {
  const context = buildModuleContext(docs);
  return groupTypesAndMembers(docs, context);
}
