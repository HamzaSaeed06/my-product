---
name: Rise Campus — web-v2
description: Vercel/Geist-style monochrome admin UI for a multi-campus school platform.
colors:
  ink: "oklch(0.145 0 0)"
  ink-foreground: "oklch(0.99 0 0)"
  paper: "oklch(0.985 0 0)"
  surface: "oklch(1 0 0)"
  line: "oklch(0.9 0 0)"
  muted-surface: "oklch(0.96 0 0)"
  muted-ink: "oklch(0.46 0 0)"
  accent-tint: "oklch(0.94 0 0)"
  focus-blue: "oklch(0.6 0.19 255)"
  signal: "oklch(0.72 0.16 70)"
  success: "oklch(0.55 0.14 150)"
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
  panel: "8px"
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
  status-dot:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
  stat-strip-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.panel}"
    padding: "16px"
  page-header:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    padding: "0 0 16px 0"
  data-table-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "8px 12px"
---

# Design System: Rise Campus — web-v2

## 1. Overview

**Creative North Star: "The Geist Ledger"**

This is Vercel's own Geist design system, followed specifically and deliberately — not
paraphrased into "restraint" as an abstract value, but matched concretely: true monochrome
surfaces, one saturated color reserved for a single job, and status told through a dot
rather than a colored fill. This was a direct correction mid-project: the first pass at this
system used a tinted blue-slate primary and an amber accent, and while it removed the
old frontend's dialog-for-everything habit, it still read as "a recolored admin template"
rather than a distinct, considered system. Matching Vercel's actual palette logic — zero
chroma everywhere except the interaction focus ring — is what makes the difference legible.

This system explicitly rejects: any tinted "brand" primary color (including this project's
own discarded first attempt); colored badge/pill fills for status (replaced by a small dot);
soft-shadow rounded cards as the default surface language; ALL-CAPS eyebrow labels; a single
border-radius applied regardless of an element's role; gradient decoration.

**Key Characteristics:**
- Primary is near-black, not blue, not amber, not any hue at all — the same neutral color
  that fills a button also colors an active nav item and a heading.
- Exactly one saturated color exists in the whole system: a vivid blue, reserved for the
  keyboard-focus ring. It never appears as a background or a text color.
- Status (student status, fee status, campus health) is a small colored dot plus plain text,
  never a colored pill — the same convention Vercel uses for deployment status.
- Every page opens with the same header slot: title, one-line description, right-aligned
  actions, a hairline bottom border. No page invents its own title treatment.

## 2. Colors

A true monochrome palette — one neutral ramp from near-black to near-white — plus exactly
one saturated color used for exactly one job.

### Primary
- **Geist Ink** (oklch(0.145 0 0), zero chroma): the only structural color. Primary buttons,
  active sidebar item text, page titles. Deliberately hue-less — this is what separates it
  from every "branded admin panel" that tints its primary toward the company's logo color.

### Secondary (the one saturated color)
- **Focus Blue** (oklch(0.6 0.19 255)): the keyboard-focus ring, full stop. **The Single Job
  Rule.** If Focus Blue is being used for anything other than a focus ring, it's the wrong
  color — reach for Geist Ink or a neutral instead. This is the one color in the system users
  actually notice, precisely because it appears nowhere else.

### Tertiary (dot-indicator vocabulary)
- **Ledger Success** (oklch(0.55 0.14 150)): paid / present / approved — a small dot only.
- **Ledger Signal** (oklch(0.72 0.16 70)): due / pending / needs attention — a small dot only.
- **Ledger Danger** (oklch(0.55 0.21 25)): overdue / absent / rejected — a small dot, and the
  color of destructive-action buttons and their Alert Dialog confirmation.

### Neutral
- **Paper** (oklch(0.985 0 0)): page background, one step darker than Surface.
- **Surface** (oklch(1 0 0)): panels, cards, table containers, the sidebar. Pure white.
- **Geist Line** (oklch(0.9 0 0)): hairline borders separating every in-flow block.
- **Muted Ink** (oklch(0.46 0 0)): secondary text, meta rows, timestamps — zero chroma,
  clears 4.5:1 against Paper at body sizes.

### Named Rules
**The Zero-Chroma Rule.** Every neutral in this system — background, surface, border, muted
text — has zero color saturation. If a neutral token ever needs a hint of hue "to feel
warmer" or "to match the brand," that instinct is the thing to override, not indulge.

## 3. Typography

**Body Font:** Geist Sans (with `ui-sans-serif, system-ui` fallback)
**Label/Mono Font:** Geist Mono (with `ui-monospace, monospace` fallback)

**Character:** One neutral, highly legible grotesk carries every word; Geist Mono is a
functional register-switch for anything tabular, not a second decorative voice.

### Hierarchy
- **Title** (600, 20px, 28px line-height): page titles, inside the shared Page Header.
- **Heading** (600, 15px, 20px line-height): section/card headings within a page.
- **Label** (600, 13px, 18px line-height, Muted Ink): card/table titles, sidebar group
  labels — sentence case always, never tracked-out uppercase.
