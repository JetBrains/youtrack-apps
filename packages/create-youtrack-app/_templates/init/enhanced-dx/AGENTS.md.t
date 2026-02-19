---
to: AGENTS.md
---
# AGENTS.md — <%= title %>

AI agent context for working in this YouTrack app.

---

## What This Project Is

A **YouTrack app** built with the Enhanced DX template. It runs inside a live YouTrack instance — there is no local sandbox. Changes are deployed by uploading a built artifact to YouTrack via `npm run upload-local` (or automatically in watch mode).

The codebase has two distinct halves that are built separately:

- **Backend** (`src/backend/`) — TypeScript HTTP handlers that run inside YouTrack's workflow engine. They have direct access to YouTrack entities (Issue, Project, User, etc.).
- **Frontend** (`src/widgets/`) — React widgets rendered inside YouTrack pages. They call the backend via a generated type-safe API client.

---

## Critical Build Constraint

**Backend must build before frontend.** The backend build generates `src/api/api.d.ts` and `src/api/api.zod.ts`, which the frontend imports. These files do not exist in source control.

```bash
npm run build:backend   # generates src/api/api.d.ts + src/api/api.zod.ts
npm run build:frontend  # uses those types — will fail if run first
```

**Never edit files in `src/api/` by hand** — they are overwritten on every backend build:
- `src/api/api.d.ts` — generated route types
- `src/api/api.zod.ts` — generated Zod schemas
- `src/api/app.d.ts` — generated app settings types
- `src/api/extended-entities.d.ts` — generated extension property types

---

## File-Based Routing

Backend routes follow a strict file convention:

```
src/backend/router/{scope}/{path}/{METHOD}.ts
```

- `{scope}` must be exactly: `global`, `project`, `issue`, `article`, or `user`
- `{path}` can be nested: `users/profile`, `settings/advanced`
- `{METHOD}` must be uppercase: `GET.ts`, `POST.ts`, `PUT.ts`, or `DELETE.ts`

### Required Handler Shape

Every handler file must have this exact structure — all four exports are required:

```typescript
/**
 * @zod-to-schema
 */
export type MyReq = {
  projectId: string;
};

/**
 * @zod-to-schema
 */
export type MyRes = {
  name: string;
  count?: number;
};

export default function handle(ctx: CtxGet<MyRes, MyReq, "project">): void {
  ctx.response.json({
    name: ctx.project.name,
    count: 0,
  });
}

export type Handle = typeof handle;
```

**Rules that cannot be skipped:**
- `/** @zod-to-schema */` on every `*Req` and `*Res` type — without it, the type is excluded from the API client and Zod schemas
- `export type Handle = typeof handle` at the end — without it, the API client generator cannot read the handler's types
- Only types suffixed `Req` / `Res` are surfaced to the frontend API client

### Context Types

```typescript
CtxGet<Res, Req?, Scope?>
CtxPost<Body, Res, Req?, Scope?>
CtxPut<Body, Res, Req?, Scope?>
CtxDelete<Res, Req?, Scope?>
```

Always available on `ctx`:
- `ctx.currentUser` — the YouTrack user making the request
- `ctx.settings` — app settings configured by the admin
- `ctx.request.query` — query parameters (GET/DELETE)
- `ctx.request.json()` — parsed body (POST/PUT)
- `ctx.response.json(data)` / `ctx.response.text(str)` — send response

Available only when the scope matches the third generic:
- `ctx.issue` — when scope is `"issue"`
- `ctx.project` — when scope is `"project"`
- `ctx.article` — when scope is `"article"`
- `ctx.user` — when scope is `"user"`
- `ctx.globalStorage` — when scope is `"global"`

**Scope must match the directory.** A handler at `src/backend/router/issue/.../GET.ts` must use `CtxGet<..., ..., "issue">` to get a typed `ctx.issue`.

### Adding a New Route

Preferred: use the built-in generator:

```bash
npm run g -- handler <scope>/<path>              # GET by default
npm run g -- handler project/users --method POST
npm run g -- h issue/notes --method POST --permissions READ_ISSUE
```

Or create the file manually following the shape above, then rebuild to regenerate types:

```bash
npm run build:backend
```

---

## Extension Properties

Custom fields on YouTrack entities are declared in `src/entity-extensions.json`. After editing, rebuild to regenerate types:

```bash
npm run g -- property Issue.myField           # string, single-value
npm run g -- property Issue.tags --type string --set  # multi-value
npm run build:backend
```

Access in handlers: `ctx.issue.extensionProperties.myField` (type-safe after rebuild).

---

## App Settings

Admin-configured values are declared in `src/settings.json`. After editing, rebuild to regenerate types:

```bash
npm run g -- settings init    # first time
npm run g -- settings add     # add a property
npm run build:backend
```

Access in handlers: `ctx.settings.myKey`.

---

## Frontend API Client

Widgets call the backend through the generated client:

```typescript
import { createApi } from "@/api";

const host = await YTApp.register();
const api = createApi(host);

// Calls match the router file path exactly
const result = await api.project.settings.GET({ projectId: 'ABC' });
const echo = await api.global.echo.POST({ message: 'hello' });
const details = await api.issue.details.GET({ issueId: 'DEMO-1' });
```

If a route is missing from `api`, rebuild the backend — the types are stale.

---

## Development Workflow

### Recommended: watch mode

```bash
npm run watch
```

Watches both backend and frontend, auto-uploads to YouTrack on every successful rebuild. No hot reload — refresh the YouTrack page after upload.

### Faster frontend iteration: dev mode with HMR

```bash
npm run dev
```

Same as watch, but also starts a Vite dev server on `:9000`. Frontend changes appear instantly without a page reload. Use this when iterating on UI.

### Manual build + upload

```bash
npm run build          # full production build
npm run upload-local   # upload using .env credentials
# or both at once:
npm run update
# or combination of everything:
npm run dev
```

### Environment

Requires `.env` in project root:

```
YOUTRACK_HOST=https://your-youtrack.example.com
YOUTRACK_TOKEN=perm-your-permanent-token
```

Get a token (only developer can generate a token, ask if not provided) Instruction: YouTrack → Profile → Account Security → New token.

---

## What Not to Do

- Do not edit any file in `src/api/` — they are generated and will be overwritten
- Do not build the frontend without first building the backend (or having fresh generated types)
- Do not add a fourth scope variant to a single handler file — one file = one method
- Do not use relative paths to import from `src/api/` — use the `@/api` alias

---

## Logs

- **Frontend** — browser DevTools console
- **Backend** — YouTrack → Administration → Apps → [This App] → Technical Details → Open in editor / Download logs; use `console.log/warn/error` in handlers
