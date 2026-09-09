import * as path from "node:path";

// Markdown formatting primitives shared by templates and reference updaters.

export function markdownFilename(name: string): string {
  const value = name.replace(/[^A-Za-z0-9._-]/g, "-").replace(/^-+|-+$/g, "");
  return `${value || "item"}.md`;
}

export function markdownAnchor(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9 _-]/g, "")
    .replace(/\s+/g, "-");
}

export function markdownCell(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  return markdownText(String(value)).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function markdownText(value: string): string {
  // Internal JSDoc links do not resolve in final Markdown, so they become
  // readable names. External links remain clickable.
  return value.replace(/\{@link\s+([^}\s|]+)(?:\s+([^}]+)|\|([^}]+))?\}/g, (_match, target, labelWithSpace, labelWithPipe) => {
    const label = labelWithPipe || labelWithSpace;
    if (/^https?:\/\//i.test(target)) {
      return label ? `[${label}](${target})` : target;
    }

    return label || readableDocLinkName(target);
  });
}

export function readableDocLinkName(target: string): string {
  return target
    .replace(/^module:@jetbrains\/youtrack-scripting-api\//, "")
    .replace(/^module:/, "")
    .replace(/^[^~]+~/, "")
    .replace(/~/g, ".")
    .replace(/#/g, ".")
    .replace(/^\//, "");
}

export function markdownLinkPath(fromFile: string, toFile: string): string {
  const relative = path.relative(path.dirname(fromFile), toFile) || path.basename(toFile);
  return relative.split(path.sep).join("/");
}

export function markdownType(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value) && "names" in value) {
    return markdownType((value as { names?: unknown }).names);
  }
  if (Array.isArray(value)) {
    return value.map((item) => `\`${item}\``).join(", ");
  }
  if (value) {
    return `\`${value}\``;
  }
  return "";
}
