# YouTrack App Scaffolding with Enhanced DX (TypeScript)

**Audience:** App developers who want to build or contribute to YouTrack apps using the TypeScript toolchain.

**TL;DR:** Enhanced DX is an experimental TypeScript scaffolding layer for YouTrack apps. It gives you file-based routing, automatic type generation, a type-safe API client, and a watch+auto-upload workflow — all on top of Vite. You scaffold once, run `npm run watch`, and the tool handles the rest.

---

## Why it exists

Standard YouTrack app development requires writing backend HTTP handlers in plain JavaScript, manually wiring manifest entries, keeping request/response types in sync across frontend and backend, and running upload commands by hand. Enhanced DX removes all of that:

| Without Enhanced DX | With Enhanced DX |
|---|---|
| Plain JS backend handlers | TypeScript backend with full type checking |
| Manual manifest wiring | File-based routing — no manifest entries |
| No shared types | Types auto-generated from backend into frontend |
| Manual upload | Auto-upload on every successful build |
| No code generation | `npm run g` generates handlers, settings, properties |

---

## Prerequisites

- Node.js ≥ 18
- A running YouTrack instance you can upload apps to
- A permanent token with app upload permissions (YouTrack → Profile → Account Security → New token)

---

## Scaffolding a new app

### Option A — from npm (standard)

```bash
npm init @jetbrains/youtrack-app
```

Follow the prompts. When asked for the template, choose **TypeScript (Enhanced DX, experimental)**.

### Option B — run the CLI locally without installing

Use this when you are working on the scaffolding tool itself, or want to test an unpublished version.

**Step 1.** Clone and build the repos:

```bash
git clone https://github.com/JetBrains/youtrack-apps.git
cd youtrack-apps

# Install all workspace dependencies
npm install

# Build the tools package (required — the scaffolded app links against it)
cd packages/apps-tools
npm run build
cd ../..
```

**Step 2.** Link both packages globally so they can be resolved:

```bash
# Register the tools package in your local npm registry
cd packages/apps-tools
npm link
cd ../..

# Register the CLI
cd packages/create-youtrack-app
npm link
cd ../..
```

**Step 3.** Create your app using the local CLI:

```bash
mkdir ~/my-app && cd ~/my-app
create-youtrack-app
```

> After scaffolding, the CLI automatically runs `npm link @jetbrains/youtrack-apps-tools` in the generated project, wiring up the local build.

**Tip — skipping `npm link` altogether.** If you only want to run the CLI once without linking, use `node` directly:

```bash
cd ~/my-app
node /path/to/youtrack-apps/packages/create-youtrack-app/index.js
```

---

## First run after scaffolding

```bash
cd my-youtrack-app
```

Create `.env` in the project root:

```
YOUTRACK_HOST=https://your-youtrack.example.com
YOUTRACK_TOKEN=perm:your-permanent-token
```

Start the development loop:

```bash
npm run dev
```

This does everything in one shot:
1. Cleans stale generated files, builds backend → generates `src/api/api.d.ts` and `src/api/api.zod.ts`
2. Uploads a dev-mode bundle to YouTrack (HTML points widgets at `localhost:9000`)
3. Starts a Vite dev server on `:9000`
4. Watches backend — rebuilds and re-uploads on every change
5. Watches frontend — hot-reloads in the browser instantly, no upload needed

Open your YouTrack instance and refresh — the app is there, and frontend changes appear without a page reload.

---

## Project structure

```
src/
├── api/                         # ⚠ Auto-generated — never edit by hand
│   ├── index.ts                 # Type-safe API client factory
│   ├── youtrack-types.d.ts      # YouTrack entity type re-exports
│   ├── api.d.ts                 # Generated route types
│   ├── api.zod.ts               # Generated Zod validation schemas
│   ├── app.d.ts                 # Generated app settings types
│   └── extended-entities.d.ts   # Generated extension property types
├── backend/
│   ├── router/                  # File-based API routes (one file = one endpoint)
│   │   ├── global/              # Scope: no entity context
│   │   ├── project/             # Scope: ctx.project available
│   │   └── issue/               # Scope: ctx.issue + ctx.project available
│   ├── types/
│   │   ├── backend.global.d.ts  # CtxGet / CtxPost / CtxPut / CtxDelete globals
│   │   └── utility.d.ts         # ExtractRPCFromHandler utility type
│   └── requirements.ts          # YouTrack field/value declarations
├── common/
│   └── utils/
│       └── logger.ts            # Frontend logger utility (loglevel-based)
├── widgets/                     # React frontend widgets
└── app-id.ts                    # App identifier constant
```

