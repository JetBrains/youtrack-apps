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

export default function handle(ctx: CtxGet<ProjectSettingsReq, ProjectSettingsRes>): void {
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

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build both backend and frontend
- `npm run build:backend` - Build backend only (generates types)
- `npm run build:frontend` - Build frontend only
- `npm run clean` - Clean generated API files
- `npm run lint` - Run ESLint
- `npm run upload` - Upload to YouTrack

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

- `CtxGet<Query, Response>` - For GET requests
- `CtxPost<Body, Response>` - For POST requests

## 🚀 Deployment

1. Build your app: `npm run build`
2. Upload to YouTrack: `npm run upload -- --host https://your-youtrack.url --token your-token`

## 📖 Learn More

- [YouTrack App Development Guide](https://www.jetbrains.com/help/youtrack/server/youtrack-apps.html)
- [YouTrack Scripting API](https://www.jetbrains.com/help/youtrack/server/youtrack-scripting-api.html)
