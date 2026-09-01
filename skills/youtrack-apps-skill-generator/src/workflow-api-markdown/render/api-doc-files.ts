import * as path from "node:path";

// Plans the generated API files: page renderers decide content, this module
// decides paths and links between pages.
import {
  mergedTypeRule,
  rootTypeRule,
  shouldIncludeInheritedMembers,
  shouldInlineModuleTypes,
  shouldLinkTypeFromModule,
} from "../engine/rules.ts";
import { markdownAnchor } from "./markdown-format.ts";
import { renderMergedTypePage, renderModulePage, renderTypePage, uniqueTypePageFilename } from "./page-renderer.ts";
import { buildTypePageModel, outputFolderForType } from "./type-model.ts";
import type { GeneratedFile, ModuleGroup } from "../types.ts";

interface TypeFilePlan {
  paths: Record<string, string>;
  moduleLinks: Record<string, string>;
}

function webPath(...parts: string[]): string {
  return path.join(...parts).split(path.sep).join("/");
}

function planTypeFiles(module: ModuleGroup, outputDir: string, inlineTypeModule: boolean): TypeFilePlan {
  const usedFilenames = new Set<string>();
  const paths: Record<string, string> = {};
  const moduleLinks: Record<string, string> = {};

  for (const typeName of Object.keys(module.types)) {
    if (inlineTypeModule) {
      moduleLinks[typeName] = `#${markdownAnchor(typeName)}`;
      continue;
    }

    const mergeRule = mergedTypeRule(module.key, typeName);
    if (mergeRule) {
      paths[typeName] = path.join(outputDir, mergeRule.filename);
      continue;
    }

    const rootRule = rootTypeRule(module.key, typeName);
    if (rootRule) {
      paths[typeName] = path.join(outputDir, rootRule.filename);
      usedFilenames.add(rootRule.filename);
      continue;
    }

    const folder = outputFolderForType(module, typeName);
    const filename = uniqueTypePageFilename(typeName, usedFilenames);
    if (folder) {
      paths[typeName] = path.join(outputDir, folder, filename);
      if (shouldLinkTypeFromModule(module.key, folder)) {
        moduleLinks[typeName] = webPath(folder, filename);
      }
    } else {
      paths[typeName] = path.join(outputDir, module.key, filename);
      moduleLinks[typeName] = webPath(module.key, filename);
    }
  }

  return { paths, moduleLinks };
}

function renderModuleFiles(module: ModuleGroup, outputDir: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const inlineTypeModule = shouldInlineModuleTypes(module.key, module);
  const typePlan = planTypeFiles(module, outputDir, inlineTypeModule);
  const inlineTypeNames = inlineTypeModule ? Object.keys(module.types).sort() : [];

  files.push(renderModulePage(module, outputDir, typePlan.moduleLinks, inlineTypeNames));
  if (inlineTypeModule) {
    return files;
  }

  const writtenMergedFiles = new Set<string>();
  for (const typeName of Object.keys(module.types)) {
    const mergeRule = mergedTypeRule(module.key, typeName);
    if (mergeRule) {
      if (!writtenMergedFiles.has(mergeRule.filename)) {
        files.push(renderMergedTypePage(path.join(outputDir, mergeRule.filename), module, mergeRule));
        writtenMergedFiles.add(mergeRule.filename);
      }
      continue;
    }

    const includeInherited = shouldIncludeInheritedMembers(module.key, typeName);
    files.push(renderTypePage(typePlan.paths[typeName], typeName, buildTypePageModel(module, typeName, includeInherited)));
  }

  return files;
}

export function renderApiDocFiles(modules: Record<string, ModuleGroup>, outputDir: string): GeneratedFile[] {
  return Object.values(modules).flatMap((module) => renderModuleFiles(module, outputDir));
}