**Critical build order:** backend must build before frontend. The backend build generates the type files that the frontend imports. Running `build:frontend` on a clean checkout will fail.

```bash
npm run build:backend   # generates src/api/api.d.ts + src/api/api.zod.ts
npm run build:frontend  # imports those types
```

---

## File-based routing

The router scans `src/backend/router/{scope}/{path}/{METHOD}.ts` and builds one bundle per scope (`dist/global.js`, `dist/project.js`, `dist/issue.js`). YouTrack discovers these bundles automatically — you never touch `manifest.json` for HTTP handlers.

**Rules:**
- `{scope}` must be exactly: `global`, `project`, `issue`, `article`, or `user`
- `{path}` can be nested: `users/profile`, `settings/advanced`
- `{METHOD}` must be uppercase: `GET.ts`, `POST.ts`, `PUT.ts`, `DELETE.ts`

### Handler shape

Every handler file needs these four things — none are optional:

```typescript
/**
 * @zod-to-schema          ← required on both Req and Res types
 */
export type ProjectSettingsReq = {
  projectId: string;
  message?: string;
};

/**
 * @zod-to-schema
 */
export type ProjectSettingsRes = {
  name: string;
  shortName: string;
};

export default function handle(ctx: CtxGet<ProjectSettingsRes, ProjectSettingsReq, "project">): void {
  ctx.response.json({
    name: ctx.project.name,       // ctx.project is typed because scope = "project"
    shortName: ctx.project.shortName,
  });
}

export type Handle = typeof handle;  ← required for the API client generator
```

**Context type signatures:**

```typescript
CtxGet<Res, Req?, Scope?>
CtxDelete<Res, Req?, Scope?>
CtxPost<Body, Res, Query?, Scope?>
CtxPut<Body, Res, Query?, Scope?>
```

Always available: `ctx.currentUser`, `ctx.settings`, `ctx.request`, `ctx.response`.  
Scope-specific (only when the third/fourth generic matches the directory):
`ctx.issue`, `ctx.project`, `ctx.article`, `ctx.user`, `ctx.globalStorage`.

---

## Code generator

Inside an Enhanced DX project, `npm run g` is a shorthand for the scaffolding CLI pointed at your current project. Use it to add handlers, extension properties, and settings without writing boilerplate.

### Generate a widget

```bash
npm run g -- widget --key my-panel --extension-point ISSUE_BELOW_SUMMARY
npm run g -- widget --key admin-page --extension-point MAIN_MENU_ITEM --name "Admin Page"
npm run g -- widget --key project-tab --extension-point PROJECT_SETTINGS --permissions read-project
```

This creates `src/widgets/<key>/` (React component, HTML, CSS, Vite config) and injects the entry into `manifest.json` automatically. No manual manifest editing needed.

Available extension points: `MAIN_MENU_ITEM`, `DASHBOARD_WIDGET`, `ISSUE_BELOW_SUMMARY`, `ISSUE_ABOVE_ACTIVITY_STREAM`, `ISSUE_FIELD_PANEL_FIRST`, `ISSUE_FIELD_PANEL_LAST`, `ISSUE_OPTIONS_MENU_ITEM`, `PROJECT_SETTINGS`, `ARTICLE_ABOVE_ACTIVITY_STREAM`, `ARTICLE_OPTIONS_MENU_ITEM`, `USER_CARD`, `USER_PROFILE_SETTINGS`, `ADMINISTRATION_MENU_ITEM`, `HELPDESK_CHANNEL`, `MARKDOWN`.

Optional flags: `--name`, `--description`, `--permissions <PERM1,PERM2>`, `--width <px>`, `--height <px>`.

### Generate a handler

```bash
npm run g -- handler global/health                                   # GET (default)
npm run g -- handler project/users --method POST
npm run g -- h issue/comments --method POST --permissions read-issue,update-issue
```

This creates the file at the correct path with the right types, `@zod-to-schema` annotations, and `Handle` export already in place.

### Generate an extension property

Extension properties add custom fields to YouTrack entities, persisted by YouTrack.

Valid target entities: `Issue`, `User`, `Project`, `Article`.
Valid types: `string` (default), `integer`, `float`, `boolean`, `Issue`, `User`, `Project`, `Article`.

