# Style Guidelines

## Table of Contents

- [0. Platform facts that constrain every widget](#0-platform-facts-that-constrain-every-widget)
- [1. Design tokens (closed sets — Ring UI values, not approximations)](#1-design-tokens-closed-sets--ring-ui-values-not-approximations)
  - [Spacing](#spacing)
  - [Component sizing](#component-sizing)
  - [Color tokens](#color-tokens)
  - [Corner radius (also from `design-tokens.json`)](#corner-radius-also-from-design-tokensjson)
  - [Type scale](#type-scale)
  - [Elevation](#elevation)
- [2. Layout rules](#2-layout-rules)
- [3. Motion / state rules](#3-motion--state-rules)
- [4. Component allowlist (Ring UI)](#4-component-allowlist-ring-ui)
- [5. Extension-point context (pick this before designing anything)](#5-extension-point-context-pick-this-before-designing-anything)
- [6. Verification checklist (consumed by the critique pass)](#6-verification-checklist-consumed-by-the-critique-pass)

Suggested design princinples when designing widgets.

---

## 0. Platform facts that constrain every widget

- Widgets run in a **sandboxed iframe**. YouTrack's own frontend CSS does
  **not** leak into widget content — nothing is inherited for free.
- The house style is achieved by **installing `@jetbrains/ring-ui-built` in the
  app and importing its built stylesheet and components**, not by approximating
  YouTrack's look with custom CSS. Ensure it is listed in the app's
  `package.json` (add it with `npm install @jetbrains/ring-ui-built` when
  absent); do not load it from a CDN at runtime. Standard stylesheet import:
  ```ts
  import '@jetbrains/ring-ui-built/components/style.css';
  ```
- Widget size is dictated by its **extension point**, not by the widget's own
  CSS — some are small embedded panels, some fill the page. Design for the
  extension point you're targeting (see §5), don't assume canvas size.

---

## 1. Design tokens (closed sets — Ring UI values, not approximations)

### Spacing
```yaml
spacing_scale: [4, 8, 12, 16, 20, 24, 28, 32, 48, 64]
# base rhythm is multiples of 8 (8, 16, 24, 32, 48, 64);
# 4-based in-between values (4, 12, 20, 28) only when 8-steps are too coarse
```
- Never invent a spacing value outside this scale.
- Give UI room to breathe — prefer the next step up over a cramped fit.
- Use *unequal* spacing to communicate grouping: elements that belong together
  sit closer than elements that don't. Uniform spacing between unrelated
  elements is a defect, not a safe default.

### Component sizing
```yaml
control_heights: [24, 28]   # px — small / medium
# Buttons, text fields, select fields, switchers only come in these two sizes.
# Pick ONE per widget and never mix small + medium in the same widget.
```

### Color tokens
- Source: the live, Figma-generated `design-tokens.json` from the
  [Ring UI source repository](https://github.com/JetBrains/ring-ui). The widget consumes
  the corresponding CSS variables from `@jetbrains/ring-ui-built`; never use
  hard-coded hex values. Both a light and dark value are defined for every
  token, so the dark theme works automatically.
- Treat the Ring UI source token file as authoritative and pull additional
  tokens from it on demand rather than guessing intermediate shades.

- Use the token/CSS-variable name in code, not a copy-pasted hex — dark theme
  is a paired value per token, and hardcoding breaks it.
- **Error / warning / success have fixed, distinct hues** (red / yellow /
  green family respectively — confirmed distinct in the live token file, unlike
  the older docs page). Never repurpose one for a different meaning or for
  plain decoration.
- Minimum text contrast target: **4.0:1** as a floor, 4.5:1 (WCAG AA)
  preferred. Exception: incidental/decorative text, and text on disabled
  components.

### Corner radius (also from `design-tokens.json`)
```yaml
corner_radius: {XS: 2, S: 4, M: 8, L: 12, XL: 16, "2XL": 20, "3XL": 24}  # px
```
Same set for light and dark theme (radius doesn't change with theme). Use
these instead of guessing a border-radius value.

### Type scale
```yaml
type_scale:
  - { name: "h1",        size: 24, weight: bold,    line_height: 28, usage: "main headings" }
  - { name: "h2",        size: 20, weight: regular,  line_height: 24, usage: "secondary headings" }
  - { name: "h3",        size: 16, weight: bold,     line_height: 22, usage: "tertiary headings" }
  - { name: "h4",        size: 12, weight: regular,  line_height: 18, usage: "quaternary heading, capitalized, +2 letter-spacing" }
  - { name: "h4_bold",   size: 12, weight: bold,     line_height: 18, usage: "emphasized h4, capitalized, +2 letter-spacing" }
  - { name: "body",      size: 14, weight: regular,  line_height: 20, usage: "standard UI text: lists, menus, buttons" }
  - { name: "body_bold", size: 14, weight: bold,     line_height: 20, usage: "emphasized standard text" }
  - { name: "label",     size: 12, weight: regular,  line_height: 16, usage: "labels, descriptions — grey (ring_secondary_color) by default" }
  - { name: "text_block",size: 16, weight: regular,  line_height: "24 if width>400px else 22", usage: "long-form text blocks" }
```
- System fonts, not custom webfonts.
- Never underline for emphasis — underline means link, exclusively. Use bold.
- Keep heading order consistent (can skip levels, can't invert them).
- Line length target for continuous text: 60–100 characters.
- Left-align continuous text; never justify/center/right-align body copy.

### Elevation
Not present in `design-tokens.json` as a numeric shadow scale. Pull the actual
box-shadow values from the component you're using in Storybook/source rather
than guessing, and record them here once confirmed.

---

## 2. Layout rules

- Minimum interactive target height: use one of `control_heights` (24 or
  28px) — never smaller.
- Panel/content padding: pick from `spacing_scale`, prefer 12/16/24.
- Respect the **extension point's actual size class** (see §5) — a
  `USER_CARD` widget and a `MAIN_MENU_ITEM` page are different canvases; don't
  design one as if it were the other.
- In YouTrack, page-level widgets fill available page space by
  default when `expectedDimensions.height` isn't set in the manifest — account
  for this when the widget is a page rather than an embedded panel.

## 3. Motion / state rules

- Transition duration: `[100ms, 150ms, 250ms]` (Ring UI default motion scale —
  verify against the specific component if unsure).
- Every async Host API call (`host.fetchYouTrack`, `host.fetchApp`) needs a
  defined loading affordance — Ring UI `LoaderInline` or `Loader`, not a blank
  panel.
- Every call that can fail needs a defined error affordance — surface via
  `host.alert()` for transient errors, or an inline error state (using
  `ring_error_color` / `ring_error_container_light_color` tokens) for
  persistent ones. Never dump a raw error string into the DOM.

---

## 4. Component allowlist (Ring UI)

| Situation | Use | Don't use |
|---|---|---|
| Any clickable action | `Button` (`@jetbrains/ring-ui-built/components/button/button`) | raw `<button>` / styled `<a>` |
| Toast / transient feedback | `alertService` (`alert-service/alert-service`) via `host.alert()` | custom toast component |
| Text input | `Input` / `TextField` | raw `<input>` |
| Dropdown / single choice from list | `Select` (Select Field) | custom `<select>` styling |
| Multi-option toggle in a row | `TabBar` | manually styled button row |
| Boolean setting | `Checkbox` or `Toggle` (Switcher) — pick one and stay consistent | mixing checkbox and switcher for equivalent settings |
| Single choice among 2–5 options, all visible | `RadioButton` group | `Select` when all options should be visible at once |
| Status/category chip | `Label` | colored `<span>` with manual background |
| Loading state | `LoaderInline` (inline) or `Loader` (blocking) | spinner built from scratch |
| Contextual help on hover | `Tooltip` | native `title` attribute for anything beyond trivial text |
| Validation message on a field | `ErrorBubble` | inline red text with no anchor to the field |
| Date input | `DatePicker` | raw `<input type="date">` |
| List of items with icons/actions | `Rich List` pattern | ad hoc flex list |
| Grouped settings form | `Form` pattern | free-floating labeled inputs with no shared structure |
| App-level page chrome | `Header Bar` pattern | reinventing a header from a `div` |
| Secondary navigation area | `Sidebar` pattern | custom nav rail |
| Tabular data | `Data Table` pattern | HTML `<table>` with hand-rolled styling |
| Modal confirmation/input | `Dialog` pattern | custom overlay `div` |

---

## 5. Extension-point context (pick this before designing anything)

| Extension point | Scope | Design implication |
|---|---|---|
| `ISSUE_FIELD_PANEL_FIRST` / `_LAST` | Issue | Small embedded panel, above/below custom fields — compact, sidebar-width |
| `ISSUE_ABOVE_ACTIVITY_STREAM` / `ISSUE_BELOW_SUMMARY` | Issue | Wider main-column panel, can carry richer content |
| `ARTICLE_ABOVE_ACTIVITY_STREAM` / `ARTICLE_BELOW_SUMMARY` | Article | Same idea, article context |
| `ISSUE_OPTIONS_MENU_ITEM` / `ARTICLE_OPTIONS_MENU_ITEM` | Issue/Article | Invoked on demand from a menu — likely a `Dialog`, not a persistent panel |
| `DASHBOARD_WIDGET` | Global | Small card on a dashboard grid — assume limited height, no page chrome |
| `MAIN_MENU_ITEM` / `ADMINISTRATION_MENU_ITEM` | Global | Full page — use `Header Bar` / `Sidebar` patterns, page fills available space by default |
| `PROJECT_SETTINGS` / `USER_PROFILE_SETTINGS` | Project/User | Settings-tab context — use `Form` pattern |
| `USER_CARD` | User | Very small popover-like area — minimal content only |
| `HELPDESK_CHANNEL` | Project | Ticket-channel-shaped UI, not a generic panel |
| `MARKDOWN` | Global | Embedded inline in rich text — must degrade gracefully at small, variable widths |

---

## 6. Verification checklist - suggested

- [ ] Ring UI stylesheet is imported; no YouTrack host CSS is assumed to leak in
- [ ] All spacing values are members of `spacing_scale`
- [ ] All colors reference a Ring UI token name (from `design-tokens.json`), no hard-coded hex
- [ ] Corner radius used are members of `corner_radius` (2/4/8/12/16/20/24)
- [ ] Only one control height (24 or 28) used throughout the widget
- [ ] All text uses a defined `type_scale` entry; no more than 2–3 sizes visible at once
- [ ] No underline used for emphasis (underline reserved for links)
- [ ] Text contrast ≥ 4.0:1 (decorative/disabled text exempted)
- [ ] Red/yellow/green used only for error/warning/success, never decoratively
- [ ] Every async Host API call has a `LoaderInline`/`Loader` state
- [ ] Every failable call has a defined error affordance (alert or inline, using error tokens)
- [ ] No more than 1 primary-style button visible at once in a given panel
