# @jetbrains/youtrack-enhanced-dx-tools

Enhanced DX tools and plugins for YouTrack apps with TypeScript support.

## Features

- **Vite Plugin for API Generation** - Automatically generates TypeScript definitions and Zod schemas from your backend routes
- **Vite Plugin for Router** - Handles file-based routing and builds backend endpoints
- **Vite Plugin for Auto-Upload** - Coordinates frontend and backend builds with automatic upload to YouTrack
- **Vite Plugin for Extension Properties** - Generates types for custom entity extension properties
- **TypeScript Utilities** - Type-safe context types and RPC extraction utilities

## Installation

```bash
npm install @jetbrains/youtrack-enhanced-dx-tools
```

## Usage

### Vite Configuration

```typescript
import { defineConfig } from 'vite';
import { youtrackApiGenerator, youtrackRouter } from '@jetbrains/youtrack-enhanced-dx-tools';

export default defineConfig({
  plugins: [
    youtrackApiGenerator(),
    youtrackRouter()
  ],
  // ... rest of your config
});
```

### TypeScript Types

```typescript
import { ExtractRPCFromHandler, CtxGet, CtxPost } from '@jetbrains/youtrack-enhanced-dx-tools';

// Use the types in your backend handlers
export const Handle: CtxGet<ResponseType, QueryType> = (ctx) => {
  // Your handler logic
  // Query is optional and comes last, so you can use: CtxGet<ResponseType>
};
```

## API Reference

### `youtrackApiGenerator()`

Vite plugin that:
- Scans your `src/backend/router/` directory for route files
- Generates TypeScript definitions in `src/api/api.d.ts`
- Generates Zod schemas in `src/api/api.zod.ts`
- Supports `@zod-to-schema` annotations for automatic validation

### `youtrackRouter()`

Vite plugin that:
- Builds backend endpoints from your route files
- Generates HTTP handlers for each scope (global, project, issue)
- Handles file-based routing automatically

### `youtrackAutoUpload(options)`

Vite plugin that coordinates builds and uploads:
- Monitors frontend and backend build completion
- Triggers single upload after both builds finish
- Prevents duplicate uploads during watch mode

**Options:**
```typescript
{
  enabled?: boolean;      // Enable auto-upload (default: false)
  command?: string;       // Upload command (default: 'npm run upload-local')
  debounceMs?: number;    // Debounce delay (default: 500ms)
  buildName?: 'frontend' | 'backend';  // Which build this plugin monitors
}
```

**Usage in vite.config.ts:**
```typescript
import { youtrackAutoUpload } from '@jetbrains/youtrack-enhanced-dx-tools';

export default defineConfig({
  plugins: [
    youtrackAutoUpload({ 
      enabled: process.env.AUTOUPLOAD === 'true', 
      buildName: 'frontend' 
    })
  ]
});
```

### `youtrackDevHtml(options)`

Vite plugin that transforms widget HTML to load scripts from localhost during development.

**Options:**
```typescript
{
  enabled?: boolean;        // Enable dev mode (default: false)
  devServerUrl?: string;    // Dev server URL (default: 'http://localhost')
  devServerPort?: number;   // Dev server port (default: 9099)
}
```

**Usage:**
```typescript
import { youtrackDevHtml } from '@jetbrains/youtrack-enhanced-dx-tools';

export default defineConfig({
  plugins: [
    youtrackDevHtml({ 
      enabled: process.env.DEV_MODE === 'true',
      devServerPort: 9099
    })
  ]
});
```

### `youtrackExtensionProperties()`

Vite plugin that:
- Reads `entity-extensions.json` configuration
- Generates TypeScript types for custom entity properties
- Augments context types with extension properties

### Type Utilities

- `ExtractRPCFromHandler<T>` - Extracts RPC signature from handler types
- `CtxGet<R, Q?>` - Context type for GET handlers (Response first, Query optional and last)
- `CtxPost<Body, R, Q?>` - Context type for POST handlers (Body, Response, Query optional and last)
- `CtxPut<Body, R, Q?>` - Context type for PUT handlers (Body, Response, Query optional and last)
- `CtxDelete<R, Q?>` - Context type for DELETE handlers (Response first, Query optional and last)

## Development Workflow

### Watch Mode with Auto-Upload

The Enhanced DX tools support automatic upload during development. When you make changes, the system intelligently determines what needs to be rebuilt:

**Three Build Scenarios:**

1. **Frontend-only changes** (`src/widgets/**`, `src/components/**`):
   - Only frontend is rebuilt
   - Single upload after frontend build completes

2. **Backend-only changes** (`src/backend/**` implementation, no type changes):
   - Only backend is rebuilt
   - Single upload after backend build completes

