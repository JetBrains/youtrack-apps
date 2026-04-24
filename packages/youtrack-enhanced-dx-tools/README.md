# @jetbrains/youtrack-enhanced-dx-tools

Development tools and Vite plugins for building YouTrack apps with TypeScript support.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Vite Plugins](#vite-plugins)
- [TypeScript Support](#typescript-support)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Installation

```bash
npm install @jetbrains/youtrack-enhanced-dx-tools
```

Requires Vite and TypeScript as peer dependencies:

```bash
npm install --save-dev vite typescript
```

## Quick Start

Create a new project:

```bash
npm create @jetbrains/youtrack-app
```

Select the "Enhanced DX" template. The scaffolder generates a project with Vite configuration, TypeScript setup, and sample HTTP handlers.

Configure Vite plugins in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { 
  youtrackAppSettings,
  youtrackApiGenerator, 
  youtrackRouter,
  youtrackExtensionProperties
} from '@jetbrains/youtrack-enhanced-dx-tools';

export default defineConfig({
  plugins: [
    youtrackAppSettings(),
    youtrackApiGenerator(),
    youtrackRouter(),
    youtrackExtensionProperties()
  ],
  build: {
    lib: {
      entry: [],
      formats: ['cjs']
    }
  }
});
```

## Vite Plugins

### youtrackApiGenerator()

Generates TypeScript type definitions and Zod validation schemas from HTTP handler files.

Scans `src/backend/router/` for files matching `{scope}/{path}/{METHOD}.ts` and generates:
- `src/api/api.d.ts` - TypeScript interface for the API router
- `src/api/api.zod.ts` - Zod schemas for runtime validation

```typescript
// src/backend/router/project/settings/GET.ts
/**
 * @zod-to-schema
 */
export type ProjectSettingsReq = {
  projectId: string;
};

/**
 * @zod-to-schema
 */
export type ProjectSettingsRes = {
  projectId: string;
  projectName: string;
};

export default function handle(ctx: CtxGet<ProjectSettingsRes, ProjectSettingsReq>): void {
  ctx.response.json({
    projectId: ctx.request.query.projectId,
    projectName: ctx.project.name
  });
}

export type Handle = typeof handle;
```

**Type Requirements:**
- Types ending with `Req` or `Res` are exported to the API client
- The `@zod-to-schema` comment generates validation schemas

### youtrackRouter()

Builds HTTP handler bundles from route files.

Processes route files from `src/backend/router/` and generates scope-specific bundles:
- `dist/global.js` - Global scope handlers
- `dist/project.js` - Project scope handlers  
- `dist/issue.js` - Issue scope handlers

**Scope definitions:**
- `global` - No entity context
- `project` - Requires `projectId`
- `issue` - Requires `issueId`

Supported methods: `GET`, `POST`, `PUT`, `DELETE`

### youtrackAutoUpload(options)

Coordinates build completion tracking for automatic upload.

**Options:**
```typescript
{
  enabled: boolean;                    // Enable auto-upload (default: false)
  buildName: 'frontend' | 'backend';   // Build identifier
  stateFile: string;                   // State file path (default: '.build-state.json')
}
```

Writes the build state to a JSON file. The upload coordinator monitors that file and triggers an upload when both builds complete.

```bash
youtrack-upload-coordinator --watch .build-state.json
```

### youtrackAppSettings()

Generates TypeScript type definitions from JSON Schema app settings.

Reads `src/settings.json` and generates `src/api/app.d.ts`:

```typescript
// Generated from settings.json
declare global {
  type AppSettings = {
    apiKey: string;
    webhookUrl?: string;
  };
}
```

Supports: primitive types, objects, arrays, enums, required/optional properties, YouTrack entity references.

### youtrackExtensionProperties()

Generates TypeScript type definitions for entity extension properties.

Reads `src/entity-extensions.json` and generates `src/api/extended-entities.d.ts`:

```json
{
  "entityTypeExtensions": [
    {
      "entityType": "Issue",
      "properties": {
        "syncStatus": { "type": "string" }
      }
    }
  ]
}
```

Extension properties are automatically available in handlers:

```typescript
ctx.issue.syncStatus  // Type-safe access
```

### youtrackDevHtml(options)

Transforms widget HTML to load from a local dev server for hot module replacement.

**Options:**
```typescript
{
  enabled: boolean;        // Enable dev mode (default: false)
  devServerUrl: string;    // Dev server URL (default: 'http://localhost')
  devServerPort: number;   // Dev server port (default: 9000)
}
```

```typescript
youtrackDevHtml({ 
  enabled: process.env.DEV_MODE === 'true',
  devServerPort: 9000
})
```

### backendReloadPlugin()

Monitors backend changes and triggers reload in Vite dev server.

**Options:**
```typescript
{
  markerFile: string;  // Marker file path (default: '.backend-changed')
}
```

Watches for the marker file created by the upload coordinator. When detected, it sends a full-reload event to clients.

## TypeScript Support

### Context Types

Type-safe context types for HTTP handlers:

```typescript
type CtxGet<R, Q?, S?>              // GET requests
type CtxPost<Body, R, Q?, S?>       // POST requests
type CtxPut<Body, R, Q?, S?>        // PUT requests
type CtxDelete<R, Q?, S?>           // DELETE requests
```

**Parameters:**
- `Body` - Request body type (POST/PUT)
- `R` - Response type
- `Q` - Query parameters (optional)
- `S` - Scope: `"issue" | "project" | "article" | "user" | "global"` (optional)

**Context properties:**

```typescript
ctx.currentUser    // User making the request
ctx.settings       // App settings
ctx.request        // HTTP request (method, path, body, query, headers)
ctx.response       // HTTP response (json(), text(), addHeader(), code)

// Scope-specific
ctx.issue          // Available in issue scope
ctx.project        // Available in project scope
ctx.article        // Available in article scope
ctx.user           // Available in user scope
ctx.globalStorage  // Available in global scope
```

**Scope-aware types:**

```typescript
// Issue scope - ctx.issue is available
export default function handle(ctx: CtxGet<Response, Query, "issue">) {
  const issueId = ctx.issue.id;
  ctx.response.json({ issueId });
}

// Global scope - no entity context
export default function handle(ctx: CtxGet<Response>) {
  ctx.response.json({ status: 'ok' });
}
```

### YouTrack Workflow API Types

Official YouTrack workflow API type definitions.

```typescript
// Import entire API
import type * as YouTrack from '@jetbrains/youtrack-enhanced-dx-tools/youtrack-workflow-api';

// Import specific entities
import type { Issue, Project, User } from '@jetbrains/youtrack-enhanced-dx-tools/youtrack-workflow-api';
```

**Available modules:** `apps`, `workflow`, `http`, `date-time`, `search`, `packages`, `utility-types`, `license`, `ai-tools`

## Usage Examples

### File-Based Routing

Route files under `src/backend/router/` map to HTTP endpoints:

```
src/backend/router/
├── global/{path}/{METHOD}.ts      → /extensionEndpoints/{appId}/{path}
├── project/{path}/{METHOD}.ts     → /admin/projects/{projectId}/extensionEndpoints/{appId}/{path}
└── issue/{path}/{METHOD}.ts       → /issues/{issueId}/extensionEndpoints/{appId}/{path}
```

### HTTP Handler

```typescript
// src/backend/router/project/settings/GET.ts
export type SettingsReq = {
  projectId: string;
};

export type SettingsRes = {
  projectName: string;
};

export default function handle(ctx: CtxGet<SettingsRes, SettingsReq>): void {
  ctx.response.json({
    projectName: ctx.project.name
  });
}

export type Handle = typeof handle;
```

### API Client

```typescript
import { createApi } from '../api';
import type { ApiRouter } from '../api/api';

const api = createApi<ApiRouter>(host);

const settings = await api.project.settings.GET({ projectId: 'ABC' });
```

### Plugin Configuration

```typescript
// vite.config.backend.ts
youtrackAutoUpload({
  enabled: process.env.AUTOUPLOAD === 'true',
  buildName: 'backend'
})

// vite.config.ts
youtrackDevHtml({ 
  enabled: process.env.DEV_MODE === 'true',
  devServerPort: 9000
})

backendReloadPlugin({
  markerFile: '.backend-changed'
})
```

## Troubleshooting

### Environment variables

Create `.env` in the project root:
```
YOUTRACK_HOST=https://your-youtrack.url
YOUTRACK_TOKEN=perm:your-permanent-token
```

Get a token: YouTrack → Profile → Account Security → New token.

### Upload failures

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Invalid or missing token | Check `YOUTRACK_TOKEN` in `.env` |
| ECONNREFUSED / ENOTFOUND | YouTrack unreachable | Verify `YOUTRACK_HOST`, ensure YouTrack is running |
| 404 Not found | Wrong URL or app path | Check `YOUTRACK_HOST` format (include `https://`) |
| ENOENT .env | No `.env` file | Create `.env` with `YOUTRACK_HOST` and `YOUTRACK_TOKEN` |

### Build and types

**`Cannot find module './api/api'`**

Run backend build to generate types:
```bash
npm run build:backend
```

**Types do not match backend changes**

Clean and rebuild:
```bash
npm run clean
npm run build:backend
```

### Missing dependencies

**ESLint auto-fix skipped**

If you see "ESLint auto-fix skipped" during build:
```bash
npm install -D eslint
```

**ts-to-zod failed / Cannot find ts-to-zod**

Zod schema generation requires ts-to-zod:
```bash
npm install -D ts-to-zod
```

### Port conflicts

**Dev server port 9000 already in use**

The Vite dev server uses port 9000 by default. Either stop the other process or change the port in `vite.config.ts`:
```typescript
server: { port: 9001 }  // or another free port
```

### Other

**App validation failed**

Run validation to see errors:
```bash
npx youtrack-app validate dist
```

Common issues: missing `manifest.json`, invalid widget configuration, missing icon files.

**Route files not detected on Windows**

Verify file structure matches conventions:
- Files named exactly `GET.ts`, `POST.ts`, `PUT.ts`, or `DELETE.ts`
- Files under `src/backend/router/`

## License

Apache-2.0

## Repository

https://github.com/JetBrains/youtrack-apps
