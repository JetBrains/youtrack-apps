import * as fs from "node:fs";
// Updates the API Reference section in SKILL.md while preserving surrounding
// hand-written skill instructions.
import { renderApiReferenceTemplate } from "./template-renderer.ts";
import type { GeneratedFile, ModuleGroup } from "../types.ts";

function moduleImportName(module: ModuleGroup): string {
  return module.moduleDoc?.name || `@jetbrains/youtrack-scripting-api/${module.key}`;
}

function skillReferencePath(filename: string): string {
  return `./references/api/${filename}`;
}

function apiReferenceTable(modules: Record<string, ModuleGroup>): string {
  return renderApiReferenceTemplate({
    modules: Object.entries(modules).map(([key, module]) => ({
      key,
      link: skillReferencePath(`${key}.md`),
      importName: moduleImportName(module),
    })),
  }).trimEnd();
}

interface MarkdownHeading {
  start: number;
  end: number;
  level: number;
  text: string;
}

function fencedCodeMarker(line: string): string | undefined {
  const match = line.match(/^\s*(`{3,}|~{3,})/);
  return match?.[1][0];
}

function markdownHeadings(markdown: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const lines = markdown.match(/[^\n]*(?:\n|$)/g) || [];
  let offset = 0;
  let fenceMarker: string | null = null;

  for (const rawLine of lines) {
    if (rawLine === "") {
      continue;
    }

    const line = rawLine.replace(/\r?\n$/, "");
    const marker = fencedCodeMarker(line);
    if (marker) {
      fenceMarker = fenceMarker === marker ? null : marker;
      offset += rawLine.length;
      continue;
    }

    if (!fenceMarker) {
      const heading = line.match(/^(#{1,6})[ \t]+(.+?)[ \t]*$/);
      if (heading) {
        headings.push({
          start: offset,
          end: offset + line.length,
          level: heading[1].length,
          text: heading[2].replace(/[ \t]+#+[ \t]*$/, "").trim(),
        });
      }
    }

    offset += rawLine.length;
  }

  return headings;
}

function nextHeadingStart(headings: MarkdownHeading[], offset: number, maxLevel: number, fallback: number): number {
  return headings.find((heading) => heading.start >= offset && heading.level <= maxLevel)?.start ?? fallback;
}

function replaceLastApiReferenceTable(markdown: string, replacement: string): string {
  // Only the final API Reference section is generated. Earlier mentions of the
  // phrase are left untouched.
  const headings = markdownHeadings(markdown);
  const matches = headings.filter((heading) => heading.level === 1 && heading.text === "API Reference");

  if (matches.length === 0) {
    return `${markdown.trimEnd()}\n\n# API Reference\n\n${replacement}\n`;
  }

  const sectionHeading = matches[matches.length - 1];
  const sectionEnd = nextHeadingStart(headings, sectionHeading.end, 1, markdown.length);
  const afterSectionStart = sectionHeading.end;
  const sectionBodyStart = afterSectionStart;
  const sectionBody = markdown.slice(sectionBodyStart, sectionEnd);
  const generatedHeading = markdownHeadings(sectionBody).find(
    (heading) => heading.level === 2 && heading.text === "Reading the API modules",
  );
  const replacementStart = generatedHeading ? sectionBodyStart + generatedHeading.start : sectionEnd;

  return `${markdown.slice(0, replacementStart).trimEnd()}\n\n${replacement}\n${markdown.slice(sectionEnd).trimStart()}`;
}

export function formatUpdatedApiReferenceFile(
  modules: Record<string, ModuleGroup>,
  apiReferencePath: string,
  _outputDir: string,
): GeneratedFile {
  const current = fs.existsSync(apiReferencePath) ? fs.readFileSync(apiReferencePath, "utf8") : "";
  const replacement = apiReferenceTable(modules);
  return {
    filePath: apiReferencePath,
    content: replaceLastApiReferenceTable(current, replacement),
  };
}