- **Body** (400, 13.5px, 20px line-height): table cells, form labels, running text.
- **Meta** (400, 12px, 16px line-height, Muted Ink): timestamps, helper text, row counts.
- **Numeric** (Geist Mono, 500, 13px, 20px line-height, tabular-nums): money, admission
  numbers, percentages, dates-in-tables — anything scanned down a column.

### Named Rules
**The Register-Switch Rule.** The only signal that distinguishes "this is a number to
compare" from "this is a word to read" is the font switching from Geist Sans to Geist Mono.
No bolding, coloring, or sizing is layered on top of that switch by default.

## 4. Elevation

Flat by default. Structure comes from a 1px Geist Line border and the Paper→Surface
lightness step, never from shadow, for anything still living in the normal page flow.
Shadow is reserved for content that detaches from the page: Sheet, Dialog, Alert Dialog,
Popover, Dropdown Menu, Tooltip, Combobox/Command.

### Shadow Vocabulary
- **overlay** (`box-shadow: 0 8px 24px oklch(0 0 0 / 0.12)`): Sheet, Dialog, Alert Dialog.
- **popover** (`box-shadow: 0 4px 16px oklch(0 0 0 / 0.10)`): Popover, Dropdown Menu,
  Combobox/Command, Tooltip.

### Named Rules
**The Floats-Or-It-Doesn't Rule.** An element still occupying its own row/column in the
normal layout gets a border, never a shadow, regardless of how important it is. Shadow is
earned by leaving the document flow, not by significance.

## 5. Components

### Buttons
- **Shape:** 6px radius (`{rounded.control}`), the smallest in the system.
- **Primary:** Geist Ink background, Geist Ink-foreground text, 6px 10px padding.
- **Focus:** a 3px Focus Blue ring on every interactive element — the one place the
  saturated accent is allowed to appear.
- **Ghost / Outline:** transparent or Surface background with a Geist Line border; every
  secondary action (Cancel, Clear filters, row-action triggers) uses this, never a second
  filled color.

### Status Dot (signature component)
A 6px solid circle plus plain-weight text — replaces colored badge/pill fills everywhere a
status appears (student status, fee status, campus fee-collection health). Tone lives only
in the dot's fill color; the text stays the same Geist Ink/Muted Ink as everything else. Used
as a Popover trigger for quick-edit status fields (a chevron fades in on hover as the only
extra affordance) and as a plain read-only indicator in tables that don't support editing yet.

### Page Header (signature component)
Every page: title (Title scale) + one-line description (Meta scale, Muted Ink) on the left,
actions right-aligned, a 1px Geist Line bottom border separating it from the page content.
Identical slot layout on every screen — this is what makes 60+ pages read as one system.

### Stat Strip (signature component)
One Surface panel, 8px radius (`{rounded.panel}`), divided into cells by 1px Geist Line
hairlines (vertical on desktop, horizontal when stacked on mobile) — never separate
drop-shadow cards, never a colored border-stripe accent, and no icons: label plus figure
only, the way Vercel's own usage/summary rows work.

### Data Table
Sortable headers (icon-only sort affordance), one toolbar row holding every filter control
plus the column-visibility menu, hairline row separators with no zebra striping, row actions
in a trailing icon-only Dropdown Menu, an `Empty` state (icon + title + description) when a
filter combination returns nothing.

### Inputs / Fields
- **Style:** Surface background, 1px Geist Line border, 6px radius.
- **Focus:** border shifts to Geist Ink plus the 3px Focus Blue ring.
- **Combobox:** replaces a plain Select for any list that can run into the hundreds
  (students, teachers, classes) — type-to-filter via Command.

### Navigation
Sidebar (shadcn `Sidebar` primitive, Surface background): grouped by role-relevant module,
active item gets a light neutral-gray fill (`accent-tint`) with Geist Ink text — never a
filled black block, matching Vercel's own settings-sidebar active state exactly. Collapses
to icon-only with tooltips on narrow viewports. Header carries the sidebar toggle, a
campus-scope Combobox for scoped roles, and the account menu.

## 6. Do's and Don'ts

### Do:
- **Do** keep every neutral token at zero chroma — background, surface, border, muted text.
- **Do** reserve Focus Blue for the keyboard-focus ring only.
- **Do** use a Status Dot (colored dot + plain text) for any status field; never a colored
  badge/pill fill.
- **Do** open every page with the same Page Header slot: title, description, right-aligned
  actions, hairline bottom border.
- **Do** switch to Geist Mono for every number scanned down a column: fees, attendance
  percentages, admission numbers, table dates.
- **Do** combine a list's filters (class, section, fee status, search, ...) into one toolbar
  row that answers the real compound operational question in a single pass.

### Don't:
- **Don't** tint a neutral token toward any hue "to feel branded" — that is the exact mistake
  this system corrected once already.
- **Don't** use a colored `border-left`/`border-right` stripe as a card or stat-cell accent.
- **Don't** fill a badge background with a status color; use a Status Dot instead.
- **Don't** default to a Dialog for a simple interaction just because it's the fastest
  component to reach for — the reason this rebuild exists.
- **Don't** use a plain `<Select>` for any list that can run into the hundreds; use Combobox.
- **Don't** apply drop shadows to anything still living in the normal page flow — cards,
  stat cells, and table containers get borders, never shadows.
- **Don't** put an icon on a Stat Strip entry; label and figure only.
