# Widgets — extension points, config & visibility

Language-neutral. A widget's `manifest.json` entry is the same shape whether the app is `--type ts` or `--type js`. The React component differs by language (`references/typescript.md` / `references/javascript.md`); everything below does not.

## Manifest entry

The top-level `widgets` array is **optional** — omit it entirely for a backend-only app (an empty `[]` fails validation: *"widgets must NOT have fewer than 1 items"*). Each widget is one object in `manifest.json` `widgets[]`:

```json
{
  "key": "my-panel",
  "extensionPoint": "ISSUE_BELOW_SUMMARY",
  "indexPath": "my-panel/index.html",
  "name": "My Panel",
  "iconPath": "my-panel/widget-icon.svg",
  "description": "…",
  "permissions": ["READ_ISSUE"],          // optional — see visibility
  "expectedDimensions": { "width": 400, "height": 300 }  // optional
}
```

Fields (per the [App Manifest reference](https://www.jetbrains.com/help/youtrack/devportal-apps/app-manifest.html)):

| Field | Required? | Notes |
|---|---|---|
| `key` | **required** | Unique id, `^[a-z][a-z0-9-]*$`. Also the folder name under `src/widgets/`. |
| `extensionPoint` | **required** | WHERE it renders (catalog below). Wrong/unsupported value → widget silently invisible, no error. |
| `indexPath` | **required** | Entry HTML, relative to the widget folder. |
| `name` | optional | User-friendly name, unique within the app. |
| `description` | conditional | **Required** for `HELPDESK_CHANNEL`; optional otherwise. |
| `iconPath` | conditional | **Required** for `HELPDESK_CHANNEL`; optional for `*_OPTIONS_MENU_ITEM`. Relative to the widget folder. |
| `permissions` | optional | Permission-gated visibility — see below. |
| `guard` | optional | A JS predicate; the widget shows only when it returns `true`. Manifest-level conditional visibility (the generator does **not** emit it). |
| `showHeader` | optional | Boolean; supported for the menu-item extension points. |
| `settingsSchemaPath` | optional | Settings schema for `MARKDOWN` widgets. |
| `expectedDimensions` | optional | `{ width, height }` sizing hint. **Not** for `MARKDOWN` / `DASHBOARD_WIDGET`. |
| `defaultDimensions` | optional | Sizing for `MARKDOWN` / `DASHBOARD_WIDGET` only. |

## Extension points (the catalog)

17 official values. "Where it renders" essentials — no need to open the docs:

| Value | Where it renders |
|---|---|
| `MAIN_MENU_ITEM` | Separate app page, linked from the main navigation menu. |
| `ADMINISTRATION_MENU_ITEM` | Page with its own item in the administration menu. |
| `DASHBOARD_WIDGET` | A dashboard tile. |
| `ISSUE_BELOW_SUMMARY` | In an issue, below the summary. |
| `ISSUE_ABOVE_ACTIVITY_STREAM` | In an issue, above the activity stream. |
| `ISSUE_FIELD_PANEL_FIRST` | In an issue, above the custom field panel. |
| `ISSUE_FIELD_PANEL_LAST` | In an issue, below the custom field panel. |
| `ISSUE_OPTIONS_MENU_ITEM` | Item in the issue toolbar that invokes the widget. |
| `ARTICLE_BELOW_SUMMARY` | In an article, below the title. **(generator won't emit — add by hand)** |
| `ARTICLE_ABOVE_ACTIVITY_STREAM` | In an article, above the activity stream. |
| `ARTICLE_OPTIONS_MENU_ITEM` | Item in the article toolbar that invokes the widget. |
| `PROJECT_SETTINGS` | A separate tab in a project's settings. |
| `PROJECT_TAB` | A separate tab on the project page (project sidebar). **(generator won't emit — add by hand)** |
| `USER_CARD` | In the user card shown on hovering a username in an issue or article. |
| `USER_PROFILE_SETTINGS` | A separate tab in the user profile. |
| `HELPDESK_CHANNEL` | An extra ticket-handling channel. Helpdesk projects only. |
| `MARKDOWN` | Rich-text areas (descriptions, articles, comments). |

17 official values (see [Extension Points for Widgets](https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-extension-points.html)). The **page-level** points — `MAIN_MENU_ITEM`, `ADMINISTRATION_MENU_ITEM`, `PROJECT_TAB`, `PROJECT_SETTINGS`, `HELPDESK_CHANNEL`, `USER_PROFILE_SETTINGS` — fill the available page space when `expectedDimensions.height` is not set.

The `widget` generator validates a **15-value subset** — it rejects `ARTICLE_BELOW_SUMMARY` and `PROJECT_TAB`. For those two, add the widget entry to `manifest.json` by hand (shape above).

## Conditional visibility (permission-gated)

A widget is shown to everyone by default. Two manifest-level mechanisms restrict it:

- **`permissions`** — an array; only users holding **all** listed permissions see the widget. This is the conditional-visibility mechanism the generator emits.
- **`guard`** — a JS predicate that must return `true` for the widget to show. Finer-grained than permissions, but the generator does **not** emit it — add it to `manifest.json` by hand.

```json
"permissions": ["READ_ISSUE", "UPDATE_ISSUE"]
```

- Omit `permissions` (or empty array) → visible to everyone.
- The strings are YouTrack permission keys (the generator offers ~50, e.g. `READ_ISSUE`, `UPDATE_ISSUE`, `READ_ARTICLE`, `READ_USER`; full set in `_templates/consts.js`).
- Visibility is enforced by YouTrack, not by widget code — don't reimplement it in React.

## Generating a widget

```bash
npm run g -- widget --key my-panel --extension-point ISSUE_BELOW_SUMMARY
npm run g -- widget --key admin-page --extension-point MAIN_MENU_ITEM --name "Admin Page"
# optional: --description "…" --permissions READ_ISSUE,UPDATE_ISSUE --width 400 --height 300
```

Creates `src/widgets/<key>/` and injects the entry into `manifest.json`. `--permissions` sets conditional visibility; `--width`/`--height` set `expectedDimensions`. Command is identical for both languages; the emitted component differs (see the language ref).

> Caveat: `--width`/`--height` always write `expectedDimensions`. For `MARKDOWN` and `DASHBOARD_WIDGET` the manifest reference reserves `defaultDimensions` instead — swap the key by hand for those two.