# Frontend — JavaScript (vite-app, `--type js`)

Specifics for apps scaffolded with `--type js`. The main flow and gate are in `../SKILL.md`. This template is the **basic** one — barebones on purpose, close to the raw YouTrack app SDK. If you want file-based routing and a typed client, that's the TypeScript path (`references/typescript.md`), not this one.

## What a fresh vite-app looks like

- **Backend** — a single flat file `src/backend.js` exporting `httpHandler.endpoints[]`. No `src/backend/router/`.
- **No generated API client** — there is no `src/api/`, no `@/api`, no `*Req`/`*Res` types, no Zod generation.
- **No sample widget** — `manifest.json` ships with **no** `widgets` key (an empty `widgets: []` fails validation) and there is no `src/widgets/` folder. Add the `widgets` array yourself when you add a widget.

## Backend shape

```javascript
// src/backend.js
exports.httpHandler = {
  endpoints: [
    {
      method: 'GET',
      path: 'debug',
      handle: function handle(ctx) {
        const requestParam = ctx.request.getParameter('test');
        ctx.response.json({ test: requestParam });
      }
    }
  ]
};
```

`ctx.request.getParameter(...)` / `ctx.response.json(...)` — see the [HTTP handlers reference](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html).

## Calling the backend from a widget — `host.fetchApp`

No typed client. Call the backend by its endpoint `path` through the host:

```typescript
const host = await YTApp.register();   // module scope, before render

const result = await host.fetchApp('backend/debug', { query: { test: '123' } });
// 'backend/debug' matches the endpoint path in src/backend.js
```

The path string is not type-checked — a typo fails at runtime, not build time. Keep the widget's path in sync with `backend.js` by hand.

## Adding a widget (manual wiring)

The `npm run g -- widget` generator still emits a `.tsx` widget and injects the manifest entry, but the vite-app frontend needs each widget wired in explicitly. When adding by hand:

1. Create `src/widgets/<key>/` with `index.html`, `index.tsx` (mounts `<App/>`), `app.tsx`, `app.css`, `widget-icon.svg`.
2. Register the widget's entry HTML in `vite.config.ts` under `build.rollupOptions.input` (the template leaves a `// List every widget entry point here` placeholder).
3. Add the widget to `manifest.json` `widgets[]` with `indexPath`, `extensionPoint`, and icon.

Extension-point catalog, manifest fields, and permission-gated visibility → `references/widgets.md` (language-neutral).

`vite.config.ts` already copies `widgets/**/*.{svg,png,jpg,json}` and `manifest.json` into `dist` via `viteStaticCopy`.

## Ring UI

Available (`@jetbrains/ring-ui-built` is a dependency) — use it for native look and dark mode, same as the TS path.

## Dev loop

```bash
npm run dev      # vite dev server
npm run build    # tsc, then: vite build if widgets exist, else copy backend.js+manifest+assets to dist; then youtrack-app validate dist
npm run upload   # youtrack-app upload dist
npm run pack     # zip dist for manual upload
```

`build` branches on whether any `src/widgets/*/index.html` exists: with widgets it runs `vite build` (bundles them — remember to wire each entry into `vite.config.ts` `rollupOptions.input`); with none it does a static-copy build so a backend-only js app still builds and validates.

## What's absent vs TypeScript (enhanced-dx)

| | vite-app (js) | enhanced-dx (ts) |
|---|---|---|
| Backend | flat `src/backend.js`, `httpHandler.endpoints` | file-based routing `src/backend/router/**` |
| Frontend→backend | `host.fetchApp('<path>')`, untyped | `api.scope.path.METHOD()`, typed |
| Generated types | none | `src/api/*` (rebuild backend first) |
| Sample widget | none (no `widgets` key) | pre-scaffolded |
| Widget wiring | manual (`vite.config` input + manifest) | generator handles it |

If the task wants type-safety or a richer backend, prefer scaffolding a new app with `--type ts` rather than retrofitting the js template.