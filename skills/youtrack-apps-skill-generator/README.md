# Workflow API Markdown generator

Generates the YouTrack workflow API Markdown reference from `workflowApi.json`, overwriting the existing generated files.

## 1. Prerequisites

- Node.js 24.12.0 or later.
- A generated `workflowApi.json` file.
- The skill Markdown file with the final `# API Reference` section to update.

## 2. Run

From the repository root:

```bash
npm --prefix skills/youtrack-apps-skill-generator run generate -- <path-to-workflowApi.json>
```

The generator overwrites the configured module and type Markdown files. It also removes stale generated files from
owned output folders but keeps hand-written API pages such as `async-functions.md` and `ctx.md`.

Optional flags:

- `--output-dir <dir>` changes where API Markdown files are overwritten.
- `--injections-dir <dir>` changes where injection Markdown files are read from.
- `--youtrack-version <version>` updates the skill metadata for a release build. The generator reads
  `metadata.version` from `SKILL.md`, increments its patch version, and writes `<version>` to
  `metadata.YouTrackVersion`.

```bash
npm --prefix skills/youtrack-apps-skill-generator run generate -- \
  <path-to-workflowApi.json> --youtrack-version <build-number>
```

## 3. Configure objects

Edit [config.ts](./src/workflow-api-markdown/config.ts).

The generator checks rules from top to bottom. Each rule matches a generated API object and defines how to handle it.

- `object`: which generated object to match.
- `position`: where to write the object and whether to link to it from the module page.
- `merge`: which objects to combine into one page.
- `split`: how to split a section into groups.
- `inject`: which Markdown file to insert into a section.
- `members`: whether to include inherited members.
- `referencedOn`: how to link references to an object.

Available object kinds:

```ts
module
function
type
constructor
method
property
object-property
callback
owned-typedef
```

The matcher works with normalized API objects rather than raw JSDoc records. For example, it matches a raw JSDoc `function` owned by `Connection` as a `method` with `owner: "Connection"`.

Example:

```ts
{
  object: { kind: "method", module: "http", owner: "Connection" },
  split: {
    methods: [
      { title: "Methods", excludeNameSuffix: ["Async", "Sync"] },
      { title: "Async Methods", nameSuffix: "Async" },
      { title: "Sync Methods", nameSuffix: "Sync" },
    ],
  },
  inject: [{ into: "Async Methods", file: "inject-async-http.md" }],
}
```

## 4. Customize the output

Eta templates in `templates/` control the generated Markdown layout:

- `module.md.eta` renders module pages.
- `type.md.eta` renders type and merged-type pages.
- `api-reference.md.eta` renders the generated API reference in `SKILL.md`.
- `partials/` contains reusable layouts for contents, constructors, properties, methods, parameters, returns,
  examples, and related links.

The generator passes structured API models to these templates. Parsing, configuration rules, filenames, anchors,
escaping, metadata updates, and file cleanup remain in TypeScript.

## 5. Add injections

Add hand-written Markdown snippets to `resources/injections/`.

Then reference the file from a rule:

```ts
inject: [{ into: "Async Methods", file: "inject-async-http.md" }]
```

The `into` value must match the generated section title.
