---
name: Rise Campus — web-v2
description: Vercel's own Geist design tokens, applied exactly, for a multi-campus school admin UI.
colors:
  obsidian: "#171717"
  paper-white: "#fafafa"
  pure-white: "#ffffff"
  hairline: "#ebebeb"
  stone: "#666666"
  terminal-green: "#297a3a"
  focus-blue: "oklch(0.6 0.19 255)"
  signal: "oklch(0.72 0.16 70)"
  danger: "oklch(0.55 0.21 25)"
typography:
  title:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "20px"
    fontWeight: 450
    lineHeight: "28px"
  heading:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: "20px"
  body:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: "16px"
  numeric:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "20px"
rounded:
  nav: "2px"
  control: "6px"
  pill: "9999px"
  overlay: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.obsidian}"
    textColor: "{colors.pure-white}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
  button-primary-hover:
    backgroundColor: "{colors.obsidian}"
  status-dot:
    textColor: "{colors.obsidian}"
    typography: "{typography.body}"
  stat-strip-cell:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.stone}"
    rounded: "{rounded.control}"
    padding: "16px"
  page-header:
    textColor: "{colors.obsidian}"
    typography: "{typography.title}"
    padding: "0 0 16px 0"
  sidebar-nav-item:
    textColor: "{colors.obsidian}"
    rounded: "{rounded.nav}"
    padding: "8px"
  data-table-row:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.obsidian}"
    padding: "8px 12px"
---

# Design System: Rise Campus — web-v2

## 1. Overview

**Creative North Star: "The Geist Ledger"**

This system uses Vercel's own extracted Geist design tokens verbatim — exact hex values the
user supplied directly from a scrape of vercel.com — not a re-derived approximation of them.
That distinction mattered in practice: two earlier passes on this project (a tinted
blue-slate palette, then an oklch-approximated monochrome one) both still read as "a
recolored admin template" on review. Matching the literal source values, plus the
architecture logic behind them (a hairline-ring border technique instead of a plain border;
radius that varies by role — 2px for nav, 6px for cards/buttons, full pill for status; one
saturated color with exactly one job), is what made the difference legible.

The source is Vercel's *marketing* site, so not everything in it transfers to a dense,
multi-hour records tool — hero type at 56-64px, CLI-output panels, the triangle glyph, and
logo strips are marketing-register devices this product-register app has no use for (see
`PRODUCT.md`'s Register field). What transfers, and is applied here exactly: the palette,
the radius/shadow logic, the type-weight discipline (headings at 400-450, never bold), and
the mono-uppercase "eyebrow" convention — narrowed to sidebar group labels only, where
Vercel's own settings UI uses exactly this device.

This system explicitly rejects: any tinted "brand" primary color (two prior discarded
attempts on this project); colored badge/pill fills for status (replaced by a small dot);
soft-shadow rounded cards as the default surface language; an eyebrow label above every
page-content section (vs. the bounded sidebar-only use here); a single border-radius applied
regardless of an element's role; gradient decoration anywhere in the product UI.

**Key Characteristics:**
- Primary is Obsidian (`#171717`), not pure black, not any hue — pure `#000` is reserved for
  icon/glyph fills only, per the source spec's own rule.
- Exactly one saturated color exists: a vivid blue, reserved for the keyboard-focus ring.
- Status (student status, fee status, campus health) is a small colored dot plus plain text.
- Radius is a role signal: nav items get the tightest radius (2px) of anything in the
  system, cards/buttons/inputs get 6px, status pills get a full round.
- Three page *shapes* exist, not one shell reused everywhere: a list page is full-width
  table + toolbar; a dashboard is tiered (numbers → trend+attention side by side →
  full comparison table); a detail page is a sticky identity rail beside tabbed content.
  See Components below and `DESIGN_SYSTEM.md`'s Layout section for the full reasoning.

## 2. Colors

A true monochrome palette — one neutral ramp from Obsidian to Paper White — plus exactly
one saturated color used for exactly one job. Values below are the source's own names.

### Primary
- **Obsidian** (`#171717`): the only structural color. Primary buttons, active sidebar-item
  text, page titles, list markers. The source spec's own note: near-black on purpose, so it
  never reads as "harsh" the way pure `#000` text would at UI scale.

### Secondary (the one saturated color)
- **Focus Blue** (`oklch(0.6 0.19 255)`): the keyboard-focus ring, full stop. Not in the
  source's marketing-page extraction (a static marketing site has no form/focus states to
  scrape) — carried over from Vercel's actual known dashboard/app behavior, since this is an
  app-UI concern the marketing scrape couldn't cover. **The Single Job Rule.** If Focus Blue
  is used for anything other than a focus ring, it's the wrong color.