```bash
npm run g -- property Issue.customStatus           # string, single-value
npm run g -- property Issue.tags --type string --set   # multi-value
npm run g -- p Article.rating --type integer
```

Access in handlers after rebuilding:

```typescript
ctx.issue.extensionProperties.customStatus  // fully typed
```

### Generate app settings

App settings let admins configure the app per-instance or per-project:

```bash
npm run g -- settings init --title "My App Settings" --description "Admin config"
npm run g -- settings add --name apiKey --type string --write-only
npm run g -- settings add --name maxItems --type integer --min 1 --max 100
```

Access in handlers:

```typescript
const key = ctx.settings.apiKey;
```

### Interactive mode

```bash
npm run g    # no arguments — shows a menu
```

---

## Frontend API client

The backend build generates a fully typed `ApiRouter` interface. Widgets import it via a thin proxy client:

```typescript
import { createApi } from "@/api";
import type { ApiRouter } from "@/api/api";

const host = await YTApp.register();
const api = createApi<ApiRouter>(host);

// Route path mirrors the file path exactly
const result = await api.project.settings.GET({ projectId: "ABC" });
const echo = await api.global.echo.POST({ message: "hello" });
const details = await api.issue.details.GET({ issueId: "DEMO-1" });
```

TypeScript knows the exact shape of the request and response for every call. Zod validates requests and responses at runtime and logs warnings on mismatches. Validation only runs in dev builds (`npm run watch` / `npm run dev`) — `api.zod.ts` is tree-shaken out of production builds entirely.

If a route is missing from `api`, run `npm run build:backend` — the types are stale.

---

## Development workflows at a glance

| Goal | Command |
|---|---|
| Daily development | `npm run dev` |
| Regenerate backend types only | `npm run build:backend` |
| Full production build | `npm run build` |
| One-shot upload | `npm run upload-local` |
| Build + upload | `npm run update` |
| Add a widget/handler/property/setting | `npm run g` |

### `npm run dev` — how it works

1. Cleans generated files, builds backend (generates `api.d.ts` and `api.zod.ts`)
2. Uploads a dev-mode bundle once — widget HTML references `localhost:9000`
3. Starts a Vite dev server on `:9000`
4. Watches backend — rebuilds and re-uploads on every `.ts` change under `src/backend/`
5. Watches frontend — hot-reloads in the browser instantly, no upload cycle

**Backend changes:** ~3–10 s (rebuild + upload). Refresh the page.  
**Frontend changes:** <1 s (Vite HMR). No refresh needed.

### When to use `npm run watch` instead

`watch` skips the Vite dev server. Every frontend change triggers a full rebuild + upload (~10–30 s) instead of HMR. Use it only when you cannot expose port 9000 (e.g. a headless build server, or doing backend-only work where you never want HMR).

---

## Viewing logs

- **Frontend** — browser DevTools console
- **Backend** — YouTrack → Administration → Apps → [Your App] → Technical Details → Open in editor / Download logs

```typescript
// In backend handlers — standard console methods
console.log('[MyHandler] Processing:', ctx.issue.id);
console.error('[MyHandler] Failed:', error);
```

---

## Common issues

**`Cannot find module './api/api'`**  
Backend types not generated yet. Run `npm run build:backend`.

**Upload returns 401 Unauthorized**  
Check `.env` — verify `YOUTRACK_HOST` (with `https://`) and `YOUTRACK_TOKEN` (starts with `perm:`).

**Changes not uploading in watch mode**  
Save the file explicitly (Cmd+S), confirm it is under `src/`. Restart `npm run watch` if the watcher is stuck.

**Frontend shows blank page in dev/HMR mode**  
Vite dev server on `:9000` — confirm it started. Check `curl http://localhost:9000` and look for errors in the browser console.

**`ts-to-zod` failed / skipped**  
Run `npm install -D ts-to-zod` in the project. The Zod schema step is optional — the build continues but runtime validation is disabled.

---

## Source code

- CLI scaffolding: [`packages/create-youtrack-app`](https://github.com/JetBrains/youtrack-apps/tree/main/packages/create-youtrack-app)
- Vite plugins and runtime API client: [`packages/apps-tools`](https://github.com/JetBrains/youtrack-apps/tree/main/packages/apps-tools)

Both packages are in the same monorepo. The tools package is consumed as Vite plugins during the app build — it does not ship into the YouTrack bundle.
