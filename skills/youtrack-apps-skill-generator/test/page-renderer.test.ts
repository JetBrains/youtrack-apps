import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { formatUpdatedApiReferenceFile } from "../src/workflow-api-markdown/render/api-reference.ts";
import { renderMergedTypePage, renderModulePage, renderTypePage } from "../src/workflow-api-markdown/render/page-renderer.ts";
import { writeAllFiles } from "../src/workflow-api-markdown/write/files.ts";
import type { ModuleGroup } from "../src/workflow-api-markdown/types.ts";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));

test("renders a module through the Eta page template", () => {
  const module: ModuleGroup = {
    key: "workflow",
    longname: "module:@jetbrains/youtrack-scripting-api/workflow",
    moduleDoc: { description: "Workflow utilities." },
    functions: [{
      kind: "function",
      name: "message",
      description: "Displays a message.",
      params: [{ name: "text", type: { names: ["string"] }, description: "Message text." }],
    }],
    types: {},
  };

  const actual = renderModulePage(module, "/generated", {}).content;
  const expected = fs.readFileSync(path.join(TEST_DIR, "golden/module.md"), "utf8");
  assert.equal(actual, expected);
});

test("renders a type through the Eta page template", () => {
  const actual = renderTypePage("/generated/Issue.md", "Issue", {
    typeDoc: { description: "An issue in YouTrack." },
    typeProperties: [{ name: "id", type: { names: ["string"] }, description: "The entity ID." }],
    properties: [],
    methods: [],
    constructors: [],
    hierarchy: ["Issue"],
  }).content;
  const expected = fs.readFileSync(path.join(TEST_DIR, "golden/type.md"), "utf8");
  assert.equal(actual, expected);
});

test("renders API member partials through Eta templates", () => {
  const actual = renderTypePage("/generated/Issue.md", "Issue", {
    typeDoc: {
      description: "An issue in YouTrack.",
      type: ["Object"],
      readonly: true,
      since: "2026.1",
      deprecated: "Use Ticket.",
      examples: ["const issue = new Issue('PRJ-1');"],
    },
    typeProperties: [{ name: "id", type: { names: ["string"] }, description: "The entity ID." }],
    properties: [{ kind: "member", name: "status", type: ["string"], description: "Current status." }],
    methods: [{
      name: "update",
      description: "Updates the issue.",
      params: [{ name: "silent", type: { names: ["boolean"] }, defaultvalue: false, description: "Suppress notifications." }],
      returns: [{ type: { names: ["Issue"] }, description: "The updated issue." }],
      properties: [{ name: "fields", type: { names: ["Object"] }, description: "Fields to update." }],
      examples: ["issue.update(false);"],
      see: ["Issue.findById"],
    }],
    constructors: [{
      name: "Issue",
      doc: {
        params: [{ name: "id", type: { names: ["string"] }, description: "Issue ID." }],
        examples: ["new Issue('PRJ-1');"],
        see: ["Issue.findById"],
      },
    }],
    hierarchy: ["BaseEntity", "Issue"],
  }).content;

  assert.match(actual, /Parent types: `BaseEntity`\./);
  assert.match(actual, /Readonly  \nSince: `2026\.1`  \nDeprecated: Use Ticket\.  /);
  assert.match(actual, /## Constructors\n\n### new Issue/);
  assert.match(actual, /## Properties[\s\S]*### status[\s\S]*Return type: `string`/);
  assert.match(actual, /## Methods[\s\S]*### update[\s\S]*#### Parameters/);
  assert.match(actual, /\| `silent = `false`` \| `boolean` \| Suppress notifications\. \|/);
  assert.match(actual, /#### Returns[\s\S]*Return type: `Issue`\./);
  assert.match(actual, /#### Object Properties/);
  assert.match(actual, /#### Examples[\s\S]*issue\.update\(false\);/);
  assert.match(actual, /#### See Also[\s\S]*- Issue\.findById/);
});

test("renders the generated SKILL.md API reference through Eta", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "youtrack-api-reference-"));
  const skillPath = path.join(tempDir, "SKILL.md");
  try {
    fs.writeFileSync(skillPath, "# Skill\n\n# API Reference\n");
    const module: ModuleGroup = {
      key: "workflow",
      longname: "module:@jetbrains/youtrack-scripting-api/workflow",
      moduleDoc: { name: "@jetbrains/youtrack-scripting-api/workflow" },
      functions: [],
      types: {},
    };

    const actual = formatUpdatedApiReferenceFile({ workflow: module }, skillPath, "/generated").content;

    assert.match(actual, /## Reading the API modules/);
    assert.match(actual, /whether the description says the value is readonly or optional/);
    assert.match(actual, /\| `workflow` \| \[\.\/references\/api\/workflow\.md\]/);
    assert.doesNotMatch(actual, /\| --- \| --- \| --- \|\n\n\|/);
    assert.doesNotMatch(actual, /properety/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("renders inline and merged type sections through Eta templates", () => {
  const module: ModuleGroup = {
    key: "custom",
    longname: "module:custom",
    moduleDoc: null,
    functions: [],
    types: {
      Primary: {
        name: "Primary",
        typeDoc: { description: "Primary type.", examples: ["usePrimary();"] },
        properties: [],
        methods: [],
      },
      Child: {
        name: "Child",
        typeDoc: { description: "Child type.", properties: [{ name: "id", type: { names: ["string"] } }] },
        properties: [],
        methods: [{ name: "run", description: "Runs the child." }],
      },
    },
  };

  const inline = renderModulePage(module, "/generated", { Child: "#child" }, ["Child"]).content;
  assert.match(inline, /## Types[\s\S]*- \[`Child`\]\(#child\)/);
  assert.match(inline, /## Child[\s\S]*Child type\.[\s\S]*### Methods/);

  const merged = renderMergedTypePage("/generated/types.md", module, {
    filename: "types.md",
    names: ["Primary", "Child"],
    title: "Combined types",
    primaryName: "Primary",
    sectionNames: ["Child"],
  }).content;
  assert.match(merged, /# Combined types[\s\S]*Primary type\./);
  assert.match(merged, /## Contents[\s\S]*- \[Child\]\(#child\)/);
  assert.match(merged, /## Child[\s\S]*### Properties[\s\S]*### Methods[\s\S]*#### run/);
});

test("overwrites generated files and preserves hand-written API pages", () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "youtrack-skill-generator-"));
  try {
    fs.mkdirSync(path.join(outputDir, "entities"));
    fs.writeFileSync(path.join(outputDir, "workflow.md"), "old\n");
    fs.writeFileSync(path.join(outputDir, "entities/obsolete.md"), "obsolete\n");
    fs.writeFileSync(path.join(outputDir, "ctx.md"), "hand-written\n");

    writeAllFiles(
      [{ filePath: path.join(outputDir, "workflow.md"), content: "new\n" }],
      outputDir,
      {},
    );

    assert.equal(fs.readFileSync(path.join(outputDir, "workflow.md"), "utf8"), "new\n");
    assert.equal(fs.existsSync(path.join(outputDir, "entities/obsolete.md")), false);
    assert.equal(fs.readFileSync(path.join(outputDir, "ctx.md"), "utf8"), "hand-written\n");
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});
