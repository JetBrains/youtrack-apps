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
export const Handle: CtxGet<QueryType, ResponseType> = (ctx) => {
  // Your handler logic
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
- `CtxGet<Q, R>` - Context type for GET/DELETE handlers
- `CtxPost<T, R>` - Context type for POST/PUT handlers
- `CtxPut<T, R>` - Context type for PUT handlers
- `CtxDelete<Q, R>` - Context type for DELETE handlers

## Development

This package is part of the YouTrack Apps ecosystem. For more information, visit the [YouTrack Apps documentation](https://www.jetbrains.com/help/youtrack/devportal-apps/).