3. **Backend type changes** (route `Req`/`Res` types):
   - Backend builds first (generates `api.d.ts`)
   - Frontend builds second (uses updated types)
   - Single upload after both complete

**Setup:**

1. Create `.env` file in your project root:
```bash
YOUTRACK_HOST=https://your-youtrack.url
YOUTRACK_TOKEN=perm:your-permanent-token
```

2. Run watch mode:
```bash
npm run watch:build
```

The `watch:build` script:
- Runs initial backend build to generate types
- Starts both frontend and backend watchers
- Automatically uploads when `AUTOUPLOAD=true`

### Hot Reload (Development Mode)

For the fastest development experience, use hot reload to see frontend changes instantly without rebuilding or uploading:

**Setup (one-time):**
1. Ensure `.env` file exists with `YOUTRACK_HOST` and `YOUTRACK_TOKEN`
2. Upload your app once with dev mode enabled

**Workflow:**

```bash
# Terminal 1: Start Vite dev server
npm run dev:server

# Terminal 2: Build and upload dev-mode bundle (one time)
npm run dev:remote:upload

# Now edit any frontend file → hot reload in YouTrack!
```

**How It Works:**
- The uploaded HTML contains `<script>` tags pointing to `http://localhost:9099`
- Vite dev server serves your source code with HMR enabled
- Changes to React components hot reload instantly
- Backend changes still require re-uploading with `npm run dev:remote:upload`

**Requirements:**
- Vite dev server must be running on port 9099
- YouTrack instance must be accessible from your development machine
- Browser must allow scripts from localhost (typically allowed)

**Limitations:**
- Frontend-only hot reload (backend requires upload)
- Requires keeping Vite dev server running
- Only works during development (production builds use bundled scripts)

### Environment Variables

- `YOUTRACK_HOST` - Your YouTrack instance URL
- `YOUTRACK_TOKEN` - Permanent token for authentication ([how to create](https://www.jetbrains.com/help/youtrack/server/manage-permanent-token.html))
- `AUTOUPLOAD` - Set to `'true'` to enable automatic uploads during watch mode

### Logger Usage

In your backend handlers, use `ctx.logger` instead of `console` for proper logging:

```typescript
import { CtxGet } from '@jetbrains/youtrack-enhanced-dx-tools';

export default function handle(ctx: CtxGet<MyResponse>) {
  // ✅ Good - logs appear in YouTrack's workflow editor
  ctx.logger.info('Processing request');
  ctx.logger.warn('Something unexpected happened');
  ctx.logger.error('An error occurred', error);
  
  // ❌ Avoid - console logs may not appear in YouTrack
  console.log('This might not be visible');
  
  ctx.response.json({ success: true });
}

export type Handle = typeof handle;
```

**Log Levels:**
- `ctx.logger.info()` - General information
- `ctx.logger.warn()` - Warnings
- `ctx.logger.error()` - Errors
- `ctx.logger.debug()` - Debug information (verbose)

**Viewing Logs:**
Logs appear in YouTrack's workflow editor when testing your app handlers.

## Troubleshooting

### Watch Mode Issues

**Problem:** Changes not triggering rebuild
- **Solution:** Check that files are saved and within watched directories
- **Solution:** Restart watch mode: `Ctrl+C` then `npm run watch:build`

**Problem:** Upload fails with authentication error
- **Solution:** Verify `.env` file exists with correct `YOUTRACK_HOST` and `YOUTRACK_TOKEN`
- **Solution:** Check token permissions - needs app upload rights

**Problem:** Both builds trigger when only frontend changed
- **Solution:** This is expected if you modified route type definitions (`Req`/`Res` types)
- **Solution:** Implementation-only changes should trigger single build

### Type Generation Problems

**Problem:** `api.d.ts` not generated
- **Solution:** Run `npm run build:backend` manually to generate types
- **Solution:** Check for TypeScript errors in route files

**Problem:** Types out of sync with backend
- **Solution:** Clean and rebuild: `npm run clean && npm run build:backend`

**Problem:** Zod schemas not validating
- **Solution:** Ensure types have `@zod-to-schema` comment above them
- **Solution:** Check `api.zod.ts` was generated correctly

### Upload Failures

**Problem:** "App validation failed"
- **Solution:** Run `youtrack-app validate dist` to see specific errors
- **Solution:** Check `manifest.json` syntax and required fields

**Problem:** Duplicate uploads during watch
- **Solution:** This is prevented by lock files in `node_modules/.youtrack-build-lock/`
- **Solution:** If stuck, delete the lock directory and restart watch mode

## Development

This package is part of the YouTrack Apps ecosystem. For more information, visit the [YouTrack Apps documentation](https://www.jetbrains.com/help/youtrack/devportal-apps/).
