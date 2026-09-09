import * as path from "node:path";

// Links configured type names in generated prose while preserving code fences
// and existing Markdown links.
import { typeReferencePostProcessors } from "../engine/rules.ts";
import { markdownLinkPath } from "./markdown-format.ts";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function linkTypeNameInLine(line: string, typeName: string, typeLink: string): string {
  const placeholders: string[] = [];
  const storePlaceholder = (value: string): string => {
    const token = `__WORKFLOW_API_PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(value);
    return token;
  };

  let result = line.replace(/`([^`]+)`/g, (match, code) => {
    const codePattern = new RegExp("^" + escapeRegExp(typeName) + "(?:\\.<[^`]+>)?$");
    if (codePattern.test(code)) {
      return storePlaceholder(`[\`${code}\`](${typeLink})`);
    }
    return storePlaceholder(match);
  });

  result = result.replace(/!?\[[^\]]+\]\([^)]+\)/g, (match) => storePlaceholder(match));
  const prosePattern = new RegExp("(^|[^A-Za-z0-9_`])" + escapeRegExp(typeName) + "(\\.<[A-Za-z0-9_.]+>)?(?![A-Za-z0-9_`])", "g");
  result = result.replace(prosePattern, (_match, prefix, generic) => {
    const label = generic ? `${typeName}${generic}` : typeName;
    return `${prefix}[${label}](${typeLink})`;
  });

  while (/__WORKFLOW_API_PLACEHOLDER_\d+__/.test(result)) {
    result = result.replace(/__WORKFLOW_API_PLACEHOLDER_(\d+)__/g, (_match, index) => placeholders[Number(index)]);
  }
  return result;
}

export function linkConfiguredTypeReferences(content: string, filePath: string, outputDir: string): string {
  let inFence = false;
  const processors = typeReferencePostProcessors()
    .map((processor) => ({
      typeName: processor.typeName,
      targetPath: path.join(outputDir, processor.targetFile),
      link: markdownLinkPath(filePath, path.join(outputDir, processor.targetFile)),
    }))
    .filter((processor) => path.resolve(filePath) !== path.resolve(processor.targetPath));

  return content
    .split("\n")
    .map((line) => {
      if (line.startsWith("```")) {
        inFence = !inFence;
        return line;
      }
      if (inFence) {
        return line;
      }
      return processors.reduce((current, processor) => linkTypeNameInLine(current, processor.typeName, processor.link), line);
    })
    .join("\n");
}
