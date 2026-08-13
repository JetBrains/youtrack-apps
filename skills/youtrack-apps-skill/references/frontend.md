# YouTrack App Frontend

## Table of contents

1. [Mental model](#mental-model)
2. [Common patterns](#common-patterns)
3. [Common pitfalls](#common-pitfalls)
4. [Ring UI](#ring-ui)
5. [Widget anatomy](#widget-anatomy)
6. [The host handshake](#the-host-handshake)
7. [Calling the backend](#calling-the-backend)
8. [Apps with Enhanced DX](#apps-with-enhanced-dx)
9. [Apps without Enhanced DX](#apps-without-enhanced-dx)

## Mental model

- **Widget** - self-contained React app under `src/widgets/<key>/`; one Vite entry each.
- **Frontend language** - widgets are always written in TypeScript/TSX. App type does not select a JavaScript frontend.
- **App type** - `--type ts` means TypeScript backend plus enhanced DX; `--type js` means JavaScript backend plus
  basic tooling. Enhanced DX adds generated API types, validation, watch/upload features, and frontend HMR, but built
  scripts can appear as one-line output in the YouTrack editor. JavaScript backend apps have fewer tooling features, but
  backend scripts remain easy to read in the YouTrack editor.
- **Host** - bridge to YouTrack, from `await YTApp.register()`. All backend/YouTrack calls go through it. How widgets talk to backend and YouTrack.

## Common patterns

- **Add a widget to an existing app** - run the generator from `create-youtrack-app` pick the right extension point, edit the generated
  `app.tsx`. Don't hand-build the folder if the generator covers the point.
- **Display issue IDs** - show the readable issue ID in UI text, for example `DEMO-123`. Usually make issue IDs hyperlinks
  that open the issue in a new tab. Do not show raw REST IDs like `2-123` to users unless the user explicitly asks for
  diagnostic raw data.
- **Fix / debug a widget** - symptom to cause: invisible after upload = wrong/unsupported `extensionPoint` or missing
  manifest entry (no error thrown); `api.x.y` undefined (enhanced DX) = stale generated types, rebuild backend;
  `host` errors = handshake in the wrong place. See Common pitfalls.
- **Wire a widget to the backend** - ensure the handler exists, then choose the right call surface from
  [Calling the backend](#calling-the-backend).
- **Restyle a widget** - follow the Ring UI section. Don't roll your own design system.

## Common pitfalls

- **Widget invisible after upload** - wrong/unsupported `extensionPoint` or missing manifest entry. No error is thrown;
  check `manifest.json` first.
- **Not a standalone SPA** - no client-side router, no localhost render, no `ReactDOM.render` you own. The widget only
  lives inside YouTrack.
- **`host` used before ready** - keep `await YTApp.register()` at module scope, never inside a hook.
- **Editing generated files** - never edit generated API files by hand; they are overwritten on every enhanced DX
  backend build.
- **Stale types after a backend change** - in enhanced DX mode, rebuild the backend; don't rewrite the import.
- **No HMR in `watch`** - use the dev server for instant UI feedback.

## Ring UI

It is highly recomended to use **Ring UI** (`@jetbrains/ring-ui-built`) for components - native YouTrack look and dark mode. Import per
component, e.g. `@jetbrains/ring-ui-built/components/button/button`.

## Widget anatomy

```
src/widgets/<key>/
  app.tsx          # your React component - edit this
  index.tsx        # mounts <App/> - do not touch
  index.html       # Vite entry
  app.css
  widget-icon.svg
```

`index.tsx` wraps the app in Ring UI's `ControlsHeightContext` and imports
`@jetbrains/ring-ui-built/components/style.css` - leave it alone; edit `app.tsx`.

## The host handshake

`await YTApp.register()` runs **once, at module scope, before render** - never inside a hook or effect:

```typescript
const host = await YTApp.register();   // top-level await, runs before render

const AppComponent: React.FunctionComponent = () => { /* ... */ };
export const App = memo(AppComponent);
```

## Calling the backend

Use the call surface that matches the target:

- **YouTrack REST API** - use `host.fetchYouTrack()` for YouTrack API endpoints under `/api`.
- **App HTTP handlers / app backend** - use `host.fetchApp()` for app-defined HTTP handlers. This works in both app
  types and is the direct host API.
- **Typed app backend client** - in TypeScript backend apps with enhanced DX (`--type ts`), use the generated
  `@/api` module for app HTTP handlers. It is the typed wrapper around the enhanced DX router/client shape.

For full Host API request parameters and more examples, see [host-api.md](./host-api.md).

### YouTrack API - `fetchYouTrack`

```typescript
const host = await YTApp.register();
const user = await host.fetchYouTrack(`users/${YTApp.entity.id}?fields=id,login,name`);
```

### App HTTP handlers - `fetchApp`

```typescript
const host = await YTApp.register();

const result = await host.fetchApp('backend/debug', { query: { test: '123' } });
// 'backend/debug' matches the app HTTP handler path.
```

The path string is not type-checked - a typo fails at runtime, not build time. Keep the widget's path in sync with
handlers by hand.

### Enhanced DX API client - `@/api`

Use this only in TypeScript backend apps with enhanced DX (`--type ts`). [Apps with Enhanced DX](#apps-with-enhanced-dx).

```typescript
import {createApi} from "@/api";

const host = await YTApp.register();
const api = createApi(host);

const global = await api.global.demo.GET();
```

## Apps with enhanced DX

For apps scaffolded with `--type ts`: TypeScript backend plus enhanced DX. Frontend is TypeScript and enhanced DX provides: router, generated client, generated
types.

### Router and generated API client

Calls mirror the router file path exactly (`src/backend/router/{scope}/{path}/{METHOD}.ts`):

```typescript
const global = await api.global.demo.GET();
const echo   = await api.global.echo.POST({ message: "hi", metadata: { widget: "x" } });
const proj   = await api.project.demo.GET({ projectId: "DEMO", message: "hi" });
```

- Request/response are typed from the handler's `*Req` / `*Res` types.
- In development builds, Zod validates payloads at runtime - invalid data throws.
- Always import via the **`@/api` alias**, never a relative path into `src/api/`.

**`api.x.y` is undefined** -> the generated types are stale. Rebuild the backend (`npm run build:backend`); do not
rewrite the import.

### Build order

**Backend must build before frontend.** The backend build generates `src/api/api.d.ts` and `src/api/api.zod.ts`, which
the frontend imports. They are not in source control.

```bash
npm run build:backend   # generates src/api/*
npm run build:frontend  # consumes them - fails if run first
```

**Never edit files in `src/api/`** - regenerated on every backend build: `api.d.ts`, `api.zod.ts`, `app.d.ts`,
`extended-entities.d.ts`.

### Extension properties & app settings in a widget

A widget cannot read extension properties or `ctx.settings` directly - both are backend concepts. 

### Dev loop

- `npm run dev` — Vite dev server on `:9000` with HMR; use when iterating on UI.
- `npm run watch` — auto-uploads on rebuild, but **no** hot reload; refresh the YouTrack page.
- `npm run build && npm run upload-local` — manual production build + upload (`npm run update` does both).  
- If an existing app's `package.json` declares extra scripts such as `watch`, `upload-local`, or `update`, follow the
  local script definitions.

## Apps without Enhanced DX

For apps scaffolded with `--type js`: JavaScript backend plus basic tooling. The frontend is still TypeScript/TSX; this
mode does not provide the generated typed API client used by Enhanced DX.

### What a generated JavaScript app looks like

- **Backend** - flat JavaScript files `src/<name>.js` exporting `httpHandler.endpoints[]`. No
  `src/backend/router/`.
- **No sample widget** - `manifest.json` ships with **no** `widgets` key (an empty `widgets: []` fails validation) and
  there is no `src/widgets/` folder. Add the `widgets` array yourself when you add a TypeScript/TSX widget.

### App backend calls

Call app HTTP handlers with `host.fetchApp()`, as shown in [Calling the backend](#calling-the-backend). There is no
generated `@/api` module in this mode.

### Dev loop

```bash
npm run dev      # vite dev server
npm run build    # tsc, then: vite build if widgets exist, else copy backend.js+manifest+assets to dist; then youtrack-app app validate (defaults to dist)
npm run upload   # youtrack-app app upload
```

### Optional packaging

Run `npm run pack` only when you need a zip artifact, for example for marketplace submission or manual upload.
