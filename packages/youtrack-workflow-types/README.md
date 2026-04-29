# @jetbrains/youtrack-workflow-types

TypeScript type definitions for the [YouTrack workflow scripting API](https://www.jetbrains.com/help/youtrack/devportal/Workflow-Reference.html).

Pure `.d.ts` declarations — zero runtime dependencies, no build step.

## Install

```bash
npm install --save-dev @jetbrains/youtrack-workflow-types
```

## Use

Each YouTrack scripting module is a separate subpath. Import the modules you need:

```ts
import type { Issue, Project, User } from '@jetbrains/youtrack-workflow-types/workflowTypeScriptStubs';
import type { HttpScope } from '@jetbrains/youtrack-workflow-types/apps';
import type { JSONSchema } from '@jetbrains/youtrack-workflow-types/utility-types';
```

Available subpaths: `workflowTypeScriptStubs` (entities — `Issue`, `Project`, `User`, …), `apps`, `workflow`, `http`, `date-time`, `search`, `packages`, `utility-types`, `license`, `ai-tools`.

There is no barrel export — submodule imports keep type-resolution unambiguous and improve TypeScript performance.

## Tsconfig preset

A ready-made compiler-options preset is shipped at `@jetbrains/youtrack-workflow-types/tsconfig`. Extend it from your app's `tsconfig.json` to inherit module resolution, target, and the ambient `@jetbrains/youtrack-scripting-api/*` shim:

```jsonc
{
  "extends": "@jetbrains/youtrack-workflow-types/tsconfig"
}
```

You can override individual options (`outDir`, `paths`, additional `types`, etc.) the same way you would extend any other base config.

## Working with the legacy `@jetbrains/youtrack-scripting-api/*` paths

YouTrack workflow code at runtime uses `require('@jetbrains/youtrack-scripting-api/entities')` and similar import specifiers. To make those receive proper types in your TypeScript code, opt in to the ambient shim:

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

both resolve to the type definitions shipped here.

## Versioning

This package mirrors the YouTrack server release. Pin the major.minor that matches the server you target:

| YouTrack server | Install |
|---|---|
| 2026.1 | `npm i -D @jetbrains/youtrack-workflow-types@~2026.1.0` |

Patch versions are reserved for type-stub corrections that do not change the underlying API.

## Companion package

For the full app build experience (Vite plugins, upload coordinator, runtime helpers), use [`@jetbrains/youtrack-workflow-toolkit`](../youtrack-workflow-toolkit), which declares this package as a peer dependency.
