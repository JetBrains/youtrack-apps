---
name: youtrack-app-frontend
description: Use when working on a YouTrack app scaffolded by @jetbrains/create-youtrack-app. Orients you to the whole app (backend + frontend) so you touch the right half, then covers the frontend in depth — React widgets, extension points, the host handshake, and calling the backend. On a backend-only task it tells you to leave the frontend files alone. Language specifics (TypeScript enhanced-dx vs JavaScript vite-app) live in references/.
---

# YouTrack App Frontend

A YouTrack app has two halves that build separately. This skill orients you to both, then goes deep on the **frontend**: one or more **widgets** — React apps rendered inside a live YouTrack instance at a declared **extension point**. A widget is not a standalone SPA: no client router, no `ReactDOM.render` you own, no localhost render. It only appears once uploaded to YouTrack.

## Table of contents

1. When this skill applies (app structure & gate)
2. Mental model
3. CLI usage — when / how / why
4. Common patterns
5. Common pitfalls (vs a standard React app)
6. Language specifics (TypeScript / JavaScript)

## 1. When this skill applies

This skill covers the whole app for orientation, then the frontend in depth. Use it on any create-youtrack-app project — **including backend-only ones**, so you know which files to leave untouched.

An app has two halves:

- **Backend** (`src/backend/`) — runs in YouTrack's engine, has direct entity access. Made of: **handlers** (REST routes) · **workflows** · **webhooks** · **SLA** · **AI tools** · **scheduled jobs**.
- **Frontend** (`src/widgets/`) — React widgets rendered in YouTrack pages, calling the backend. **This is the skill's focus.**

**The gate — before touching any frontend file, decide if the task needs a UI surface:**

| Task signals | Needs a widget? | Action |
|---|---|---|
| panel, dashboard, settings UI, issue/article surface, button in YouTrack | **Yes** | Continue with this skill. |
| workflow, scheduled job, webhook, REST handler, SLA, AI tool, "backend only" | **No** | Do **not** open `src/widgets/` or `index.html`. The scaffold may include a sample widget — leave it untouched, or remove its `src/widgets/<key>/` folder and its `manifest.json` `widgets[]` entry. Do the backend work; skip the frontend files entirely. |

Backend-only apps are legitimate. Not every app has a widget. Don't invent one because the scaffold shipped a sample. When creating a new app you already know is backend-only, scaffold it with `--backend-only` (§3) so no widget ships in the first place.

## 2. Mental model

- **Widget** — self-contained React app under `src/widgets/<key>/`; one Vite entry each.
- **Extension point** — WHERE it renders (declared in `manifest.json`). Wrong point → silently invisible, no error. Full catalog + widget config → `references/widgets.md`.
- **Host** — bridge to YouTrack, from `await YTApp.register()`. All backend/YouTrack calls go through it.
- **manifest.json** — app descriptor; its `widgets[]` array wires each key to `indexPath`, `extensionPoint`, icon.
- **Backend call surface** — how a widget reaches the backend. Differs by language (typed `@/api` client on TS; raw `host.fetchApp` on JS) — see §6.

## 3. CLI usage — when / how / why

**Scaffold a new app** (non-interactive; `--name` bypasses all prompts, agent/CI-friendly):

```bash
npx @jetbrains/create-youtrack-app --name my-app --type ts
```

- **why `--type`:** `ts` → Enhanced DX (file-based routing, type-safe `@/api` client, sample widget). `js` → basic vite-app (flat `src/backend.js`, no generated client, no sample widget). The two are structurally different — pick per §6.
- **`--backend-only`** (ts only): scaffold a widget-less app — no `src/widgets/`, no `index.html`, `manifest.json` with no `widgets` key, frontend-free build scripts. Use when the app has no UI at all (pure workflows / handlers / rules). No-op for `--type js` (already frontend-less).
- Optional: `--title`, `--description`, `--vendor`, `--vendor-url`, `--no-install`.
- `--name` must match `^[a-z][a-z0-9-]*$`. Bare invocation (no `--name`) stays interactive.

**Add a widget** to an existing app (generator injects the manifest entry):

```bash
npm run g -- widget --key my-panel --extension-point ISSUE_BELOW_SUMMARY
```

`--key` must be `^[a-z][a-z0-9-]*$` and unique. Full flag set, the extension-point catalog, and the generator's subset caveat → `references/widgets.md`.

After scaffolding, the app's own `AGENTS.md` is the source of truth for in-repo details.

## 4. Common patterns

Creation is only one use. These are high-level; code per language in §6.

- **Add a widget to an existing app** — run the generator (above), pick the right extension point, edit the generated `app.tsx`. Don't hand-build the folder if the generator covers the point.
- **Fix / debug a widget** — symptom → cause: invisible after upload = wrong/unsupported `extensionPoint` or missing manifest entry (no error thrown); `api.x.y` undefined (TS) = stale generated types, rebuild backend; `host` errors = handshake in the wrong place. See §5.
- **Wire a widget to the backend** — TS: ensure the handler exists, rebuild backend so `@/api` gains the route, call `api.scope.path.METHOD(...)`. JS: call `host.fetchApp('<path>', ...)` matching a `backend.js` endpoint. Surfacing extension properties / app settings is a backend concept — a handler returns them, the widget reads them from the response (TS detail in §6).
- **Restyle a widget** — use **Ring UI** (`@jetbrains/ring-ui-built`) for components: native YouTrack look and dark mode for free. Don't roll your own design system.

## 5. Common pitfalls (vs a standard React app)

- **Widget invisible after upload** → wrong/unsupported `extensionPoint` or missing manifest entry. No error is thrown — check `manifest.json` first.
- **Not a standalone SPA** → no client-side router, no localhost render, no `ReactDOM.render` you own. The widget only lives inside YouTrack.
- **`host` used before ready** → keep `await YTApp.register()` at module scope, never inside a hook.
- **Editing generated files** → never edit generated API files by hand; they are overwritten on every backend build (TS only).
- **Stale types after a backend change** → rebuild the backend; don't rewrite the import.
- **No HMR in `watch`** → use the dev server for instant UI feedback (§6).

## 6. Language specifics

Widget config is shared across both languages:

- **Widgets (any type)** → `references/widgets.md` — extension-point catalog with "where it renders", the generator's 15-value subset, permission-gated visibility, dimensions.

The frontend↔backend contract and file layout differ by scaffold type. Read the one matching the app:

- **TypeScript (`--type ts`, Enhanced DX)** → `references/typescript.md` — file-based routing, the `@/api` type-safe client, `.tsx` widget anatomy, extension properties & settings, build order, dev loop.
- **JavaScript (`--type js`, vite-app)** → `references/javascript.md` — flat `src/backend.js`, `host.fetchApp`, no generated client, manual widget wiring in `vite.config`, dev loop.

Not sure which? TS apps have `src/backend/router/` and `src/api/`; JS apps have a single `src/backend.js` and an empty `widgets[]` in a freshly scaffolded `manifest.json`.