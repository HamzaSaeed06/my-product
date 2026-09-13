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

**Revised 2026-09-13, on explicit direction: follow Vercel's own Geist design system, not
an invented "brand palette."** The first pass here used a tinted blue-slate "ink" plus an
amber accent; the user's read was that it still felt like a generic reskin and asked for
Vercel's actual system specifically — true monochrome, not a colored primary. This is the
system now. Named tokens (light mode base values, oklch, all zero-chroma unless noted):

| Token | Value | Role |
|---|---|---|
| `--foreground` / `--primary` | `oklch(0.145 0 0)` | Near-black. Primary buttons, active nav-item text, headings. Zero chroma — not blue-slate, not warm-tinted. |
| `--background` | `oklch(0.985 0 0)` | Near-white page background, one step darker than `--card`. |
| `--card` / `--sidebar` (surface) | `oklch(1 0 0)` | Pure white panels — the lightness step from `--background` is the only "lift" cue, no shadow. |
| `--border` | `oklch(0.9 0 0)` | Hairline borders, zero chroma. This system uses borders, not drop shadows, to separate in-flow content — shadows are reserved for true overlays (Sheet, Popover, Dialog, Dropdown). |
| `--muted-foreground` | `oklch(0.46 0 0)` | Secondary text, table meta rows, timestamps. |
| `--ring` | `oklch(0.6 0.19 255)` | **The one saturated color in the whole system** — Vercel's own signature: a vivid blue focus ring against an otherwise grayscale interface. Focus states only, never a background or text color. |
| `--signal` / `--warning` | `oklch(0.72 0.16 70)` | Amber. Small dot-indicator only (see Components) — "due," "pending," "needs attention." Never a fill or a large surface. |
| `--success` | `oklch(0.55 0.14 150)` | Dot indicator — paid / present / approved. |
| `--destructive` | `oklch(0.55 0.21 25)` | Dot indicator, plus destructive-action buttons/confirmations. |
| `--chart-1..5` | near-black, geist blue, success green, mid-gray, signal amber | Comparison charts (Super Admin cross-campus views) — never rainbow-random. |

Dark mode inverts to a near-black background/near-white foreground, same zero-chroma
neutrals throughout, and the geist blue ring brightens slightly for contrast. Full token
list lives in `src/app/globals.css`; this table is the source of intent, that file is the
implementation.

**Explicitly rejected:** a colored/tinted primary of any kind (the previous "ink" blue-slate
included) — Vercel's own primary is neutral black/white, and that's the point being copied,
not worked around; gradient washes anywhere; a saturated accent used as a background fill
instead of a small dot indicator; identical drop-shadow cards as the only surface language.

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

No ALL-CAPS section eyebrows, no tracked-out micro-labels. Section labels in the sidebar
use normal case at `--muted-ink`, weight 500.

## Radius & elevation — varied by role, not uniform

- Inputs, buttons, badges, small controls: `6px`.
- Cards, table containers, Sheets: `10px`.
- Popovers, Dropdowns, Dialogs, Alert Dialogs, tooltips (true floating overlays): `12px`
  **and** the only elements allowed a real drop shadow. Everything docked in the page flow
  (cards, tables, stat tiles) is separated by a 1px `--line` border instead of a shadow.
- A row of KPI figures is **one bordered strip divided by hairlines** (like a ledger
  header), not four identical drop-shadow cards side by side, and never a colored
  left-border stripe as the accent device — tone is carried by the number/icon color alone.

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

## Layout

- Sidebar: fixed 240px expanded / 56px icon-only on narrow viewports, grouped by
  role-relevant module (mirrors the permission-driven grouping already proven in
  `product/web`'s sidebar, rebuilt on shadcn's `Sidebar` primitive).
- Content max-width is **not** constrained on list/table screens — dense grids use the
  full viewport. Forms and detail panels do get a readable max-width (~720px) since prose
  and form fields, unlike tables, get harder to scan when stretched full-width.
- Consistent page header pattern: title + one-line context + primary action(s) aligned
  right, same slot on every screen.

## Anti-patterns explicitly avoided in this system

Identical soft-shadow rounded cards everywhere; one accent color for everything;
ALL-CAPS eyebrow labels; a single border-radius value applied regardless of element role;
gradient decoration; centered narrow "SaaS landing page" whitespace on data-dense screens.
