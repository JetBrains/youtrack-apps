---
to: README.md
---
# <%= title %>

<%= description %>

This YouTrack app was created with **Enhanced DX** features, providing a modern TypeScript development experience with type-safe APIs and file-based routing.

## 🚀 Enhanced DX Features

- **Type-safe API endpoints** with automatic type generation
- **File-based routing** in `src/backend/router/`
- **Zod schema validation** in development mode
- **Automatic API client generation** with full TypeScript support

## 📁 Project Structure

```
src/
├── api/                    # Generated API client and types
│   ├── index.ts           # Type-safe API client
│   ├── api.d.ts           # Generated TypeScript definitions (auto-generated)
│   └── api.zod.ts         # Generated Zod schemas (auto-generated)
├── backend/
│   ├── router/            # File-based API routes
│   │   ├── global/        # Global endpoints (no project/issue context)
│   │   ├── project/       # Project-scoped endpoints
│   │   └── issue/         # Issue-scoped endpoints
│   ├── types/             # Backend type definitions
│   └── requirements.ts    # YouTrack version requirements
├── widgets/               # Your widget components
└── app-id.ts             # App identifier
```

## 🛠 Enhanced DX Tools

This app uses `@jetbrains/youtrack-enhanced-dx-tools` package which provides:

- **Vite plugins** for automatic API generation and routing
- **TypeScript utilities** for type-safe backend development
- **Zod integration** for runtime validation

The tools are automatically configured and ready to use. You can update them with:
```bash
npm update @jetbrains/youtrack-enhanced-dx-tools
```

## 🛠 Development Workflow

### 1. Creating API Endpoints

Create endpoints by adding files in the `src/backend/router/` directory following this pattern:
```
src/backend/router/{scope}/{path}/{METHOD}.ts
```

Example: `src/backend/router/project/settings/GET.ts`

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
        projectName: ctx.project.name || 'Unknown Project',
        settings: ctx.settings
    });
}

export type Handle = typeof handle;
```

### 2. Using the Type-Safe API Client

In your widgets, import and use the generated API client:

```typescript
import { createApi } from '../api';
import type { ApiRouter } from '../api/api';

// In your component
const api = createApi<ApiRouter>(host);

// Type-safe API calls with automatic validation in development
const settings = await api.project.settings.GET({ projectId: 'ABC-123' });
const health = await api.global.health.GET({});
```

### 3. Automatic Type Generation

Types and Zod schemas are automatically generated when you build:

- `src/api/api.d.ts` - TypeScript type definitions
- `src/api/api.zod.ts` - Zod validation schemas

Use the `@zod-to-schema` comment above your type definitions to include them in validation.

## ⚡ Watch Mode & Auto-Upload

For the best development experience, use watch mode with automatic upload:

### Initial Setup

1. **Create `.env` file** in your project root:
```bash
YOUTRACK_HOST=https://your-youtrack.url
YOUTRACK_TOKEN=perm:your-permanent-token-here
```

2. **Get a permanent token:**
   - Go to your YouTrack profile → Authentication → New token
   - Give it a name (e.g., "Dev Environment")
   - Copy the token (starts with `perm:`)
   - [Detailed instructions](https://www.jetbrains.com/help/youtrack/server/manage-permanent-token.html)

3. **Add `.env` to `.gitignore`** (already done in template):
```gitignore
.env
```

### Running Watch Mode

```bash
npm run watch:build
```

This command:
1. Cleans generated API files
2. Builds backend once (generates types)
3. Starts watching both frontend and backend
4. Automatically uploads changes to YouTrack

### How It Works

The watch system intelligently handles three scenarios:

**Scenario 1: Frontend-Only Changes**
```
You edit: src/widgets/MyWidget.tsx
Result:   Frontend rebuilds → Single upload
Time:     ~2-5 seconds
```

**Scenario 2: Backend Implementation Changes**
```
You edit: src/backend/router/project/settings/GET.ts (logic only)
Result:   Backend rebuilds → Single upload
Time:     ~3-6 seconds
```

**Scenario 3: Backend Type Changes**
```
You edit: ProjectSettingsRes type definition
Result:   Backend rebuilds (generates new api.d.ts)
          → Frontend rebuilds (uses new types)
          → Single upload
Time:     ~5-10 seconds
```

### Troubleshooting Watch Mode

**Problem:** Upload fails with "401 Unauthorized"
- Check `.env` file exists and has correct values
- Verify token hasn't expired
- Ensure token has app upload permissions

**Problem:** Changes not detected
- Save the file (Ctrl+S / Cmd+S)
- Check file is in `src/` directory
- Restart watch mode if needed

**Problem:** Both builds trigger for small change
- This is expected if you modified `Req` or `Res` type definitions
- Implementation-only changes should trigger single build

## 🔍 Using the Logger

In backend handlers, use `ctx.logger` instead of `console` for proper logging:

```typescript
import { CtxGet } from '@jetbrains/youtrack-enhanced-dx-tools';

export default function handle(ctx: CtxGet<MyResponse>) {
  // ✅ Good - appears in YouTrack workflow editor
  ctx.logger.info('Processing request for project:', ctx.project?.id);
  ctx.logger.warn('Rate limit approaching');
  ctx.logger.error('Failed to fetch data', error);
  
  // ❌ Avoid - may not appear in YouTrack logs
  console.log('This might not be visible');
  
  ctx.response.json({ success: true });
}

