#!/usr/bin/env node

// CLI wrapper. API-specific behavior lives under workflow-api-markdown/.
import { DEFAULT_OUTPUT_DIR, DEFAULT_SKILL_PATH } from "./workflow-api-markdown/config.ts";
import { generateWorkflowApiMarkdown } from "./workflow-api-markdown/runner.ts";
import type { GeneratorOptions } from "./workflow-api-markdown/types.ts";

interface CliArgs {
  workflowApiPath: string;
  apiReferencePath: string;
  options: GeneratorOptions;
}

function usage(exitCode = 1): never {
  console.error("Usage: node generateWorkflowApiMarkdown.ts <path-to-workflowApi.json> [path-to-SKILL.md] [options]");
  console.error("");
  console.error("Options:");
  console.error("  --output-dir <dir>       API docs output directory.");
  console.error("  --youtrack-version <version>");
  console.error("                          Update skill metadata with this YouTrack build version and bump patch version.");
  console.error("");
  console.error(`Generates Markdown docs in ${DEFAULT_OUTPUT_DIR} and updates the API table in the final # API Reference section.`);
  process.exit(exitCode);
}

function isValidOptionValue(value: string): boolean {
  return value.length > 0 && !value.includes("\n") && !value.includes("\r");
}

function parseCliArgs(argv: string[]): CliArgs {
  if (argv[0] === "--help" || argv[0] === "-h") {
    usage(0);
  }
  const [workflowApiPath, possibleApiReferencePath, ...remaining] = argv;
  if (!workflowApiPath) {
    usage();
  }

  const hasApiReferencePath = Boolean(possibleApiReferencePath && !possibleApiReferencePath.startsWith("--"));
  const apiReferencePath = hasApiReferencePath ? possibleApiReferencePath : DEFAULT_SKILL_PATH;
  const rest = hasApiReferencePath ? remaining : [possibleApiReferencePath, ...remaining].filter(Boolean) as string[];

  // CLI defaults stay in the wrapper; generation behavior stays in config.ts.
  const options: GeneratorOptions = {
    outputDir: DEFAULT_OUTPUT_DIR,
  };

  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (!value || !isValidOptionValue(value)) {
      usage();
    }

    if (flag === "--output-dir") {
      options.outputDir = value;
    } else if (flag === "--youtrack-version") {
      options.youtrackVersion = value;
    } else {
      usage();
    }
  }

  return { workflowApiPath, apiReferencePath, options };
}

function main(): void {
  const { workflowApiPath, apiReferencePath, options } = parseCliArgs(process.argv.slice(2));
  generateWorkflowApiMarkdown(workflowApiPath, apiReferencePath, options);
}

main();
