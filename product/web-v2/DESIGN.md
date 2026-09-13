---
name: Rise Campus — web-v2
description: Institutional-ledger admin UI for a multi-campus school platform.
colors:
  ink: "oklch(0.27 0.045 250)"
  ink-foreground: "oklch(0.98 0.005 250)"
  paper: "oklch(0.985 0.003 90)"
  surface: "oklch(1 0 0)"
  line: "oklch(0.89 0.006 90)"
  muted-surface: "oklch(0.95 0.005 90)"
  muted-ink: "oklch(0.46 0.015 90)"
  accent-tint: "oklch(0.93 0.008 90)"
  signal: "oklch(0.7 0.15 70)"
  signal-foreground: "oklch(0.18 0.02 70)"
  success: "oklch(0.58 0.13 150)"
  danger: "oklch(0.55 0.21 25)"
typography:
  title:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "20px"
    fontWeight: 600
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
    fontFamily: "Geist Sans, ui-sans-serif, system-ui"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
  numeric:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "20px"
rounded:
  control: "6px"
  panel: "10px"
  overlay: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-foreground}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
  stat-strip-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.panel}"
    padding: "16px"
  data-table-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "8px 12px"
---

# Design System: Rise Campus — web-v2

## 1. Overview

**Creative North Star: "The Institutional Ledger"**

