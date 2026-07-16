# Frontend — TypeScript (Enhanced DX, `--type ts`)

Specifics for apps scaffolded with `--type ts`. The main flow and gate are in `../SKILL.md`; this file is the frontend deep-dive for the enhanced-dx template.

## Widget anatomy

```
src/widgets/<key>/
  app.tsx          # your React component — edit this
  index.tsx        # mounts <App/> — do not touch
  index.html       # Vite entry
  app.css
  widget-icon.svg
```

`index.tsx` wraps the app in Ring UI's `ControlsHeightContext` and imports `@jetbrains/ring-ui-built/components/style.css` — leave it alone; edit `app.tsx`.

## The host handshake (module scope)

`await YTApp.register()` runs **once, at module scope, before render** — never inside a hook or effect:

```typescript
import {createApi} from "@/api";

const host = await YTApp.register();   // top-level await, runs before render
const api = createApi(host);

const AppComponent: React.FunctionComponent = () => { /* ... */ };
export const App = memo(AppComponent);
```

## Calling the backend — the `@/api` client

Calls mirror the router file path exactly (`src/backend/router/{scope}/{path}/{METHOD}.ts`):

```typescript
const global = await api.global.demo.GET();
const echo   = await api.global.echo.POST({ message: "hi", metadata: { widget: "x" } });
const proj   = await api.project.demo.GET({ projectId: "DEMO", message: "hi" });
```

- Request/response are typed from the handler's `*Req` / `*Res` types.
- In development builds, Zod validates payloads at runtime — invalid data throws.
- Always import via the **`@/api` alias**, never a relative path into `src/api/`.

**`api.x.y` is undefined** → the generated types are stale. Rebuild the backend (`npm run build:backend`); do not rewrite the import.

## Build order (hard constraint)

**Backend must build before frontend.** The backend build generates `src/api/api.d.ts` and `src/api/api.zod.ts`, which the frontend imports. They are not in source control.

```bash
npm run build:backend   # generates src/api/*
npm run build:frontend  # consumes them — fails if run first
```

**Never edit files in `src/api/`** — regenerated on every backend build: `api.d.ts`, `api.zod.ts`, `app.d.ts`, `extended-entities.d.ts`.

## Extension points, config & visibility

Manifest-level and language-neutral — the extension-point catalog, widget config fields, permission-gated visibility, and the `npm run g -- widget` generator are in `references/widgets.md`. The `.tsx` component the generator produces is below.

## Extension properties & app settings in a widget

A widget cannot read extension properties or `ctx.settings` directly — both are backend concepts. A handler reads them (`ctx.issue.extensionProperties.myField`, `ctx.settings.myKey`) and returns the values in its `*Res`; the widget then receives them typed through the `@/api` client.

To surface a new extension property in the UI: declare it (`src/entity-extensions.json`), rebuild the backend, return it from a handler, then read it from the API response in `app.tsx`.

## Ring UI

Use **Ring UI** (`@jetbrains/ring-ui-built`) for components — native YouTrack look and dark mode for free. Import per component, e.g. `@jetbrains/ring-ui-built/components/button/button`.

## Dev loop

- `npm run dev` — Vite dev server on `:9000` with HMR; use when iterating on UI.
- `npm run watch` — auto-uploads on rebuild, but **no** hot reload; refresh the YouTrack page.
- `npm run build && npm run upload-local` — manual production build + upload (`npm run update` does both).