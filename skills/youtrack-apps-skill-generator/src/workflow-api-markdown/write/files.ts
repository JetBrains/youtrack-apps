import * as fs from "node:fs";
import * as path from "node:path";
// Cleanup old generated Markdown, create directories and write final files
import { cleanupFolders, shouldInlineModuleTypes, staleRootFiles } from "../engine/rules.ts";
import { linkConfiguredTypeReferences } from "../render/reference-links.ts";
import type { GeneratedFile, ModuleGroup } from "../types.ts";

function removeMarkdownFilesUnder(dir: string): void {
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeMarkdownFilesUnder(entryPath);
      if (fs.existsSync(entryPath) && fs.readdirSync(entryPath).length === 0) {
        fs.rmdirSync(entryPath);
      }
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      fs.unlinkSync(entryPath);
    }
  }
}

function removeStaleEntityMarkdown(outputDir: string): void {
  // File routing is generated, so clear configured output folders before rewriting.
  for (const folder of cleanupFolders()) {
    removeMarkdownFilesUnder(path.join(outputDir, folder));
  }
}

function removeStaleRootEntityMarkdown(outputDir: string): void {
  // Configured root pages may replace older generated filenames.
  for (const filename of staleRootFiles()) {
    const filePath = path.join(outputDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

function removeStaleInlineModuleMarkdown(outputDir: string, modules: Record<string, ModuleGroup>): void {
  // These modules now render their types inline in the module file.
  const inlineModuleKeys = Object.entries(modules)
    .filter(([key, module]) => shouldInlineModuleTypes(key, module))
    .map(([key]) => key);
  for (const moduleKey of inlineModuleKeys) {
    const moduleDir = path.join(outputDir, moduleKey);
    removeMarkdownFilesUnder(moduleDir);
    if (fs.existsSync(moduleDir) && fs.readdirSync(moduleDir).length === 0) {
      fs.rmdirSync(moduleDir);
    }
  }
}

export function writeAllFiles(files: GeneratedFile[], outputDir: string, modules: Record<string, ModuleGroup>): void {
  fs.mkdirSync(outputDir, { recursive: true });

  const oldRootIndex = path.join(outputDir, "README.md");
  if (fs.existsSync(oldRootIndex)) {
    fs.unlinkSync(oldRootIndex);
  }
  removeStaleEntityMarkdown(outputDir);
  removeStaleRootEntityMarkdown(outputDir);
  removeStaleInlineModuleMarkdown(outputDir, modules);

  for (const file of files) {
    fs.mkdirSync(path.dirname(file.filePath), { recursive: true });
    fs.writeFileSync(file.filePath, linkConfiguredTypeReferences(file.content, file.filePath, outputDir), "utf8");
  }
}
