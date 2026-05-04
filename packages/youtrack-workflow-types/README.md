# @jetbrains/youtrack-workflow-types

TypeScript type definitions for the [YouTrack workflow scripting API](https://www.jetbrains.com/help/youtrack/devportal/Workflow-Reference.html).

This package contains only `.d.ts` declarations. It has no runtime code, no runtime dependencies, and no build step.

## Installation

```bash
npm install --save-dev @jetbrains/youtrack-workflow-types
```

## Usage

Each YouTrack scripting module is exposed as a separate subpath. Import only the modules you need:

```ts
import type { Issue, Project, User } from '@jetbrains/youtrack-workflow-types/workflowTypeScriptStubs';
import type { HttpScope } from '@jetbrains/youtrack-workflow-types/apps';
import type { JSONSchema } from '@jetbrains/youtrack-workflow-types/utility-types';
```

Available subpaths: `workflowTypeScriptStubs` (for entities such as `Issue`, `Project`, or `User`), `apps`, `workflow`, `http`, `date-time`, `search`, `packages`, `utility-types`, `license`, and `ai-tools`.

There is no barrel export, meaning the package does not re-export all types from a single top-level entry point.
Submodule imports keep type resolution unambiguous and improve TypeScript performance.

## TypeScript Config Preset

A ready-made compiler options preset is available at `@jetbrains/youtrack-workflow-types/tsconfig`.
Extend it from your app's `tsconfig.json` to inherit the target, module resolution, and ambient `@jetbrains/youtrack-scripting-api/*` shim, which provides types for YouTrack runtime imports:

```jsonc
{
  "extends": "@jetbrains/youtrack-workflow-types/tsconfig"
}
```

You can override individual options, such as `outDir`, `paths`, or additional `types`, the same way you would with any other base config.

## Legacy Scripting API Paths

YouTrack workflow code uses runtime imports such as `require('@jetbrains/youtrack-scripting-api/entities')`. To make those paths resolve to these type definitions in TypeScript, opt in to the ambient shim:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "types": ["@jetbrains/youtrack-workflow-types/scripting-api"]
  }
}
```

After that:

```ts
import type { Issue } from '@jetbrains/youtrack-scripting-api/entities';
const entities = require('@jetbrains/youtrack-scripting-api/entities');
```

Both forms resolve to the type definitions shipped in this package.

## Versioning

This package mirrors the YouTrack server release. Pin the major.minor that matches the server you target:

| YouTrack server | Install |
|---|---|
| 2026.1 | `npm i -D @jetbrains/youtrack-workflow-types@~2026.1.0` |

Patch versions are reserved for type-stub corrections that do not change the underlying API.

## Enhanced DX

Apps created from the TypeScript Enhanced DX template use this package for workflow types. The related Vite plugins, upload coordinator, and runtime helpers live in [`@jetbrains/youtrack-apps-tools`](../apps-tools), which declares this package as an optional peer dependency.
