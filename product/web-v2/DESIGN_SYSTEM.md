# web-v2 Design System

This is a fresh design pass for the rebuild — it does not inherit `product/web`'s palette,
type choices, or component defaults. `product/web` stays the reference for *behavior*
(what a screen must do), never for *how it should look*.

**Design language: Vercel's Geist system, followed deliberately and specifically** (per
explicit user direction, and consistent with `docs/PRODUCT_SPEC.md` Section 9's named
references — Stripe, Linear, Vercel, shadcn/ui). Concretely: true monochrome surfaces
(zero-chroma black/white/gray, no tinted "brand" primary), Geist Sans/Mono, one saturated
color reserved for the focus ring, and status conveyed by small dot indicators rather than
colored badge fills. See `PRODUCT.md` / `DESIGN.md` for the full narrative version of this
same system (those are the files the `impeccable` skill reads before doing design work —
keep all three in sync on future changes).

## Who this is for

A school/campus administration tool used by principals, office staff, and teachers,
often for hours at a stretch, on a desktop most of the day and a phone between periods.
It is not a marketing site and not a consumer app. Design priorities in order:

1. **Long-session legibility** — text and spacing that don't fatigue over a multi-hour shift.
2. **Information density done well** — a fee ledger or attendance grid should show real
   rows of data, not three cards per screen of whitespace.
3. **Fast repeat-task speed** — the same person marks attendance or records a payment
   every single day; the UI should reward memorized muscle movement, not "clean first impression."

## Color

**Revised 2026-09-13, twice, on explicit direction — second revision uses Vercel's own
extracted tokens verbatim, not an approximation of them.** First pass: a tinted blue-slate
"ink" plus an amber accent — read as a generic reskin. Second pass: switched to an
oklch-approximated monochrome palette — still not specific enough. Third and current pass:
the user supplied the literal extracted design tokens from vercel.com (exact hex values,
`@theme`/`:root`/DTCG JSON forms) and asked for those exact values, not a re-derivation.
`--raw-*` tokens in `src/app/globals.css` are those literal values; the table below is where
they land in the shadcn semantic slots this codebase's components actually consume:

| Raw token (source name, hex) | Semantic slot | Role |
|---|---|---|
| Obsidian `#171717` | `--foreground`, `--primary` | Primary buttons, active nav-item text, headings. Near-black, not pure `#000` — the source spec is explicit that pure black is reserved for icon/glyph fills only, never text or fills at UI scale. |
| Paper White `#fafafa` | `--background` | Page canvas, one step darker than `--card`. |
| Pure White `#ffffff` | `--card`, `--sidebar` | Panels, cards, table containers, sidebar surface. |
| Hairline `#ebebeb` | `--border` | 1px borders — see the `.surface-ring` utility below for the exact stacked-box-shadow technique the source uses instead of a plain border. |
| Stone `#666666` | `--muted-foreground` | Secondary text, table meta rows, timestamps, helper copy. |
| Terminal Green `#297a3a` | `--success` | The source palette's only accent color, explicitly documented there as "not a status color" for their marketing site — adapted here as exactly that (a status color) since this product genuinely needs one, and its logic (a supporting accent, used sparingly) transfers even though its literal marketing role doesn't. |
| geist blue `oklch(0.6 0.19 255)` | `--ring` | **Not in the extracted marketing tokens** (that scrape only covers the public site, which has no form/focus states to extract) — carried over from Vercel's actual known app/dashboard behavior: a vivid blue focus ring is their real interaction signature. The one saturated color in the whole system; focus states only. |
| — | `--signal`/`--warning`, `--destructive` | Not in the source palette either (its "0% colorfulness" rule applies to a marketing site with no fee-status/attendance concept). A muted amber and a red were added as the minimum semantic set this product needs (paid/due/overdue, active/inactive) — documented here as an honest extension, not something copied from the source. |

Dark mode has no source extraction (the scrape was light-theme only) — inverted by hand,
same zero-chroma logic, near-black canvas/near-white ink. Full token list and the exact
`.surface-ring` shadow value live in `src/app/globals.css`; this table explains intent.

**Explicitly rejected:** any tinted/derived approximation of Vercel's palette instead of the
literal extracted values; a colored/tinted primary of any kind (both prior attempts here
included); decorative gradient washes on surfaces/backgrounds/buttons (the source's own
gradient tokens are marked "marketing hero accents only" — correctly out of scope for a
records tool); a saturated accent used as a background fill instead of a small dot
indicator. **Not rejected:** a functional gradient fill under a chart series (see
`campus-enrollment-chart.tsx`) — that's data encoding, not decoration, and only uses this
system's own non-reserved chart tokens (never the focus-ring blue).

## Typography

Two typefaces, both loaded once, both earning their place — matching the named references
in `docs/PRODUCT_SPEC.md` Section 9 (Stripe, Linear, Vercel, shadcn/ui all converge on this
exact pairing, for the same reason: it disappears into the data instead of performing):

- **Geist Sans** — all UI text: labels, body, headings. Neutral, technical, highly legible
  at small sizes, with none of the personality a records tool doesn't need.
- **Geist Mono** — reserved for anything tabular/referential: money amounts, admission
  numbers, dates in table cells, reference numbers. This is a deliberate, functional split
  (numbers align and scan better in a monospace column, and a ledger reads as a ledger when
  its numbers look like typed figures), not decoration.

