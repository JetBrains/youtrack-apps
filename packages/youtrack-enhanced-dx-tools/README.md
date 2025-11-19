# @jetbrains/youtrack-enhanced-dx-tools

Enhanced DX tools and plugins for YouTrack apps with TypeScript support.

## Features

- **Vite Plugin for API Generation** - Automatically generates TypeScript definitions and Zod schemas from your backend routes
- **Vite Plugin for Router** - Handles file-based routing and builds backend endpoints
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

### Type Utilities

- `ExtractRPCFromHandler<T>` - Extracts RPC signature from handler types
- `CtxGet<R, Q?>` - Context type for GET handlers (Response first, Query optional and last)
- `CtxPost<Body, R, Q?>` - Context type for POST handlers (Body, Response, Query optional and last)
- `CtxPut<Body, R, Q?>` - Context type for PUT handlers (Body, Response, Query optional and last)
- `CtxDelete<R, Q?>` - Context type for DELETE handlers (Response first, Query optional and last)

## Development

This package is part of the YouTrack Apps ecosystem. For more information, visit the [YouTrack Apps documentation](https://www.jetbrains.com/help/youtrack/devportal-apps/).
