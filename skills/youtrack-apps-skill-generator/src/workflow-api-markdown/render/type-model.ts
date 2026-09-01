// Builds the inherited type model consumed by page rendering.
import { typeFolderForObject } from "../engine/rules.ts";
import { markdownText, readableDocLinkName } from "./markdown-format.ts";
import type { ConstructorBlock, DocBlock, ModuleGroup, NamedBlock, TypePageModel } from "../types.ts";

function augmentNames(doc: DocBlock | null | undefined): string[] {
  return (doc?.augments || []).map((item) => readableDocLinkName(markdownText(item)));
}

function inheritedTypeNames(module: ModuleGroup, typeName: string): string[] {
  const chain: string[] = [];
  const visited = new Set<string>();

  function visit(name: string): void {
    if (visited.has(name)) {
      return;
    }
    visited.add(name);

    const typeGroup = module.types[name];
    for (const parentName of augmentNames(typeGroup?.typeDoc)) {
      if (module.types[parentName]) {
        visit(parentName);
      } else if (!chain.includes(parentName)) {
        chain.push(parentName);
      }
    }
    chain.push(name);
  }

  visit(typeName);
  return chain;
}

function uniqueNamedBlocks(blocks: NamedBlock[]): NamedBlock[] {
  const byName = new Map<string, NamedBlock>();
  const unnamed: NamedBlock[] = [];
  for (const block of blocks) {
    if (!block.name) {
      unnamed.push(block);
      continue;
    }
    byName.set(block.name, block);
  }
  return [...unnamed, ...byName.values()];
}

function uniqueDocs(docs: DocBlock[]): DocBlock[] {
  const byName = new Map<string, DocBlock>();
  const unnamed: DocBlock[] = [];
  for (const doc of docs) {
    if (!doc.name) {
      unnamed.push(doc);
      continue;
    }
    byName.set(doc.name, doc);
  }
  return [...unnamed, ...byName.values()];
}

export function buildTypePageModel(module: ModuleGroup, typeName: string, includeInherited: boolean): TypePageModel {
  const typeNames = includeInherited ? inheritedTypeNames(module, typeName) : [typeName];
  const groups = typeNames.map((name) => module.types[name]).filter((group): group is NonNullable<typeof group> => Boolean(group));
  const ownGroup = module.types[typeName];

  return {
    typeDoc: ownGroup.typeDoc,
    typeProperties: uniqueNamedBlocks(groups.flatMap((group) => group.typeDoc?.properties || [])),
    properties: uniqueDocs(groups.flatMap((group) => group.properties)),
    methods: uniqueDocs(groups.flatMap((group) => group.methods)),
    constructors: groups
      .map((group) => ({ name: group.name, doc: group.typeDoc }))
      .filter((constructor): constructor is ConstructorBlock => Boolean(constructor.doc?.params?.length)),
    hierarchy: typeNames,
  };
}

export function outputFolderForType(module: ModuleGroup, typeName: string): string {
  const ancestors = inheritedTypeNames(module, typeName).filter((name) => name !== typeName);
  return typeFolderForObject(module.key, typeName, ancestors);
}
