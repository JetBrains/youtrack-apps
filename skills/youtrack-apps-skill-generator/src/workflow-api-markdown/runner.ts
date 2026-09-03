// Top-level pipeline: parse JSON, group docs, render Markdown, update SKILL.md,
// and write the generated files.
import { groupDocsByModule, parseKnownDocs } from "./parse/docs.ts";
import { formatUpdatedApiReferenceFile } from "./render/api-reference.ts";
import { renderApiDocFiles } from "./render/api-doc-files.ts";
import type { GeneratedFile, GeneratorOptions } from "./types.ts";
import { writeAllFiles } from "./write/files.ts";

function nextPatchVersion(version: string): string {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Expected skill metadata.version to use x.y.z format, got: ${version}`);
  }

  const major = Number.parseInt(match[1], 10);
  const minor = Number.parseInt(match[2], 10);
  const patch = Number.parseInt(match[3], 10) + 1;
  return `${major}.${minor}.${patch}`;
}

function updateSkillMetadata(content: string, youtrackVersion: string): string {
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    throw new Error("Expected SKILL.md to start with YAML frontmatter.");
  }

  const lines = frontmatterMatch[1].split(/\r?\n/);
  const metadataIndex = lines.findIndex((line) => /^metadata:\s*$/.test(line));
  if (metadataIndex === -1) {
    throw new Error("Expected SKILL.md frontmatter to contain a metadata block.");
  }

  let metadataEnd = lines.length;
  for (let index = metadataIndex + 1; index < lines.length; index += 1) {
    if (lines[index].trim() !== "" && !/^\s/.test(lines[index])) {
      metadataEnd = index;
      break;
    }
  }

  function findMetadataKey(key: string): { index: number; indent: string; value: string } {
    for (let index = metadataIndex + 1; index < metadataEnd; index += 1) {
      const match = lines[index].match(/^(\s+)([A-Za-z][A-Za-z0-9_-]*):\s*(.*?)\s*$/);
      if (match && match[2] === key) {
        return { index, indent: match[1], value: match[3] };
      }
    }

    throw new Error(`Expected SKILL.md metadata to contain ${key}.`);
  }

  const version = findMetadataKey("version");
  const currentYouTrackVersion = findMetadataKey("YouTrackVersion");
  const skillVersion = nextPatchVersion(version.value);

  lines[version.index] = `${version.indent}version: ${skillVersion}`;
  lines[currentYouTrackVersion.index] = `${currentYouTrackVersion.indent}YouTrackVersion: ${youtrackVersion}`;

  const frontmatterStart = frontmatterMatch.index ?? 0;
  const updatedFrontmatter = lines.join(newline);
  return `${content.slice(0, frontmatterStart)}---${newline}${updatedFrontmatter}${newline}---${content.slice(frontmatterStart + frontmatterMatch[0].length)}`;
}

function updateApiReferenceMetadata(file: GeneratedFile, youtrackVersion: string | undefined): GeneratedFile {
  if (!youtrackVersion) {
    return file;
  }

  return {
    ...file,
    content: updateSkillMetadata(file.content, youtrackVersion),
  };
}

export function generateWorkflowApiMarkdown(workflowApiPath: string, apiReferencePath: string, options: GeneratorOptions): void {
  const docs = parseKnownDocs(workflowApiPath);
  const modules = groupDocsByModule(docs);

  const markdownFiles = renderApiDocFiles(modules, options.outputDir);
  const apiReferenceFile = updateApiReferenceMetadata(
    formatUpdatedApiReferenceFile(modules, apiReferencePath, options.outputDir),
    options.youtrackVersion,
  );
  writeAllFiles([...markdownFiles, apiReferenceFile], options.outputDir, modules);

  console.log(`Wrote Markdown docs for ${Object.keys(modules).length} modules to ${options.outputDir}`);
  console.log(`Updated API Reference table in ${apiReferencePath}`);
  if (options.youtrackVersion) {
    console.log(`Updated skill metadata for YouTrack ${options.youtrackVersion}`);
  }
}
