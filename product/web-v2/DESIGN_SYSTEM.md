# web-v2 Design System

This is a fresh design pass for the rebuild — it does not inherit `product/web`'s palette,
type choices, or component defaults. `product/web` stays the reference for *behavior*
(what a screen must do), never for *how it should look*.

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

Grounded in the subject matter — a ledger/register aesthetic, not a generic SaaS product.
Named tokens (light mode base values, oklch):

| Token | Value | Role |
|---|---|---|
| `--ink` (primary) | `oklch(0.27 0.045 250)` | Deep blue-slate — primary actions, active nav, headings-on-light. Deliberately desaturated so it reads as "institutional ink," not "SaaS blue." |
| `--paper` (background) | `oklch(0.985 0.003 90)` | Warm-neutral off-white — not pure white (too clinical for hours-long reading), not cream (too decorative). |
| `--surface` (card/panel) | `oklch(1 0 0)` | Pure white panels sit slightly lighter than the paper background — the only "lift" cue we use instead of shadow. |
| `--line` (border) | `oklch(0.89 0.006 90)` | Hairline borders. This system uses borders, not drop shadows, to separate content — shadows are reserved for true overlays (Sheet, Popover, Dialog). |
| `--muted-ink` (muted foreground) | `oklch(0.5 0.015 90)` | Secondary text, table meta rows, timestamps. |
| `--signal` (accent) | `oklch(0.7 0.15 70)` | Warm amber. Used *only* for "needs attention" — pending items, due-soon badges, unread counts. Never decorative. |
| `--success` | `oklch(0.58 0.13 150)` | Paid / present / approved. |
| `--danger` | `oklch(0.55 0.21 25)` | Overdue / absent / rejected / destructive actions. |
| `--chart-1..5` | ink, signal, success, a slate, a muted amber | Comparison charts (Super Admin cross-campus views) — never rainbow-random. |

Dark mode inverts surface/paper relationship (`--surface` becomes the slightly-lighter
plane on a near-black `--paper`) and desaturates `--ink` toward a lighter tint so it stays
legible without glowing. Full token list lives in `src/app/globals.css` once scaffolded —
this table is the source of intent, that file is the implementation.

**Explicitly rejected:** generic Tailwind `blue-600` as primary, gradient washes anywhere,
a single accent color reused for both "brand" and "success," identical drop-shadow cards
as the only surface language.

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