export type Handle = typeof handle;
```

**Log Levels:**
- `ctx.logger.debug()` - Verbose debugging (use sparingly)
- `ctx.logger.info()` - General information
- `ctx.logger.warn()` - Warnings and unexpected situations
- `ctx.logger.error()` - Errors and exceptions

**Viewing Logs:**
1. Go to YouTrack → Administration → Workflows
2. Find your app's workflow
3. Click "Edit" → View logs in the workflow editor console

## 📝 Type Naming Convention

**Important:** Only types ending with `Req` and `Res` are exported to the frontend API client.

```typescript
// ✅ Exported to API client
export type CreateProjectReq = { name: string };
export type CreateProjectRes = { id: string; name: string };

// ❌ NOT exported (missing Req/Res suffix)
export type CreateProjectRequest = { name: string };
export type ProjectData = { id: string };

// ✅ Internal types (not exported, which is fine)
type InternalConfig = { apiKey: string };
interface DatabaseRow { id: number; data: string }
```

This convention ensures:
- Clear distinction between API contracts and internal types
- Automatic type generation works correctly
- Frontend gets only the types it needs

## 📜 Available Scripts

### Development
- `npm run dev` - Start Vite dev server for frontend-only development (port 9099)
  - **Note:** This only runs the frontend. Backend changes require a full build.
  - Use this for rapid UI iteration when backend is stable.

- `npm run watch:build` - **Recommended for active development**
  - Watches both frontend and backend for changes
  - Automatically rebuilds and uploads to YouTrack when `AUTOUPLOAD=true`
  - Intelligently detects what changed (frontend/backend/both)
  - See "Watch Mode" section below for setup

### Building
- `npm run build` - Full production build (backend → lint → frontend → validate)
- `npm run build:nolint` - Build without linting (faster for testing)
- `npm run build:backend` - Build backend only (generates API types)
- `npm run build:frontend` - Build frontend only (requires backend types)
- `npm run clean` - Remove generated API files (`api.d.ts`, `api.zod.ts`)

### Deployment
- `npm run upload` - Upload to YouTrack (requires `--host` and `--token` flags)
- `npm run upload-local` - Upload using credentials from `.env` file
- `npm run update` - Quick build + upload (uses `.env` credentials)

### Maintenance
- `npm run lint` - Run ESLint on all source files
- `npm run pack` - Create distributable ZIP file

## 🔧 Configuration

### Adding Dependencies

The enhanced DX setup includes these key dependencies:
- `zod` - Runtime validation
- `ts-morph` - TypeScript AST manipulation
- `ts-to-zod` - Automatic Zod schema generation
- `fast-glob` - File system globbing
- `vite-tsconfig-paths` - TypeScript path mapping

### Vite Plugins

Two custom Vite plugins power the enhanced DX:
- `vite-plugin-youtrack-api-generator` - Generates TypeScript definitions and Zod schemas
- `vite-plugin-youtrack-router` - Handles file-based routing and builds endpoints

## 📚 API Routing

### Scopes

- **global**: Endpoints that don't require project or issue context
- **project**: Endpoints that operate on a specific project (require `projectId`)
- **issue**: Endpoints that operate on a specific issue (require `issueId`)

### HTTP Methods

Supported methods: `GET`, `POST`, `PUT`, `DELETE`

### Context Types

- `CtxGet<Response, Query?>` - For GET requests (query is optional and last)
- `CtxPost<Body, Response, Query?>` - For POST requests (query is optional and last)
- `CtxPut<Body, Response, Query?>` - For PUT requests (query is optional and last)
- `CtxDelete<Response, Query?>` - For DELETE requests (query is optional and last)

## 🚀 Deployment

1. Build your app: `npm run build`
2. Upload to YouTrack: `npm run upload -- --host https://your-youtrack.url --token your-token`

## 📖 Learn More

- [YouTrack App Development Guide](https://www.jetbrains.com/help/youtrack/server/youtrack-apps.html)
- [YouTrack Scripting API](https://www.jetbrains.com/help/youtrack/server/youtrack-scripting-api.html)

## 🐛 Common Issues & Solutions

### Type Generation

**Problem:** `Cannot find module './api/api'`
```bash
# Solution: Generate types first
npm run build:backend
```

**Problem:** Types don't match backend changes
```bash
# Solution: Clean and rebuild
npm run clean
npm run build:backend
```

### Build Errors

**Problem:** `export export` syntax error in `api.zod.ts`
- This is automatically fixed by the build script
- If it persists, check your `Req`/`Res` type definitions for syntax errors

**Problem:** ESLint errors blocking build
```bash
# Quick fix: Build without linting
npm run build:nolint

# Proper fix: Fix the linting issues
npm run lint
```

### Upload Issues

**Problem:** "App validation failed"
```bash
# Check what's wrong
npx youtrack-app validate dist

# Common issues:
# - Missing manifest.json
# - Invalid widget configuration
# - Missing icon files
```

**Problem:** Upload succeeds but app doesn't appear
- Check YouTrack version compatibility (`minYouTrackVersion` in manifest.json)
- Verify app is enabled in YouTrack → Administration → Apps
- Check browser console for JavaScript errors

### Watch Mode Issues

**Problem:** Stuck in "waiting for build" state
```bash
# Solution: Clean lock files and restart
rm -rf node_modules/.youtrack-build-lock
npm run watch:build
```

**Problem:** Multiple uploads for single change
- This is prevented by lock files
- If it happens, restart watch mode