Type scale (all sizes map to Tailwind's scale, line-heights tuned for density):

| Role | Size / leading | Weight |
|---|---|---|
| Page title | 20px / 28px | 600 |
| Section heading | 15px / 20px | 600 |
| Card/table title | 13px / 18px | 600, `--muted-ink` |
| Body / table cell | 13.5px / 20px | 400 |
| Secondary / meta | 12px / 16px | 400, `--muted-ink` |
| Numeric/tabular (Geist Mono) | 13px / 20px, tabular-nums | 500 |

**One bounded exception**, sourced directly from the extracted spec's own "Eyebrow Label"
component (Geist Mono, 11px, uppercase, 0.071em tracking): applied *only* to sidebar group
labels (`.label-eyebrow` in `globals.css`), never above content sections on a page. The
generic-AI tell impeccable's own house rules warn against is an eyebrow over every section
of page content; a small nav-group label is the one place the source system's own convention
is used as intended (Vercel's own settings sidebars do exactly this), not as a page-content
decoration.

## Radius & elevation — varied by role, not uniform

Values are the source spec's own named radii, not a re-derived scale:

- **Nav elements** (sidebar menu buttons): `2px` — the source spec's `--radius-nav`,
  tighter than everything else because nav items are the most "attached to the page"
  interactive element.
- **Cards, buttons, inputs, table containers**: `6px` — `--radius-cards`/`--radius-buttons`.
- **Status pills/badges**: full pill (`9999px`) — `--radius-pills`.
- **Popovers, Dropdowns, Dialogs, Alert Dialogs, Sheets, tooltips** (floating overlays):
  `8-12px` and the only elements allowed a real drop shadow.
- Everything docked in the page flow (cards, tables, stat tiles) uses the source's own
  "hairline card" technique instead of a plain CSS border or a shadow: two stacked
  `box-shadow` rings (`.surface-ring` utility) that render a 1px border which survives any
  background — this is a literal, sourced technique, not an approximation of one.
- A row of KPI figures is **one bordered strip divided by hairlines** (like a ledger
  header), not four identical drop-shadow cards side by side, and never a colored
  left-border stripe as the accent device — tone is carried by the number/figure color alone.

## Components

- **Status Dot** (`src/components/status-dot.tsx`) — a small solid dot plus plain text,
  replacing colored badge/pill fills for any status (student status, fee status, campus fee-
  collection health). Matches Vercel's own deployment-status convention: a fact about the
  row, not a decoration. Tone (`neutral`/`success`/`warning`/`danger`) colors only the 6px
  dot, never the text or a background.
- **Page Header** (`src/components/page-header.tsx`) — every page opens with the same slot
  layout: title, one-line description, right-aligned actions, a hairline bottom border
  separating it from content. Used identically on every screen so pages read as one system
  rather than each having its own ad hoc title treatment.
- **Stat Strip** — see Radius & elevation below; no icons on stat entries (Vercel's own
  usage/summary numbers are plain label + figure, nothing competing with the number).

## Layout — one shape per job, not one shell reused everywhere

The shell (sidebar + header + `PageHeader`) is shared, deliberately, so pages read as one
system. What is **not** shared is the shape of the content underneath it — a list, a
dashboard, and a detail page ask fundamentally different questions of their layout, and
each one now has an architecture built for its own question rather than a generic
stack-of-cards applied uniformly (this was the concrete gap flagged in review: "same
architecture and positioning as the old app, just recolored"):

- **List/table pages** (Students): full-width, no max-width constraint — a compound
  toolbar (search + filters + column visibility) above one `DataTable`. The layout question
  here is "show me the rows," so nothing competes with the table for width.
- **Dashboard/monitoring pages** (Institute overview): a *tiered* layout, not a flat stack.
  Row 1 is the `StatStrip` (the numbers, at a glance). Row 2 splits 2:1 — a trend chart
  ("how are we tracking over time") beside a `NeedsAttentionPanel` ("which campus needs me
  right now," ranked, not alphabetical) — two different questions side by side, each in the
  component built for it, not one table trying to answer both. Row 3 is the full
  campus-comparison table, a third, separate question ("how does every campus stack up").
- **Detail/drill-down pages** (Student detail): a **rail + main** split (`280px` sticky rail
  + flex-1 content), not a header-then-stacked-tabs layout. Identity/context facts (name,
  status, admission number, campus, guardian) live in the rail because they're not
  "content" that a tab should hide — they're the frame the content sits inside, and they
  stay visible no matter which tab is open. The old design's separate "Guardians" tab folded
  into the rail once guardian contact was recognized as exactly this kind of always-relevant
  fact, not tab-worthy content.
- Sidebar: fixed 240px expanded / 56px icon-only on narrow viewports, grouped by
  role-relevant module (mirrors the permission-driven grouping already proven in
  `product/web`'s sidebar, rebuilt on shadcn's `Sidebar` primitive).

Before adding any new page, ask which of these three questions (or a genuinely new fourth
shape) the page is actually answering — don't default to whichever of the above is closest.

## Anti-patterns explicitly avoided in this system

Identical soft-shadow rounded cards everywhere; one accent color for everything;
ALL-CAPS eyebrow labels; a single border-radius value applied regardless of element role;
gradient decoration; centered narrow "SaaS landing page" whitespace on data-dense screens.