### Tertiary (dot-indicator vocabulary)
- **Terminal Green** (`#297a3a`): the source palette's one accent — there, "a supporting
  accent for links/tags, not a status color." Adapted here as exactly a status color (paid /
  present / approved), since unlike a marketing site, this product genuinely needs one, and
  the source's own instinct (sparing, dot-only, never a fill) transfers even though the
  literal role doesn't.
- **Signal** (`oklch(0.72 0.16 70)`, muted amber) and **Danger** (`oklch(0.55 0.21 25)`,
  red): not present in the source palette at all (its own "0% colorfulness" rule reflects a
  marketing site with no fee-status or attendance concept to encode) — added here as the
  honest minimum semantic set a records tool needs (due/pending, overdue/rejected). Danger
  also colors destructive-action buttons and their Alert Dialog confirmation.

### Neutral
- **Paper White** (`#fafafa`): page canvas, one step darker than Pure White.
- **Pure White** (`#ffffff`): panels, cards, table containers, the sidebar surface.
- **Hairline** (`#ebebeb`): the border color inside the "hairline card" shadow technique
  (see Elevation) — not usually applied as a plain CSS border, though it is the value used.
- **Stone** (`#666666`): secondary text, meta rows, timestamps, helper copy — the source's
  own "muted captions, helper text" role, verbatim.

### Named Rules
**The Verbatim Rule.** Every color in this palette is either a literal value from the
source extraction or an explicitly documented, minimal extension where the source had no
answer (Focus Blue, Signal, Danger). Nothing here is "inspired by" or "in the spirit of" the
source — it either is the source's value, or it's labeled as an addition and why.

## 3. Typography

**Body Font:** Geist Sans (with `ui-sans-serif, system-ui` fallback)
**Label/Mono Font:** Geist Mono (with `ui-monospace, monospace` fallback)

**Character:** One neutral, highly legible grotesk carries every word; Geist Mono is a
functional register-switch for anything tabular or a nav-group label, not a second
decorative voice used freely.

### Hierarchy
- **Title** (450, 20px, 28px line-height, tracking -0.01em): page titles, inside the shared
  Page Header. Weight 450, not 600/700 — the source spec's own explicit rule: "never bold
  headlines." At hero scale (56-64px) the source uses -0.06em tracking; at this compact
  20px scale that ratio would crush legibility, so tracking is a much lighter -0.01em —
  the *principle* (tight, confident, not loose) transfers, the exact hero ratio doesn't.
- **Heading** (600, 15px, 20px line-height): section/card headings within a page — small
  enough that 600 (not 450) is needed to read as a heading at all against 13.5px body text.
- **Label / Eyebrow** (Geist Mono, 500, 11px, 16px line-height, 0.071em tracking, uppercase,
  Stone): the source's own "Eyebrow Label" component, applied *only* to sidebar group
  labels — never stamped above page-content sections, which would be the generic-AI tell
  this system otherwise avoids.
- **Body** (400, 13.5px, 20px line-height): table cells, form labels, running text.
- **Meta** (400, 12px, 16px line-height, Stone): timestamps, helper text, row counts.
- **Numeric** (Geist Mono, 500, 13px, 20px line-height, tabular-nums): money, admission
  numbers, percentages, dates-in-tables — anything scanned down a column.

### Named Rules
**The Register-Switch Rule.** The only signal distinguishing "a number to compare" from "a
word to read" is the font switching from Geist Sans to Geist Mono — no bolding, coloring, or
sizing layered on top of that switch by default.

## 4. Elevation

Flat by default. Structure comes from the "hairline card" technique — two stacked
`box-shadow` rings, the source's own signature move for a border that survives any
background — never a plain CSS border and never a drop shadow, for anything still living in
the normal page flow. Shadow is reserved for content that detaches from the page: Sheet,
Dialog, Alert Dialog, Popover, Dropdown Menu, Tooltip, Combobox/Command.

### Shadow Vocabulary
- **hairline** (`0 0 0 1px rgba(0,0,0,0.08), 0 0 0 2px var(--background)`): the source's own
  exact value, used on every card, the Stat Strip panel, and the Data Table container.
- **overlay** (`0 8px 24px rgba(0,0,0,0.12)`): Sheet, Dialog, Alert Dialog — genuine floating
  content, not in the source's marketing-page extraction (added for this app's own overlay
  needs, which a static marketing page doesn't have).
- **popover** (`0 4px 16px rgba(0,0,0,0.10)`): Popover, Dropdown Menu, Combobox/Command,
  Tooltip.

### Named Rules
**The Floats-Or-It-Doesn't Rule.** An element still occupying its own row/column in the
normal layout gets the hairline-ring treatment, never a shadow, regardless of how important
it is. Shadow is earned by leaving the document flow, not by significance.

## 5. Components

