---
name: youtrack-app-builder
description: Use when developing, debugging, or reviewing YouTrack apps, including manifests, widgets, workflows, HTTP handlers, settings, extension properties, and Enhanced DX TypeScript projects.
---

# YouTrack App Development

Use this skill for YouTrack app work in JavaScript or TypeScript projects.

## Workflow

1. Inspect `manifest.json`, `package.json`, and the project layout before changing behavior.
2. Prefer the app's existing scripts and generator commands over hand-built scaffolding.
3. Keep app-facing files inside the app source tree; avoid changing generated output unless the repo treats it as source.
4. Validate the manifest and run the smallest relevant test or build script after edits.

## Project Shapes

- Basic apps usually have `backend.js`, widget directories, `manifest.json`, and optional `settings.json`.
- Enhanced DX apps set `enhancedDX` in `package.json` and usually keep backend routes in `src/backend/router/<scope>/<route>/<METHOD>.ts`.
- Widgets normally live under `src/widgets/<key>/` in Enhanced DX apps or under a widget-specific directory in basic apps.
- Settings schema files are JSON Schema documents, commonly `src/settings.json` or `settings.json`.
- Extension properties are declared in `src/entity-extensions.json` for Enhanced DX apps.

## Generator Commands

When `@jetbrains/create-youtrack-app` is available, prefer these commands for new scaffolded pieces:

```bash
npx @jetbrains/create-youtrack-app widget add
npx @jetbrains/create-youtrack-app settings init
npx @jetbrains/create-youtrack-app settings add
npx @jetbrains/create-youtrack-app extension-property add
npx @jetbrains/create-youtrack-app http-handler add
```

Enhanced DX projects may also expose local scripts such as `npm run generate` or `npm run g`; use those when the package scripts define them.

## Implementation Notes

- Check valid widget extension points and permission keys against the local templates or generated types when present.
- For HTTP handlers, preserve the scope segment (`global`, `project`, `issue`, `article`, or `user`) and method filename (`GET.ts`, `POST.ts`, `PUT.ts`, `DELETE.ts`).
- Keep request and response types close to handlers and preserve any `@zod-to-schema` annotations already used by the project.
- For workflows, follow YouTrack scripting API conventions and keep exported rule declarations explicit.
- Do not invent manifest keys; match nearby entries or the YouTrack app schema used by the project.

## Verification

Use the project's own scripts first:

```bash
npm run lint
npm run build
npm test
```

If those are too broad, run the package-level or file-level command that exercises the changed app surface.
