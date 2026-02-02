# @jetbrains/youtrack-enhanced-dx-tools

Development tools and Vite plugins for building YouTrack apps with TypeScript support.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Vite Plugins](#vite-plugins)
  - [youtrackApiGenerator()](#youtrackapigenerator)
  - [youtrackRouter()](#youtrackrouter)
  - [youtrackAutoUpload(options)](#youtrackautouploadoptions)
  - [youtrackAppSettings()](#youtrackappsettings)
  - [youtrackExtensionProperties()](#youtrackextensionproperties)
  - [youtrackDevHtml(options)](#youtrackdevhtmloptions)
  - [backendReloadPlugin()](#backendreloadplugin)
- [TypeScript Integration](#typescript-integration)
  - [Context Types](#context-types)
  - [Scope-Aware Types](#scope-aware-types)
  - [RPC Type Extraction](#rpc-type-extraction)
  - [YouTrack Workflow API Types](#youtrack-workflow-api-types)
- [Development Workflows](#development-workflows)
  - [File-Based Routing](#file-based-routing)
  - [Watch Mode with Auto-Upload](#watch-mode-with-auto-upload)
  - [Hot Reload Setup](#hot-reload-setup)
  - [Environment Variables](#environment-variables)
- [HTTP Handler Development](#http-handler-development)
  - [Handler Function Structure](#handler-function-structure)
  - [Context Object Properties](#context-object-properties)
  - [Logging](#logging)
  - [Request/Response Handling](#requestresponse-handling)
- [API Client](#api-client)
  - [Generated Type-Safe Client](#generated-type-safe-client)
  - [Zod Validation Integration](#zod-validation-integration)
  - [Request/Response Patterns](#requestresponse-patterns)
- [Build and Deployment](#build-and-deployment)
  - [Backend Compilation](#backend-compilation)
  - [Frontend Bundling](#frontend-bundling)
  - [App Validation](#app-validation)
- [Configuration Reference](#configuration-reference)
  - [Vite Configuration Patterns](#vite-configuration-patterns)
  - [Plugin Options](#plugin-options)
  - [Environment Variables](#environment-variables-1)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Path Separator Problems (Windows)](#path-separator-problems-windows)
  - [Type Generation Issues](#type-generation-issues)
  - [Upload Failures](#upload-failures)
- [License](#license)
- [Repository](#repository)

## Overview

The library provides Vite plugins, TypeScript type definitions, and utilities for YouTrack app development. The tools enable type-safe HTTP handler development, automatic API client generation, file-based routing, and integration with YouTrack's workflow scripting API.

### Core Capabilities

- **Vite Plugins** - Seven plugins for build automation, type generation, and development workflows
- **TypeScript Integration** - Comprehensive type definitions for YouTrack entities and HTTP handler contexts
- **Workflow API Types** - Official YouTrack workflow scripting API type definitions (63 entity classes)
- **Development Tools** - Hot module replacement, auto-upload coordination, and build monitoring

### Prerequisites

- Node.js >= 18.20.4
- Vite >= 6.0.1
- TypeScript >= 5.7.2
- YouTrack instance with app installation permissions

## Installation

```bash
npm install @jetbrains/youtrack-enhanced-dx-tools
```

### Peer Dependencies

The library requires Vite as a peer dependency:

```bash
npm install --save-dev vite typescript
```

## Quick Start

### Project Scaffolding

Generate a new YouTrack app project using the scaffolder:

```bash
npm create @jetbrains/youtrack-app
```

Select the "Enhanced DX" template when prompted. The scaffolder generates a complete project structure with Vite configuration, TypeScript setup, and example HTTP handlers.

For scaffolder documentation, see [@jetbrains/create-youtrack-app](../create-youtrack-app/README.md).

### Basic Configuration

Configure Vite plugins in `vite.config.ts` for backend builds:

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

**Behavior:**

The plugin scans `src/backend/router/` for route files matching the pattern `{scope}/{path}/{METHOD}.ts`, extracts type definitions annotated with `@zod-to-schema`, and generates:

- `src/api/api.d.ts` - TypeScript interface for the API router
- `src/api/api.zod.ts` - Zod schemas for runtime validation

**File-Based Routing Convention:**

```
src/backend/router/
├── global/
│   └── health/
│       └── GET.ts
├── project/
│   └── settings/
│       ├── GET.ts
│       └── POST.ts
└── issue/
    └── status/
        └── PUT.ts
```

**Handler File Structure:**

```typescript
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
  settings: AppSettings;
};

export default function handle(ctx: CtxGet<ProjectSettingsRes, ProjectSettingsReq>): void {
  const { projectId } = ctx.request.query;
  
  ctx.response.json({
    projectId,
    projectName: ctx.project.name,
    settings: ctx.settings
  });
}

export type Handle = typeof handle;
```

**Generated API Interface:**

```typescript
// src/api/api.d.ts
export type ApiRouter = {
  project: {
    settings: {
      GET: (query?: Partial<ProjectSettingsReq>) => Promise<ProjectSettingsRes>;
      POST: (body: ProjectSettingsReq) => Promise<ProjectSettingsRes>;
    };
  };
  global: {
    health: {
      GET: () => Promise<HealthCheckRes>;
    };
  };
};
```

**Type Annotation Requirements:**

- Only types ending with `Req` or `Res` are exported to the API client
- The `@zod-to-schema` comment must precede type definitions for validation schema generation
- Types without the annotation are excluded from runtime validation

**Configuration:**

The plugin operates without configuration. It uses convention-based discovery of route files.

### youtrackRouter()

Builds HTTP handler bundles from route files using file-based routing conventions.

**Behavior:**

The plugin processes route files from `src/backend/router/`, compiles them to CommonJS format, and generates scope-specific handler bundles:

- `dist/global.js` - Handlers for global scope
- `dist/project.js` - Handlers for project scope  
- `dist/issue.js` - Handlers for issue scope

**Scope Definitions:**

- **global** - HTTP handlers without entity context (no `projectId` or `issueId` required)
- **project** - HTTP handlers with project context (requires `projectId` in request)
- **issue** - HTTP handlers with issue context (requires `issueId` in request)

**HTTP Method Support:**

Supported methods: `GET`, `POST`, `PUT`, `DELETE`

**Handler Bundle Structure:**

```javascript
// dist/project.js
exports.httpHandler = {
  endpoints: [
    {
      method: "GET",
      path: "settings",
      scope: "project",
      handle: function(ctx) { /* compiled handler */ }
    }
  ],
  requirements: { /* from requirements.ts */ }
};
```

**Configuration:**

The plugin operates without configuration. It automatically discovers route files and generates appropriate bundles.

### youtrackAutoUpload(options)

Coordinates build completion tracking for automatic upload to YouTrack.

**Options:**

```typescript
interface AutoUploadOptions {
  enabled?: boolean;           // Enable auto-upload (default: false)
  buildName?: 'frontend' | 'backend';  // Build identifier (default: 'backend')
  stateFile?: string;          // State file path (default: '.build-state.json')
}
```

**Behavior:**

The plugin writes build completion state to a JSON file. The upload coordinator CLI tool monitors this file and triggers upload when both frontend and backend builds complete.

**Build State File Format:**

```json
{
  "backend": {
    "timestamp": 1234567890,
    "hash": "abc123..."
  },
  "frontend": {
    "timestamp": 1234567891,
    "hash": "def456..."
  }
}
```

**Usage in Vite Configuration:**

```typescript
// vite.config.ts (frontend)
export default defineConfig({
  plugins: [
    youtrackAutoUpload({ 
      enabled: process.env.AUTOUPLOAD === 'true', 
      buildName: 'frontend' 
    })
  ]
});

// vite.config.backend.ts
export default defineConfig({
  plugins: [
    youtrackAutoUpload({
      enabled: process.env.AUTOUPLOAD === 'true',
      buildName: 'backend'
    })
  ]
});
```

**Upload Coordinator:**

The library provides a CLI tool for monitoring build state and triggering uploads:

```bash
youtrack-upload-coordinator --watch .build-state.json
```

### youtrackAppSettings()

Generates TypeScript type definitions from JSON Schema app settings and entity extension properties.

**Behavior:**

The plugin reads configuration files and generates `src/api/app.d.ts` with global type declarations:

- `src/settings.json` - JSON Schema for app settings
- `entity-extensions.json` - Entity extension property definitions

**Generated Types:**

```typescript
// src/api/app.d.ts
declare global {
  type AppSettings = {
    apiKey: string;
    webhookUrl?: string;
    maxRetries?: number;
  };
}
```

**JSON Schema Support:**

- Primitive types: `string`, `number`, `integer`, `boolean`
- Objects with typed properties
- Arrays with typed items
- Enums (converted to TypeScript union types)
- Required vs optional properties
- YouTrack entity references (`x-entity` extension)

**Extension Property Types:**

- `string` → `string`
- `integer`, `float` → `number`
- `boolean` → `boolean`
- `multi: true` → `Set<T>`
- YouTrack entity types → proper workflow API types

**Configuration:**

The plugin operates without configuration. It discovers `settings.json` and `entity-extensions.json` automatically.

### youtrackExtensionProperties()

Generates TypeScript type definitions for custom entity extension properties.

**Behavior:**

The plugin reads `entity-extensions.json` and generates `src/api/extended-entities.d.ts` with type augmentations for YouTrack entities.

**Extension Configuration Format:**

```json
{
  "entityTypeExtensions": [
    {
      "entityType": "Issue",
      "properties": {
        "syncStatus": { "type": "string" },
        "lastSyncTime": { "type": "integer" }
      }
    }
  ]
}
```

**Generated Types:**

```typescript
// src/api/extended-entities.d.ts
declare global {
  interface ExtendedProperties {
    Issue: {
      syncStatus: string;
      lastSyncTime: number;
    };
  }
}
```

**Integration with Context Types:**

Extension properties are automatically available in HTTP handler contexts:

```typescript
export default function handle(ctx: CtxGet<Response>) {
  const syncStatus = ctx.issue.syncStatus;  // Type-safe access
  const lastSync = ctx.issue.lastSyncTime;
}
```

**Configuration:**

The plugin operates without configuration. It discovers `entity-extensions.json` automatically.

### youtrackDevHtml(options)

Transforms widget HTML files to load scripts from a local development server for hot module replacement.

**Options:**

```typescript
interface DevHtmlOptions {
  enabled?: boolean;        // Enable dev mode (default: false)
  devServerUrl?: string;    // Dev server URL (default: 'http://localhost')
  devServerPort?: number;   // Dev server port (default: 9000)
}
```

**Behavior:**

When enabled, the plugin modifies widget HTML files during build to reference the Vite development server instead of bundled assets:

```html
<!-- Production -->
<script type="module" src="../../widgets/assets/index-abc123.js"></script>

<!-- Development (transformed) -->
<script type="module" src="http://localhost:9000/@vite/client"></script>
<script type="module" src="http://localhost:9000/widgets/my-widget/index.tsx"></script>
```

**Usage:**

```typescript
export default defineConfig({
  plugins: [
    youtrackDevHtml({ 
      enabled: process.env.DEV_MODE === 'true',
      devServerPort: 9000
    })
  ]
});
```

**Development Workflow:**

1. Build and upload the app with `DEV_MODE=true`
2. Start the Vite development server (`npm run dev`)
3. Edit frontend files - changes hot reload in YouTrack

**Limitations:**

- Frontend-only hot reload (backend changes require re-upload)
- Requires Vite development server running
- Only active during development builds

### backendReloadPlugin()

Monitors backend changes and triggers full page reload in the Vite development server.

**Options:**

```typescript
interface BackendReloadOptions {
  markerFile?: string;  // Marker file path (default: '.backend-changed')
}
```

**Behavior:**

The plugin watches for a marker file created by the upload coordinator. When detected, it invalidates module cache and sends a full-reload event to connected clients.

**Usage:**

```typescript
export default defineConfig({
  plugins: [
    backendReloadPlugin()
  ],
  server: {
    port: 9000
  }
});
```

**Integration:**

The plugin integrates with `youtrackAutoUpload` and the upload coordinator for backend change detection during development.

**Configuration:**

```typescript
backendReloadPlugin({
  markerFile: '.backend-changed'
})
```

## TypeScript Integration

### Context Types

The library provides type-safe context types for HTTP handlers based on HTTP method and scope.

**Base Context Types:**

```typescript
type CtxGet<R, Q?, TScope?>     // GET requests
type CtxPost<Body, R, Q?, TScope?>   // POST requests
type CtxPut<Body, R, Q?, TScope?>    // PUT requests
type CtxDelete<R, Q?, TScope?>  // DELETE requests
```

**Type Parameters:**

- `Body` - Request body type (POST/PUT only)
- `R` - Response type
- `Q` - Query parameters type (optional)
- `TScope` - Scope context type (optional, defaults to `GlobalCtx`)

**Context Properties:**

```typescript
type BaseCtx = {
  currentUser: User;
  settings: AppSettings;
  globalStorage?: {
    extensionProperties?: AppGlobalStorageExtensionProperties;
  };
  request: HttpRequest<Body, Query>;
  response: HttpResponse;
};
```

### Scope-Aware Types

Context types vary based on endpoint scope, determining which entity properties are available.

**Scope Context Types:**

```typescript
type GlobalCtx = BaseCtx;
type IssueCtx = BaseCtx & { issue: Issue };
type ProjectCtx = BaseCtx & { project: Project };
type ArticleCtx = BaseCtx & { article: Article };
type UserCtx = BaseCtx & { user: User };
```

**Scope-Specific Type Aliases:**

```typescript
// Issue scope
type CtxGetIssue<R, Q?> = CtxGet<R, Q, IssueCtx>;
type CtxPostIssue<Body, R, Q?> = CtxPost<Body, R, Q, IssueCtx>;

// Project scope
type CtxGetProject<R, Q?> = CtxGet<R, Q, ProjectCtx>;
type CtxPostProject<Body, R, Q?> = CtxPost<Body, R, Q, ProjectCtx>;

// Article scope
type CtxGetArticle<R, Q?> = CtxGet<R, Q, ArticleCtx>;
type CtxPostArticle<Body, R, Q?> = CtxPost<Body, R, Q, ArticleCtx>;

// User scope
type CtxGetUser<R, Q?> = CtxGet<R, Q, UserCtx>;
type CtxPostUser<Body, R, Q?> = CtxPost<Body, R, Q, UserCtx>;
```

**Usage Example:**

```typescript
// Global scope - no entity context
export default function handle(ctx: CtxGet<HealthResponse>) {
  ctx.response.json({ status: 'ok' });
}

// Project scope - project entity available
export default function handle(ctx: CtxGetProject<ProjectResponse>) {
  const projectName = ctx.project.name;  // Type-safe
  ctx.response.json({ projectName });
}

// Issue scope - issue entity available
export default function handle(ctx: CtxPostIssue<UpdateBody, UpdateResponse>) {
  const issueId = ctx.issue.id;  // Type-safe
  ctx.response.json({ issueId });
}
```

### RPC Type Extraction

The `ExtractRPCFromHandler` utility type extracts API client method signatures from handler function types.

**Type Definition:**

```typescript
type ExtractRPCFromHandler<T> =
  T extends (ctx: infer Ctx) => void
    ? Ctx extends AllCtxPost | AllCtxPut
      ? Ctx extends CtxPost<infer Body, infer Res, infer Query, any> | CtxPut<infer Body, infer Res, infer Query, any>
        ? (body: Body, query?: Partial<Query>) => Promise<Res>
        : never
      : Ctx extends AllCtxGet | AllCtxDelete
        ? Ctx extends CtxGet<infer Res, infer Query, any> | CtxDelete<infer Res, infer Query, any>
          ? (query?: Partial<Query>) => Promise<Res>
          : never
        : never
    : never;
```

**Behavior:**

- Extracts request body, response, and query parameter types
- Converts handler signatures to async API client methods
- Supports all HTTP methods and scope types

**Generated API Client:**

```typescript
// Handler definition
export type Handle = (ctx: CtxPost<CreateReq, CreateRes, CreateQuery>) => void;

// Extracted RPC signature
type RPC = (body: CreateReq, query?: Partial<CreateQuery>) => Promise<CreateRes>;
```

### YouTrack Workflow API Types

The library includes official YouTrack workflow scripting API type definitions.

**Import Patterns:**

```typescript
// Import entire API
import type * as YouTrack from '@jetbrains/youtrack-enhanced-dx-tools/youtrack-workflow-api';

// Import specific entities
import type { Issue, Project, User } from '@jetbrains/youtrack-enhanced-dx-tools/youtrack-workflow-api';

// Import specific modules
import type { AppTypeRegistry } from '@jetbrains/youtrack-enhanced-dx-tools/youtrack-workflow-api/apps';
import type { Period } from '@jetbrains/youtrack-enhanced-dx-tools/youtrack-workflow-api/date-time';
```

**Available Modules:**

- `apps` - App type registry, HTTP handlers
- `workflow` - Workflow entities and utilities
- `http` - HTTP utilities
- `date-time` - Date and time utilities
- `search` - Search utilities
- `packages` - Package management
- `utility-types` - Common utility types
- `license` - License utilities
- `ai-tools` - AI integration utilities

**Entity Classes:**

The workflow API provides 63 entity classes including:

- `Issue`, `Project`, `User`, `Article`
- `IssueComment`, `IssueWorkItem`, `IssueAttachment`
- `Field`, `CustomField`, `ProjectCustomField`
- `State`, `Priority`, `Type`, `Resolution`
- `IssueLinkPrototype`, `IssueTag`
- `Build`, `VcsChange`, `PullRequest`
- And 48 additional entity classes

**Issue Links:**

Issue links are accessed via the `Issue.links` property:

```typescript
type Issue = {
  links: {
    'relates to': Set<Issue>;
    'depends on': Set<Issue>;
    'is required for': Set<Issue>;
    'duplicates': Set<Issue>;
    'is duplicated by': Set<Issue>;
    'subtask of': Set<Issue>;
    'parent for': Set<Issue>;
    [key: string]: Set<Issue>;
  };
};
```

## Development Workflows

### File-Based Routing

HTTP handlers follow a convention-based file structure under `src/backend/router/`.

**Directory Structure:**

```
src/backend/router/
├── global/           # Global scope handlers
│   └── {path}/
│       └── {METHOD}.ts
├── project/          # Project scope handlers
│   └── {path}/
│       └── {METHOD}.ts
└── issue/            # Issue scope handlers
    └── {path}/
        └── {METHOD}.ts
```

**Path Mapping:**

```
File: src/backend/router/project/settings/GET.ts
API: /admin/projects/{projectId}/extensionEndpoints/{appId}/settings
Method: GET
```

**Nested Paths:**

```
File: src/backend/router/global/api/v1/health/GET.ts
API: /extensionEndpoints/{appId}/api/v1/health
Method: GET
```

### Watch Mode with Auto-Upload

The library supports automatic upload during development when file changes are detected.

**Setup:**

Create `.env` file in project root:

```bash
YOUTRACK_HOST=https://your-youtrack.url
YOUTRACK_TOKEN=perm:your-permanent-token
```

**Watch Command:**

```bash
npm run watch
```

**Build Scenarios:**

1. **Frontend-only changes** - Frontend rebuilds, single upload
2. **Backend-only changes** - Backend rebuilds, single upload
3. **Backend type changes** - Backend builds first (generates types), frontend builds second, single upload

**Package.json Scripts:**

```json
{
  "scripts": {
    "prepare:watch": "npm run clean && vite -c vite.config.backend.ts build --mode development",
    "watch:backend": "vite -c vite.config.backend.ts build --watch --mode development",
    "watch:frontend": "vite build --watch",
    "watch:coordinator": "youtrack-upload-coordinator --watch .build-state.json",
    "watch": "npm run prepare:watch && rm -f .build-state.json && (AUTOUPLOAD=true npm run watch:backend & AUTOUPLOAD=true npm run watch:frontend & npm run watch:coordinator)"
  }
}
```

### Hot Reload Setup

Hot module replacement provides instant frontend updates without rebuilding or uploading.

**One-Time Setup:**

```bash
# Build and upload dev-mode bundle
npm run dev:build
npm run upload-local
```

**Development:**

```bash
# Start Vite dev server
npm run dev
```

**Mechanism:**

1. Uploaded HTML contains script tags pointing to `http://localhost:9000`
2. Vite dev server serves source code with HMR enabled
3. Frontend changes hot reload instantly
4. Backend changes require re-upload

**Requirements:**

- Vite dev server running on configured port
- YouTrack instance accessible from development machine
- Browser allows scripts from localhost

### Environment Variables

**Build Configuration:**

- `AUTOUPLOAD` - Enable automatic upload (`'true'` to enable)
- `DEV_MODE` - Enable development mode with hot reload (`'true'` to enable)

**Upload Configuration:**

- `YOUTRACK_HOST` - YouTrack instance URL
- `YOUTRACK_TOKEN` - Permanent token for authentication

**Usage:**

```bash
# Watch mode with auto-upload
AUTOUPLOAD=true npm run watch

# Development mode with hot reload
DEV_MODE=true npm run dev:build
```

## HTTP Handler Development

### Handler Function Structure

HTTP handlers are default-exported functions that receive a context object and return void.

**Function Signature:**

```typescript
export default function handle(ctx: CtxGet<ResponseType, QueryType>): void {
  // Handler implementation
}

export type Handle = typeof handle;
```

**Type Export Requirement:**

The `Handle` type export is required for API type generation. The `youtrackApiGenerator` plugin uses this type to extract the RPC signature.

### Context Object Properties

The context object provides access to request data, response methods, YouTrack entities, and logging.

**Request Properties:**

```typescript
ctx.request.method        // HTTP method: 'GET' | 'POST' | 'PUT' | 'DELETE'
ctx.request.path          // Relative path to endpoint
ctx.request.fullPath      // Full path to endpoint
ctx.request.body          // Request body as string
ctx.request.json()        // Request body as typed object
ctx.request.query         // Typed query parameters
ctx.request.getParameter(name)   // Get single query parameter
ctx.request.getParameters(name)  // Get all query parameters by name
ctx.request.headers       // Request headers array
```

**Response Methods:**

```typescript
ctx.response.json(object)        // Send JSON response
ctx.response.text(string)        // Send text response
ctx.response.addHeader(name, value)  // Add HTTP header
ctx.response.code = 200          // Set HTTP status code
```

**Entity Access (Scope-Dependent):**

```typescript
ctx.currentUser    // Always available: User making the request
ctx.settings       // Always available: App settings
ctx.globalStorage  // Always available: Global storage with extension properties

// Scope-specific entities
ctx.issue          // Available in issue scope
ctx.project        // Available in project scope
ctx.article        // Available in article scope
ctx.user           // Available in user scope
```

### Logging

HTTP handlers use standard `console` methods for logging.

**Usage Example:**

```typescript
export default function handle(ctx: CtxGet<Response>) {
  console.log('Processing request', ctx.request.path);
  
  try {
    const data = processData();
    console.log('Data processed, records:', data.length);
    ctx.response.json(data);
  } catch (error) {
    console.error('Processing failed', error);
    ctx.response.code = 500;
    ctx.response.json({ error: 'Internal server error' });
  }
}
```

**Log Viewing:**

Logs appear in YouTrack's workflow editor when testing HTTP handlers:

1. Navigate to YouTrack → Administration → Workflows
2. Locate the app's workflow
3. Click "Edit" to open the workflow editor
4. View logs in the console panel

**Best Practices:**

- Use `console.log()`, `console.warn()`, `console.error()` for logging
- Include contextual information in log messages
- Avoid logging sensitive information (tokens, passwords, personal data)

### Request/Response Handling

**GET Request Example:**

```typescript
export type HealthCheckRes = {
  status: 'ok' | 'error';
  timestamp: string;
};

export default function handle(ctx: CtxGet<HealthCheckRes>): void {
  ctx.response.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}

export type Handle = typeof handle;
```

**POST Request Example:**

```typescript
export type CreateItemReq = {
  name: string;
  description?: string;
};

export type CreateItemRes = {
  id: string;
  name: string;
  createdAt: string;
};

export default function handle(ctx: CtxPost<CreateItemReq, CreateItemRes>): void {
  const body = ctx.request.json();
  
  console.log('Creating item:', body.name);
  
  const item = {
    id: generateId(),
    name: body.name,
    createdAt: new Date().toISOString()
  };
  
  ctx.response.json(item);
}

export type Handle = typeof handle;
```

**Query Parameters Example:**

```typescript
export type SearchReq = {
  query: string;
  limit?: number;
};

export type SearchRes = {
  results: Array<{ id: string; title: string }>;
  total: number;
};

export default function handle(ctx: CtxGet<SearchRes, SearchReq>): void {
  const query = ctx.request.query.query;
  const limit = ctx.request.query.limit ?? 10;
  
  console.log('Search request - query:', query, 'limit:', limit);
  
  const results = performSearch(query, limit);
  
  ctx.response.json({
    results,
    total: results.length
  });
}

export type Handle = typeof handle;
```

**Error Handling:**

```typescript
export default function handle(ctx: CtxGet<Response>): void {
  try {
    const data = riskyOperation();
    ctx.response.json(data);
  } catch (error) {
    console.error('Operation failed', error);
    ctx.response.code = 500;
    ctx.response.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

## API Client

### Generated Type-Safe Client

The `youtrackApiGenerator` plugin generates a type-safe API client from HTTP handler definitions.

**Client Creation:**

```typescript
import { createApi } from '../api';
import type { ApiRouter } from '../api/api';

const api = createApi<ApiRouter>(host);
```

**Type-Safe Method Calls:**

```typescript
// GET request
const health = await api.global.health.GET({});

// POST request with body
const result = await api.project.settings.POST({
  projectId: 'ABC',
  name: 'New Setting'
});

// GET request with query parameters
const items = await api.global.search.GET({
  query: 'test',
  limit: 20
});
```

**Method Signatures:**

The generated client methods return Promises and accept typed parameters:

```typescript
// GET/DELETE methods
(query?: Partial<QueryType>) => Promise<ResponseType>

// POST/PUT methods
(body: BodyType, query?: Partial<QueryType>) => Promise<ResponseType>
```

### Zod Validation Integration

The API client integrates Zod schemas for runtime validation in development mode.

**Validation Behavior:**

- Request validation occurs before sending
- Response validation occurs after receiving
- Validation errors are logged via the logger
- Validation only runs when Zod schemas are available

**Schema Generation:**

Add `@zod-to-schema` comment above type definitions:

```typescript
/**
 * @zod-to-schema
 */
export type CreateReq = {
  name: string;
  count: number;
};

/**
 * @zod-to-schema
 */
export type CreateRes = {
  id: string;
  status: 'created';
};
```

**Generated Schema:**

```typescript
// src/api/api.zod.ts
import { z } from 'zod';

export const createReqSchema = z.object({
  name: z.string(),
  count: z.number()
});

export const createResSchema = z.object({
  id: z.string(),
  status: z.literal('created')
});

export const schema = {
  global: {
    create: {
      Req: createReqSchema,
      Res: createResSchema
    }
  }
};
```

### Request/Response Patterns

**Scope-Based Routing:**

The API client automatically routes requests based on scope:

```typescript
// Global scope - no entity ID required
await api.global.health.GET({});
// → /extensionEndpoints/{appId}/health

// Project scope - projectId required
await api.project.settings.GET({ projectId: 'ABC' });
// → /admin/projects/ABC/extensionEndpoints/{appId}/settings

// Issue scope - issueId required
await api.issue.status.PUT({ issueId: 'ABC-123', status: 'In Progress' });
// → /issues/ABC-123/extensionEndpoints/{appId}/status
```

**Error Handling:**

```typescript
try {
  const result = await api.project.settings.GET({ projectId: 'ABC' });
  console.log(result);
} catch (error) {
  console.error('API call failed', error);
}
```

**Query Parameter Handling:**

Query parameters are optional and partially typed:

```typescript
// All query parameters optional
await api.global.search.GET({
  query: 'test'
  // limit parameter omitted - uses server default
});

// Type-safe - TypeScript enforces valid parameter names
await api.global.search.GET({
  query: 'test',
  invalidParam: 'value'  // TypeScript error
});
```

## Build and Deployment

### Backend Compilation

Backend code compiles to CommonJS format for YouTrack compatibility.

**Build Command:**

```bash
npm run build:backend
```

**Vite Configuration:**

```typescript
export default defineConfig({
  plugins: [
    youtrackAppSettings(),
    youtrackApiGenerator(),
    youtrackRouter(),
    youtrackExtensionProperties()
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    minify: false,  // Preserve readability for debugging
    lib: {
      entry: [],
      formats: ['cjs']
    },
    rollupOptions: {
      external: [
        /^@jetbrains\/youtrack-scripting-api\//
      ]
    }
  }
});
```

**Output Files:**

```
dist/
├── global.js           # Global scope handlers
├── project.js          # Project scope handlers
├── issue.js            # Issue scope handlers
└── requirements.js     # App requirements
```

### Frontend Bundling

Frontend code bundles to ES modules with assets.

**Build Command:**

```bash
npm run build:frontend
```

**Vite Configuration:**

```typescript
export default defineConfig({
  plugins: [
    react(),
    youtrackAutoUpload({ enabled: false, buildName: 'frontend' })
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: false,  // Preserve backend files
    minify: true,
    rollupOptions: {
      input: {
        'my-widget': resolve(__dirname, 'src/widgets/my-widget/index.html')
      }
    }
  }
});
```

**Output Files:**

```
dist/
├── widgets/
│   ├── my-widget/
│   │   └── index.html
│   └── assets/
│       ├── index-abc123.js
│       └── index-def456.css
├── manifest.json
└── icon.svg
```

### App Validation

The YouTrack CLI validates app structure before upload.

**Validation Command:**

```bash
npx youtrack-app validate dist
```

**Validation Checks:**

- `manifest.json` structure and required fields
- Widget HTML files reference valid assets
- HTTP handler bundles are valid CommonJS
- Required files present (icon, manifest, handlers)
- File size limits not exceeded

**Full Build and Validate:**

```bash
npm run build
```

This command runs:
1. Clean generated files
2. Build backend (generates types)
3. Run linter
4. Build frontend
5. Validate app structure

## Configuration Reference

### Vite Configuration Patterns

**Backend Configuration:**

```typescript
// vite.config.backend.ts
import { defineConfig } from 'vite';
import {
  youtrackAppSettings,
  youtrackApiGenerator,
  youtrackRouter,
  youtrackExtensionProperties,
  youtrackAutoUpload
} from '@jetbrains/youtrack-enhanced-dx-tools';

export default defineConfig({
  plugins: [
    youtrackAppSettings(),
    youtrackApiGenerator(),
    youtrackRouter(),
    youtrackExtensionProperties(),
    youtrackAutoUpload({
      enabled: process.env.AUTOUPLOAD === 'true',
      buildName: 'backend'
    })
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: [],
      formats: ['cjs']
    },
    rollupOptions: {
      external: [/^@jetbrains\/youtrack-scripting-api\//]
    }
  }
});
```

**Frontend Configuration:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {
  youtrackAutoUpload,
  youtrackDevHtml,
  backendReloadPlugin
} from '@jetbrains/youtrack-enhanced-dx-tools';

const isServing = process.argv.includes('--mode') === false && !process.argv.includes('build');

export default defineConfig({
  plugins: [
    ...(!isServing ? [react()] : []),
    ...(isServing ? [backendReloadPlugin()] : []),
    youtrackDevHtml({
      enabled: process.env.DEV_MODE === 'true',
      devServerPort: 9000
    }),
    youtrackAutoUpload({
      enabled: process.env.AUTOUPLOAD === 'true',
      buildName: 'frontend'
    })
  ],
  server: {
    port: 9000,
    cors: {
      origin: '*',
      credentials: true
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: false,
    minify: true,
    rollupOptions: {
      input: {
        'widget-name': resolve(__dirname, 'src/widgets/widget-name/index.html')
      }
    }
  }
});
```

### Plugin Options

**youtrackAutoUpload:**

```typescript
{
  enabled: boolean;           // Enable auto-upload
  buildName: 'frontend' | 'backend';  // Build identifier
  stateFile: string;          // State file path (default: '.build-state.json')
}
```

**youtrackDevHtml:**

```typescript
{
  enabled: boolean;           // Enable dev mode
  devServerUrl: string;       // Dev server URL (default: 'http://localhost')
  devServerPort: number;      // Dev server port (default: 9000)
}
```

**backendReloadPlugin:**

```typescript
{
  markerFile: string;         // Marker file path (default: '.backend-changed')
}
```

### Environment Variables

**Required for Upload:**

```bash
YOUTRACK_HOST=https://your-youtrack.url
YOUTRACK_TOKEN=perm:your-permanent-token
```

**Build Mode Control:**

```bash
AUTOUPLOAD=true    # Enable automatic upload during watch mode
DEV_MODE=true      # Enable hot reload development mode
```

**Token Creation:**

1. Navigate to YouTrack profile → Authentication → New token
2. Assign a descriptive name
3. Grant app upload permissions
4. Copy the token (starts with `perm:`)

See [YouTrack documentation](https://www.jetbrains.com/help/youtrack/server/manage-permanent-token.html) for detailed instructions.

## Troubleshooting

### Common Issues

**Problem: `Cannot find module './api/api'`**

The API types have not been generated. Run the backend build to generate types:

```bash
npm run build:backend
```

**Problem: Types do not match backend changes**

The generated types are stale. Clean and rebuild:

```bash
npm run clean
npm run build:backend
```

**Problem: Upload fails with "401 Unauthorized"**

The authentication token is invalid or missing. Verify:

- `.env` file exists in project root
- `YOUTRACK_HOST` and `YOUTRACK_TOKEN` are set correctly
- Token has not expired
- Token has app upload permissions

**Problem: Both builds trigger for small change**

This behavior is expected when modifying route type definitions (`Req` or `Res` types). Backend builds first to generate new types, then frontend builds to use them. Implementation-only changes trigger a single build.

**Problem: Watch mode stuck in "waiting for build" state**

The build lock files are corrupted. Clean and restart:

```bash
rm -rf node_modules/.youtrack-build-lock
npm run watch
```

### Path Separator Problems (Windows)

**Problem: Route files not detected on Windows**

The library normalizes path separators to forward slashes for cross-platform compatibility. This issue should not occur in version 0.0.1 or later.

If route files are not detected:

1. Verify file structure matches conventions
2. Check that files are named exactly `GET.ts`, `POST.ts`, `PUT.ts`, or `DELETE.ts`
3. Ensure files are under `src/backend/router/`

### Type Generation Issues

**Problem: `export export` syntax error in `api.zod.ts`**

The Zod schema generator produced invalid output. This is automatically fixed by the build script. If the error persists:

1. Check `Req`/`Res` type definitions for syntax errors
2. Ensure `@zod-to-schema` comment is properly formatted
3. Verify types are exported with `export type`

**Problem: Extension properties not typed**

The extension properties plugin did not generate types. Verify:

- `entity-extensions.json` exists in project root
- JSON file is valid
- Property types are supported (`string`, `integer`, `float`, `boolean`)

### Upload Failures

**Problem: "App validation failed"**

The app structure is invalid. Run validation to see specific errors:

```bash
npx youtrack-app validate dist
```

Common validation failures:

- Missing `manifest.json`
- Invalid widget configuration
- Missing icon files
- Handler bundles are not valid CommonJS

**Problem: Upload succeeds but app does not appear**

The app may be incompatible with the YouTrack version. Verify:

- `minYouTrackVersion` in `manifest.json` matches your YouTrack version
- App is enabled in YouTrack → Administration → Apps
- Browser console shows no JavaScript errors

**Problem: Multiple uploads for single change**

The build coordination is not working correctly. Verify:

- Both frontend and backend configs include `youtrackAutoUpload` plugin
- `buildName` is set correctly (`'frontend'` or `'backend'`)
- Upload coordinator is running (`npm run watch:coordinator`)

If the issue persists, restart watch mode:

```bash
rm -f .build-state.json .backend-changed
npm run watch
```

## License

Apache-2.0

## Repository

https://github.com/JetBrains/youtrack-apps