### Buttons
- **Shape:** 6px radius (`{rounded.control}`), the source's own `--radius-buttons` value.
- **Primary:** Obsidian background, Pure White text, 6px 10px padding — the source's
  "Filled Black Button," their strongest visual weight.
- **Focus:** a 3px Focus Blue ring on every interactive element — the one place the
  saturated accent is allowed to appear.
- **Ghost / Outline:** transparent or Pure White background, Hairline border via the same
  ring technique; every secondary action (Cancel, Clear filters, row-action triggers) uses
  this, never a second filled color — the source's "Ghost Outline Button."

### Status Dot (signature component)
A 6px solid circle plus plain-weight text, replacing colored badge/pill fills everywhere a
status appears (student status, fee status, campus fee-collection health) — matches
Vercel's own deployment-status convention (a fact about the row, not a decoration). Used as
a Popover trigger for quick-edit status fields (a chevron fades in on hover) and as a plain
read-only indicator elsewhere.

### Page Header (signature component)
Every page: title (Title scale, weight 450) + one-line description (Meta scale, Stone) on
the left, actions right-aligned, a 1px Hairline bottom border. Identical slot on every
screen — the fix for "every page invented its own title treatment."

### Three page shapes, not one shell reused everywhere
- **List** (Students): full-width `DataTable` behind one compound toolbar (search + Class +
  Section + Fee-status filters, AND-composed, plus column visibility) — nothing constrains
  width because the job is "show me the rows."
- **Dashboard** (Institute overview): tiered, not a flat stack — `StatStrip` (the numbers),
  then a 2:1 split of a trend chart beside a `NeedsAttentionPanel` (ranked by fee shortfall
  + pending admissions — "which campus needs me right now," a different question from the
  full comparison table underneath it, so it's a different component, not another table).
- **Detail** (Student detail): a sticky 280px identity rail (avatar, status, admission/
  campus/class facts, guardian contact) beside tabbed content (Overview/Attendance/Fees).
  The rail never changes when a tab does — identity is frame, not content.

### Data Table
Sortable headers (icon-only sort affordance), one toolbar row holding every filter control
plus the column-visibility menu, hairline row separators with no zebra striping, row actions
in a trailing icon-only Dropdown Menu, an `Empty` state when a filter combination returns
nothing.

### Inputs / Fields
- **Style:** Pure White background, Hairline border via the ring technique, 6px radius.
- **Focus:** border shifts to Obsidian plus the 3px Focus Blue ring.
- **Combobox:** replaces a plain Select for any list that can run into the hundreds
  (students, teachers, classes) — type-to-filter via Command.

### Navigation
Sidebar (shadcn `Sidebar` primitive, Pure White surface): grouped by role-relevant module,
group labels use the Eyebrow Label treatment (Geist Mono, uppercase, 11px). Nav items use
`2px` radius — the tightest in the system, per the source's own `--radius-nav` — and active
state is a light neutral-gray fill with Obsidian text, never a filled black block, matching
Vercel's own settings-sidebar active state exactly. Collapses to icon-only with tooltips on
narrow viewports. Header carries the sidebar toggle, a campus-scope Combobox for scoped
roles, and the account menu.

## 6. Do's and Don'ts

### Do:
- **Do** use the literal source hex values (`#171717`, `#fafafa`, `#ffffff`, `#ebebeb`,
  `#666666`, `#297a3a`) rather than a re-derived approximation of them.
- **Do** apply radius by role: `2px` nav items, `6px` cards/buttons/inputs, full pill for
  status chips.
- **Do** build in-flow surfaces with the two-ring `box-shadow` hairline technique, not a
  plain `border` and not a drop shadow.
- **Do** reserve Focus Blue for the keyboard-focus ring only.
- **Do** use a Status Dot (colored dot + plain text) for any status field.
- **Do** give each page shape (list / dashboard / detail) the layout its own job needs —
  see the "Three page shapes" entry above — instead of reusing whichever shape is closest.
- **Do** set headings at weight 400-450, never 600-700.
- **Do** scope the mono-uppercase Eyebrow Label to sidebar group labels only.

### Don't:
- **Don't** approximate the source palette in oklch or any derived form when the exact hex
  is known — two earlier passes on this project made that mistake.
- **Don't** use a colored `border-left`/`border-right` stripe as a card or stat-cell accent.
- **Don't** fill a badge background with a status color; use a Status Dot instead.
- **Don't** default to a Dialog for a simple interaction just because it's the fastest
  component to reach for.
- **Don't** use a plain `<Select>` for any list that can run into the hundreds; use Combobox.
- **Don't** apply the same generic sidebar+header+stacked-cards shell to every page
  regardless of what that page's content actually needs.
- **Don't** stamp an Eyebrow Label above page-content sections — sidebar labels only.
- **Don't** put an icon on a Stat Strip entry; label and figure only.
