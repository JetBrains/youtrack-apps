---
to: README.md
---
# <%= title %>

<%= description %>

This app uses the Enhanced DX template with TypeScript support, type-safe APIs, and file-based routing.

For comprehensive documentation, see [@jetbrains/youtrack-enhanced-dx-tools](https://github.com/JetBrains/youtrack-apps/tree/main/packages/youtrack-enhanced-dx-tools).

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Development Workflows](#development-workflows)
- [Deployment](#deployment)
- [Learn More](#learn-more)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file in project root:

```bash
YOUTRACK_HOST=https://your-youtrack.url
YOUTRACK_TOKEN=perm:your-permanent-token
```

Get a permanent token: YouTrack profile → Account Security → New token. See [token management](https://www.jetbrains.com/help/youtrack/server/manage-permanent-token.html).

3. Start development with watch mode:

```bash
npm run watch
```

This watches for changes and automatically uploads to YouTrack. No auto-reload, requires manual refresh.
## Project Structure

```
src/
├── api/                          # Generated API client and types
│   ├── index.ts                  # Type-safe API client
│   ├── youtrack-types.d.ts       # YouTrack entity type shortcuts
│   ├── api.d.ts                  # Generated route types (auto-generated)
│   ├── api.zod.ts                # Generated Zod schemas (auto-generated)
│   ├── app.d.ts                  # Generated app settings types (auto-generated)
│   └── extended-entities.d.ts    # Generated extension property types (auto-generated)
├── backend/
│   ├── router/                   # File-based API routes
│   │   ├── global/               # Global endpoints (no project/issue context)
│   │   ├── project/              # Project-scoped endpoints
│   │   └── issue/                # Issue-scoped endpoints
│   ├── types/                    # Backend type definitions
│   │   ├── backend.global.d.ts   # Global backend types and context types
│   │   └── utility.d.ts          # Utility types for RPC extraction
│   └── requirements.ts           # YouTrack fields and values that your app needs
├── common/
│   └── utils/
│       └── logger.ts             # Logger utility for frontend components
├── widgets/                      # Widget components
└── app-id.ts                     # App identifier
```

## Available Scripts

### Development

- `npm run dev` - Start Vite dev server for hot reload (frontend only, port 9000)
- `npm run watch` - Watch mode with automatic rebuild and upload (recommended)
- `npm run watch:hmr` - Watch mode with hot reload enabled (fastest for frontend development)

### Building

- `npm run build` - Full production build (backend → lint → frontend → validate)
- `npm run build:nolint` - Build without linting (faster for testing)
- `npm run build:backend` - Build backend only (generates API types)
- `npm run build:frontend` - Build frontend only (requires backend types)
- `npm run clean` - Remove generated API files

### Deployment

- `npm run upload-local` - Upload using `.env` credentials
- `npm run update` - Quick build + upload
- `npm run dev:upload` - Build and upload dev-mode bundle (for hot reload setup)

### Maintenance

- `npm run lint` - Run ESLint
- `npm run pack` - Create distributable ZIP file

## Development Workflows

### Creating API Endpoints

Create files in `src/backend/router/{scope}/{path}/{METHOD}.ts`:

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
};

export default function handle(ctx: CtxGet<ProjectSettingsRes, ProjectSettingsReq>): void {
    const { projectId } = ctx.request.query;

    ctx.response.json({
        projectId,
        projectName: ctx.project.name
    });
}

export type Handle = typeof handle;
```

See [HTTP Handler Development](https://github.com/JetBrains/youtrack-apps/tree/main/packages/youtrack-enhanced-dx-tools#http-handler-development) for complete documentation.

### Using the API Client

In widgets:

```typescript
import { createApi } from '../api';
import type { ApiRouter } from '../api/api';

const api = createApi<ApiRouter>(host);
const settings = await api.project.settings.GET({ projectId: 'ABC-123' });
```

See [API Client](https://github.com/JetBrains/youtrack-apps/tree/main/packages/youtrack-enhanced-dx-tools#api-client) documentation.

### Watch Mode

Automatically rebuilds and uploads on file changes:

```bash
npm run watch
```

**What it does:**
- Watches both backend and frontend files
- Rebuilds on changes (backend generates types first if needed)
- Auto-uploads to YouTrack after each successful build
- Frontend builds as static bundles

**Scenarios:**
- Frontend-only changes
- Backend implementation
- Backend type changes: rebuilds frontend too

See [Watch Mode with Auto-Upload](https://github.com/JetBrains/youtrack-apps/tree/main/packages/youtrack-enhanced-dx-tools#watch-mode-with-auto-upload) for details.

### Hot Reload (HMR)

For instant frontend updates via Vite dev server:

```bash
npm run watch:hmr
```

**What it does:**
- One-time upload of dev-mode bundle (HTML points to localhost:9000)
- Starts Vite dev server on port 9000
- Watches backend with auto-upload
- Frontend changes hot reload instantly (<1s) without rebuilding or uploading

**Use when:** Iterating on frontend UI/components AND backend.

See [Hot Reload Setup](https://github.com/JetBrains/youtrack-apps/tree/main/packages/youtrack-enhanced-dx-tools#hot-reload-setup) for complete guide.

### Logger Usage

**In frontend components:**

```typescript
import { createComponentLogger } from '../common/utils/logger';

const logger = createComponentLogger('MyComponent');

function MyComponent() {
  logger.info('Component mounted');
  logger.debug('Rendering with props', {}, props);
  logger.error('Failed to load data', {}, error);
}
```

**In backend handlers:**

Backend handlers use standard `console` for logging:

```typescript
export default function handle(ctx: CtxGet<Response>) {
  console.log('Processing request');
  console.warn('Warning message');
  console.error('Error occurred', error);
}
```

View backend logs in: YouTrack → Administration → Apps → [Your App] → Technical Details → Open in editor / Download logs

### Type Naming Convention

Only types ending with `Req` and `Res` are exported to the API client:

```typescript
// Exported
export type CreateProjectReq = { name: string };
export type CreateProjectRes = { id: string };

// NOT exported (missing suffix)
export type ProjectData = { id: string };
```

## Deployment

### Development

```bash
npm run update
```

### Production

```bash
# Build and upload
npm run build
npm run upload-local

# Or upload with explicit credentials
npm run upload -- --host https://your-youtrack.url --token perm:your-token

# Or create ZIP for manual upload
npm run pack
```

## Common Issues

### `Cannot find module './api/api'`

Types not generated. Run:

```bash
npm run build:backend
```

### Upload fails with "401 Unauthorized"

- Check `.env` file exists with correct `YOUTRACK_HOST` and `YOUTRACK_TOKEN`
- Verify token has not expired
- Ensure token has app upload permissions

### Changes not detected in watch mode

- Save the file (Ctrl+S / Cmd+S)
- Check file is in `src/` directory
- Restart watch mode if needed

### Hot reload shows blank page

- Check Vite dev server is running (should start automatically with `npm run watch:hmr`)
- Verify dev server on port 9000: `curl http://localhost:9000`
- Check browser console for errors

For more troubleshooting, see [Troubleshooting Guide](https://github.com/JetBrains/youtrack-apps/tree/main/packages/youtrack-enhanced-dx-tools#troubleshooting).

## Learn More

- [Enhanced DX Tools Documentation](https://github.com/JetBrains/youtrack-apps/tree/main/packages/youtrack-enhanced-dx-tools) - Complete guide to the library
- [YouTrack App Development Guide](https://www.jetbrains.com/help/youtrack/devportal/apps-quick-start-guide.html) - Official YouTrack documentation
- [YouTrack Scripting API](https://www.jetbrains.com/help/youtrack/devportal/YouTrack-Api-Documentation.html) - API reference