This is a records tool a principal, an office clerk, or a teacher opens forty times a day —
never a marketing surface. Every choice here optimizes for the fortieth open of the day, not
the first: figures that align in a monospace column, borders instead of shadows to tell one
block of data from the next, and an accent color rationed to exactly one meaning ("this needs
attention") so it never competes with the data itself for a viewer's eye. The register named
in `docs/PRODUCT_SPEC.md` — Stripe, Linear, Vercel, shadcn/ui — is not chased for its "SaaS
polish" but for the trait these products share underneath: restraint. Nothing here decorates;
everything here counts, sorts, filters, or confirms.

This system explicitly rejects the generic-AI-admin-panel family: identical soft-shadow
rounded cards as the only surface language, a single accent color reused for both brand and
success, ALL-CAPS tracked eyebrow labels, one border-radius applied regardless of an
element's role, gradient decoration, a plain `<Select>` standing in for a searchable list of
hundreds, and — the specific failure this whole rebuild exists to correct — a Dialog reached
for by reflex regardless of whether the interaction is simple or complex.

**Key Characteristics:**
- Borders and hairlines carry structure; shadows are reserved for things that actually float
  above the page (Sheet, Popover, Dialog, Dropdown).
- Every number that means money, a count, or a date-in-a-table is set in Geist Mono; every
  label and heading around it is set in Geist Sans. The switch itself is the hierarchy cue.
- One accent (amber "signal") means exactly one thing everywhere it appears: something is
  pending, due, or otherwise wants a human's attention today.
- Radius scales with how physically "attached to the page" an element is — flat controls get
  the smallest radius, floating overlays get the largest.

## 2. Colors

A near-monochrome ledger palette — one ink, one paper, one rationed accent — not a themed
"brand palette" wrapped around a generic admin template.

### Primary
- **Ledger Ink** (oklch(0.27 0.045 250)): the one structural color. Primary buttons, active
  nav state, headings that need to out-rank body text, the sidebar's selected-item fill.
  Deliberately desaturated blue-slate — read as "institutional," never as "SaaS blue."

### Secondary (rationed accent)
- **Signal Amber** (oklch(0.7 0.15 70)): reserved *only* for "needs attention" —
  pending-admissions counts, due-soon badges, unread indicators. **The One Meaning Rule.**
  If a use of Signal Amber isn't flagging something a human should act on today, it's the
  wrong color; reach for Ledger Ink or a neutral instead.

### Tertiary (status vocabulary)
- **Ledger Success** (oklch(0.58 0.13 150)): paid / present / approved. A distinct hue from
  Ledger Ink even though both sit in a cool-to-mid range, so "positive metric" never reads as
  "clickable brand action."
- **Ledger Danger** (oklch(0.55 0.21 25)): overdue / absent / rejected, and every destructive
  action's confirming color.

### Neutral
- **Paper** (oklch(0.985 0.003 90)): the page background. Warm-neutral, not pure white (too
  clinical for hours of reading) and not cream (too decorative for a records tool).
- **Surface** (oklch(1 0 0)): panels, cards, table containers — pure white, one step lighter
  than Paper. This lightness step is the *only* "lift" cue used instead of a shadow.
- **Ledger Line** (oklch(0.89 0.006 90)): hairline borders that separate every in-flow block
  of content from its neighbor.
- **Muted Ink** (oklch(0.46 0.015 90)): secondary text, table meta rows, timestamps. Held
  dark enough to clear 4.5:1 against Paper at body sizes — this is not decorative light gray.

### Named Rules
**The No-Shadow-In-Flow Rule.** Anything docked in the normal page flow (cards, stat cells,
table containers) is separated from its neighbors by a 1px Ledger Line border, never a
drop shadow. Shadows appear only on Sheet, Popover, Dialog, Alert Dialog, Dropdown, and
Tooltip — things that genuinely float above the page.

## 3. Typography

**Body Font:** Geist Sans (with `ui-sans-serif, system-ui` fallback)
**Label/Mono Font:** Geist Mono (with `ui-monospace, monospace` fallback)

**Character:** One neutral, highly-legible grotesk carries every word on the page; Geist Mono
is not a second "voice" but a functional register-switch, used only where numbers need to
align in a column or read as a typed figure (an admission number, a fee amount, a table
timestamp).

### Hierarchy
- **Title** (600, 20px, 28px line-height): page titles ("Students", "Institute overview").
- **Heading** (600, 15px, 20px line-height): section/card headings within a page.
- **Label** (600, 13px, 18px line-height, `Muted Ink`): card/table titles and group labels.
  Sentence case always — no tracked-out uppercase eyebrows anywhere in this system.
- **Body** (400, 13.5px, 20px line-height): table cells, form labels, running text.
- **Meta** (400, 12px, 16px line-height, `Muted Ink`): timestamps, helper text, row counts.
- **Numeric** (Geist Mono, 500, 13px, 20px line-height, tabular-nums): money, admission
  numbers, dates-in-tables, any figure a staff member scans down a column.

### Named Rules
**The Register-Switch Rule.** The only signal that distinguishes "this is a number to be
compared against its neighbors" from "this is a word to be read" is the font switching from
Geist Sans to Geist Mono. No other typographic trick (bolding, color, size) is layered on
top of that switch by default — the switch alone is the hierarchy cue.

## 4. Elevation

Flat by default, structure carried by hairline borders and the Paper→Surface lightness step,
not by shadow. Shadow is reserved for content that visually detaches from the page: Sheet,
Dialog, Alert Dialog, Popover, Dropdown Menu, Tooltip, and the Combobox/Command popover.

### Shadow Vocabulary
- **overlay** (`box-shadow: 0 8px 24px oklch(0 0 0 / 0.12)`): Sheet, Dialog, Alert Dialog —
  content the user must resolve before returning to the page underneath.
- **popover** (`box-shadow: 0 4px 16px oklch(0 0 0 / 0.10)`): Popover, Dropdown Menu,
  Combobox/Command, Tooltip — lighter-weight transient overlays.

### Named Rules
**The Floats-Or-It-Doesn't Rule.** If an element still occupies its own row/column in the
normal page layout, it gets a border, not a shadow — regardless of how "important" it is.
Shadow is earned by actually leaving the document flow, never by significance alone.

## 5. Components

### Buttons
- **Shape:** 6px radius (`{rounded.control}`) — the smallest radius in the system, since
  buttons are the most "attached to the page" interactive element.
- **Primary:** Ledger Ink background, Ledger Ink-foreground text, 6px 10px padding.
- **Hover / Focus:** background darkens slightly on hover; a 3px ring in the ink color at
  reduced opacity on keyboard focus — visible on every interactive element, not just inputs.
- **Ghost / Outline:** transparent or Surface background with a Ledger Line border; used for
  every secondary action (Cancel, Clear filters, row-action triggers).

### Data Table (signature component)
Sortable column headers (icon-only sort affordance, no decoration), a single toolbar row
that holds every filter control plus the column-visibility menu — never two stacked toolbar
bars. Rows are separated by hairlines only, no zebra striping (striping fights with the
Fee-status/Status badges for the eye's attention in a dense table). Row actions live in a
trailing icon-only Dropdown Menu, never inline button clutter. An `Empty` state (icon +
title + one-line description) replaces the body when a filter combination returns nothing —
never a bare "No results" string.

### Stat Strip (signature component)
A single Surface panel with a 10px radius (`{rounded.panel}`), divided into 2-4 cells by
1px Ledger Line hairlines (vertical on desktop, horizontal on mobile stacking) — **not** four
separate drop-shadow cards, and **never** a colored left-border stripe as the per-cell
accent. Tone (neutral vs. "needs attention") is carried only by the number/icon color inside
the cell, keeping the container itself perfectly uniform.

### Cards / Containers
- **Corner Style:** 10px radius (`{rounded.panel}`).
- **Background:** Surface on Paper.
- **Shadow Strategy:** none — see Elevation. Separation is the 1px Ledger Line border alone.
- **Internal Padding:** 16-24px depending on density need.

### Inputs / Fields
- **Style:** Surface background, 1px Ledger Line border, 6px radius.
- **Focus:** border shifts to Ledger Ink plus a 3px ink-tinted ring, matching buttons.
- **Combobox:** used instead of a plain Select for any list that can run into the hundreds
  (students, teachers, classes) — type-to-filter via Command, triggered from a bordered
  control identical in shape to a Select trigger so the two don't visually compete.

### Navigation
Sidebar (shadcn `Sidebar` primitive): Surface background, grouped by role-relevant module,
active item filled with a light Ledger Ink tint and Ledger Ink text (never the raw Signal
Amber, which stays reserved for attention-badges only). Collapses to icon-only with
tooltips on narrow viewports. Header carries the sidebar toggle, a campus-scope Combobox
(for any scoped role, per the multi-campus contract), and the account menu — one consistent
slot layout across every page.

## 6. Do's and Don'ts

### Do:
- **Do** switch to Geist Mono for every number a staff member compares down a column: fees,
  attendance percentages, admission numbers, dates in table cells.
- **Do** separate in-flow content with a single 1px Ledger Line border; reserve shadow for
  Sheet/Dialog/Popover/Dropdown/Tooltip only.
- **Do** combine every list's filters (class, section, fee status, search, ...) into one
  toolbar row that answers the real compound operational question in one pass.
- **Do** show a human-facing label (name, admission number) for every reference to another
  entity in a table; never a raw database id.
- **Do** match the interaction to the task: Popover for one field, Sheet for a row's medium
  form, Alert Dialog only for destructive/irreversible actions, a dedicated route with a step
  indicator for genuinely multi-step flows.

### Don't:
- **Don't** use a colored `border-left`/`border-right` stripe as a card or stat-cell accent —
  express tone through the number/icon color instead, or through a full background tint.
- **Don't** default to a Dialog for a simple interaction just because it's the fastest
  component to reach for — this is the exact failure the old frontend needs correcting for.
- **Don't** use a plain `<Select>` for any list that can run into the hundreds; use the
  Combobox pattern instead.
- **Don't** put ALL-CAPS tracked-out eyebrow labels above sections, or ship a `<table>` with
  a raw `.map()` where the Data Table pattern (sort, paginate, filter, column-visibility,
  Empty state) belongs instead.
- **Don't** apply drop shadows to anything that still lives in the normal page flow — cards,
  stat cells, and table containers get borders, never shadows.
- **Don't** reuse Signal Amber for anything that isn't "this needs a human's attention today"
  — it is not a general-purpose second brand color.
