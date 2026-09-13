# web-v2 Progress

## 2026-09-13 — Design-system switcher (top-right) for comparing multiple pasted designs

The user is pasting in more than one design system to compare live before picking a
winner. Rather than rebuild the token set each time, added a switcher:

- **`src/lib/themes.ts`**: a small registry, `[{ id, label }]`. Currently one entry:
  `{ id: "vercel-geist", label: "Vercel Geist" }` — the design system built so far.
- **`src/components/theme-provider.tsx`**: wraps the app in `next-themes`' `ThemeProvider`
  (already a dependency), repurposed for `attribute="data-theme"` with the registry's ids as
  `themes` — this is a *design-system* switch, independent of this project's own light/dark
  (`.dark` class) handling.
- **`src/components/theme-switcher.tsx`**: a `Select` in the top-right of the header
  (`site-header.tsx`), next to the account menu, backed by `useTheme()`.
- **`src/app/globals.css`**: `:root` is documented as the `"vercel-geist"` theme's token
  block. Room left for more: a future pasted design gets its own
  `[data-theme="<id>"] { ... }` block placed *after* `:root` in source order (same
  specificity as `:root`, so later-in-file wins) plus one new entry in `themes.ts` — nothing
  else changes.

**When the next design system arrives**: add its tokens as a new `[data-theme="..."]` block
in `globals.css`, add `{ id, label }` to `THEMES` in `themes.ts`. The switcher UI needs no
changes. Once a final design is chosen, this whole switcher can be deleted and its winning
theme's tokens promoted to be the only `:root` block again — it's scoped to the review
period, not meant to ship.

## 2026-09-13 — Chart matched exactly to shadcn's reference; Select label bug fixed

The user pasted shadcn's actual "Area Chart - Interactive" source and asked for it applied
exactly (not re-approximated). Two real fixes came out of the diff against what was built:

- **Areas weren't stacked** (`stackId="a"` was missing) — four independent, overlapping
  semi-transparent fills read as a muddy dark blob wherever campus lines were close
  together. Stacked, per the reference, they read cleanly. Header restructured to match the
  reference exactly too: a bordered `CardHeader` row with filters pinned right via
  `sm:ml-auto`, cursor-less dot tooltip.
- **`SelectValue` was showing the raw stored value ("all", "6", "PAID") instead of the
  matching option's label**, on every `Select` in the app. Root cause: this codebase's
  shadcn style is `base-nova` (`@base-ui/react`), and base-ui's `Select.Value` does not
  auto-resolve a value to its item's rendered label the way Radix's does — it needs an
  explicit `children` render function (`<SelectValue>{(value) => label}</SelectValue>`).
  Fixed on both chart filters and the Students list's Fee status/Status selects. **Any new
  `<Select>` added in Phase B must pass this render-function children — the plain
  `<SelectValue placeholder="..." />` form silently shows raw values once something is
  selected**, and is easy to miss since it looks correct before any value is picked.

## 2026-09-13 — Chart rebuilt as gradient area chart + filters; tables left-aligned

Fifth round of same-day feedback, with a reference screenshot of shadcn's own "Area Chart -
Interactive" example (gradient fill, smooth curve, a range-select control in the header).

- **`CampusEnrollmentChart` rebuilt**: back to an `AreaChart` (not the plain `LineChart` from
  an earlier round — that was based on a misreading of "seedhi lines," corrected once the
  actual reference image showed a smooth gradient area chart), `type="natural"` for a smooth
  curve instead of jagged linear segments between only 6 points, and per-series
  `linearGradient` fills. Added two header filters (`CardAction` slot): a Campus select
  (All campuses / one specific — toggles which Area series render) and a Range select (Last
  3 / 6 months — slices the mock data). **Chart series deliberately skip `--chart-2` (the
  geist focus-blue)** — this system's own rule is that saturated blue has exactly one job
  (the focus ring), so the chart uses the other three chart tokens (obsidian/green/gray/
  amber) instead, never blue.
- **All tables reverted to left-aligned columns, including numeric ones.** A previous round
  right-aligned numeric columns for cross-table consistency; explicit correction: consistency
  should go the other way — every column, in every table, stays left-aligned. Reverted in
  both `CampusesOverviewTable` (Students/Teachers/Pending admissions/Fee collected/
  Attendance today) and the Students `DataTable` (Attendance).

## 2026-09-13 — Data-correctness and filter fixes on the Students list (still Phase A)

Fourth round of same-day feedback:

- **Needs Attention panel reverted to the single-Card list** (the prior "gallery of mini
  cards" redesign was a misread of the feedback) — the actual ask was just that its height
  didn't match the enrollment chart card beside it. Added `h-full`; grid's default
  `align-items: stretch` now equalizes both cards' height in their 2:1 row.
- **Graduated students no longer appear in the Students list by default.** They're
  operationally irrelevant to daily work (attendance, fees, homework don't apply to them)
  and were just noise mixed into the roster. Added a Status filter
  (`src/app/dashboard/students/student-filters.tsx`) — "Active & inactive" (default,
  excludes graduated), "Active only," "Inactive only," "Graduated" — so graduated students
  are one explicit choice away (an alumni report, a transcript request) instead of always
  visible.
- **Added a Campus filter** (Combobox) — the list spans 4 campuses and had no way to
  scope by one, a real gap for a Super Admin viewing across campuses.
- **Class and Section split into two separate table columns** — they were combined into
  one `"Grade 3 - B"` string column, which also blocked sorting/filtering on either
  independently.
- **Numeric-column alignment made consistent**: Attendance (Students table) is now
  right-aligned with Geist Mono figures, matching the convention `CampusesOverviewTable`
  already used — previously only one of the two tables right-aligned its numbers.

## 2026-09-13 — Exact Vercel tokens + per-page architecture (still Phase A)

Third round of feedback the same day: the color-token pivot alone still read as "the same
architecture and positioning, just one color changed." Two things landed in response:

**1. Exact tokens, not an approximation.** The user supplied Vercel's own extracted design
tokens (literal hex values, in `@theme`/`:root`/DTCG-JSON form, from a scrape of
vercel.com). `src/app/globals.css` now defines `--raw-paper-white: #fafafa`,
`--raw-obsidian: #171717`, `--raw-hairline: #ebebeb`, `--raw-stone: #666666`,
`--raw-terminal-green: #297a3a` etc. verbatim and maps them into the shadcn semantic slots.
Also adopted from the source spec exactly: role-based radius (`2px` nav items via
`rounded-sm` on `SidebarMenuButton`, `6px` cards/buttons, full pill for status), the
"hairline card" two-ring `box-shadow` technique (`.surface-ring` utility in globals.css,
applied to Card/StatStrip/DataTable container instead of a plain border), heading weight
450 instead of 600 (`PageHeader`'s `<h1>`), and the source's own "Eyebrow Label" component
(Geist Mono, uppercase, 11px, 0.071em tracking) — scoped deliberately to sidebar group
labels only via a new `.label-eyebrow` utility, not stamped above page content (that would
be exactly the generic-AI eyebrow tell this project's own docs warn against).

**2. Per-page architecture, not one shell reused everywhere.** This was the substantive
half of the feedback: every page had the same generic "stack of cards" content shape
regardless of what the page actually needed. Three pages now have three different
structures:
- **Dashboard** (`src/app/dashboard/page.tsx`): tiered layout — `StatStrip`, then a 2:1
  split of the trend chart beside a new `NeedsAttentionPanel`
  (`src/app/dashboard/needs-attention-panel.tsx`, ranks campuses by fee shortfall +
  pending admissions — "who needs me right now," separate from "how does everyone
  compare"), then the full comparison table.
- **Student detail** (`src/app/dashboard/students/[studentId]/page.tsx`): rewritten from
  header-then-stacked-tabs into a sticky 280px identity rail (avatar, status, admission/
  campus/class facts, guardian contact) beside tabbed content (Overview/Attendance/Fees).
  The old separate "Guardians" tab folded into the rail — guardian contact is an always-
  relevant fact, not tab-worthy content that should disappear when another tab is open.
- **Students list**: unchanged in shape (full-width table + toolbar was already the right
  answer for "show me the rows").

`DESIGN_SYSTEM.md` and `DESIGN.md` both rewritten again to document the exact sourced
tokens (with an honest accounting of what's literal vs. what's an added extension — Focus
Blue, Signal, Danger aren't in Vercel's marketing-page palette, which has no form/status
concepts to extract) and the "one shape per job" layout principle, so future pages get
built by asking which of the three existing shapes fits (or a genuinely new fourth one),
not by copying whichever page is closest.

## 2026-09-13 — Vercel/Geist system pivot (still Phase A)

User feedback on the first design-rigor pass: it still "tasted the same" — a color/font swap
isn't a real system, and the component layout/positioning read as a reskin of `product/web`,
not a distinct architecture. Explicit direction: follow **Vercel's actual Geist design
system**, specifically, not an invented palette. This is a genuine token-level rewrite, not
another retouch:

- **True monochrome palette**: every neutral token (background, surface, border, muted text)
  is now zero-chroma oklch — no blue-slate "ink," no warm paper tint. Primary is near-black.
- **One saturated color, one job**: `--ring` is now a vivid geist blue used only for the
  keyboard-focus ring — Vercel's own signature move against an otherwise grayscale UI.
- **Status Dot replaces colored badges**: `src/components/status-dot.tsx` — a small colored
  dot + plain text, matching Vercel's deployment-status convention. Applied to student
  status, fee status (table + filter), and campus fee-collection health. Colored badge
  pill fills are gone from the demo entirely.
- **Stat Strip lost its icons**: label + figure only, no icon column — matches how Vercel's
  own usage/summary rows are built (plain, not icon-decorated).
- **New `PageHeader` component** (`src/components/page-header.tsx`): every page now opens
  with the identical slot (title, description, right-aligned actions, hairline bottom
  border) instead of each page hand-rolling its own `<h1>`/`<p>` block — this is the
  concrete fix for "positioning/consistency isn't there across pages."
- `DESIGN_SYSTEM.md`, `PRODUCT.md`, `DESIGN.md` all rewritten to describe this system as the
  actual target (Vercel's Geist system specifically), not as one of several loose
  inspirations. Read `DESIGN.md`'s Overview section for the full named-rules version.

Sidebar's active-nav-item style needed no change — it already used a light neutral fill
(`sidebar-accent`) rather than a solid color block, which turned out to already match
Vercel's own settings-sidebar convention once the underlying tokens went monochrome.

## 2026-09-13 — Design-rigor revision pass (still Phase A)

Ran the `impeccable` skill against the Phase A demo per user feedback. Wrote
`PRODUCT.md` and `DESIGN.md` (the skill's own project-context files — read these first;
`DESIGN_SYSTEM.md` is this project's own prose reference, `DESIGN.md` is the
impeccable-tooling-readable version of the same system, keep both in sync on future
changes). Concrete changes from that pass:

- **Typography swapped Geist Sans / Geist Mono** for IBM Plex Sans/Mono, per explicit user
  request (also matches `docs/PRODUCT_SPEC.md` Section 9's named references — Stripe,
  Linear, Vercel, shadcn/ui all converge on this pairing).
- **Fixed an actual anti-pattern violation**: the original `StatTile` used a 3px colored
  `border-left` as the accent device — this is an explicit banned pattern (side-stripe
  borders). Replaced with `StatStrip` (`src/components/stat-tile.tsx`): one bordered panel
  divided by hairlines, tone carried by the number/icon color only.
- **`muted-foreground` darkened** (oklch L 0.5 → 0.46) for safer body-text contrast against
  `--background`.
- **Students list filters are now genuinely compound**: Class + Section (both Combobox) +
  Fee status (Select) + search, all AND-composed in one toolbar row, with a "Clear filters"
  action and a live "N of 214" count — answers "this class, this section, unpaid fees" in
  one pass instead of three separate trial-and-error steps.
- **Added a campus-scope picker** to the header (`src/components/campus-scope-picker.tsx`)
  — a concrete instance of the Section 7 multi-campus-scoping requirement, defaults to "All
  campuses" for the mocked Super Admin viewer.

Not done in this pass: `.impeccable/design.json` sidecar (only matters for impeccable's
live in-browser variant panel, which isn't in use this session — regenerate it if `live`
mode gets used later). No new pages were added — this pass only revised the existing 4
demo screens + shell, staying inside Phase A's scope.


Self-documenting log so a different session/agent can resume without this conversation's
context. Update this file as work continues — current phase, what's done, what's pending.

## Current phase: A (design demo) — awaiting review

Per the rebuild brief: build a small representative set of screens on mock data, lock the
visual language and interaction patterns, then stop for review before Phase B (all pages)
and Phase C (real backend wiring). **Do not proceed to Phase B until the user has reviewed
this demo and said to continue.**

## What exists right now

- **Stack scaffolded**: Next.js 16.3.4, React 19.2.8, Tailwind v4, TypeScript ^5, shadcn
  `base-nova` style (`@base-ui/react`, not Radix — every trigger-style component takes a
  `render` prop, not `asChild`; see any file under `src/components/ui`). Versions matched
  to `product/web/package.json` exactly. Runs on **port 3200** (`npm run dev`, from repo
  root or this folder — it's an npm workspace, so `node_modules` hoists to the repo root).
  Port 3100 is already used by `provider/web`'s dev server on this machine — don't reuse it.
- **`DESIGN_SYSTEM.md`**: the token system, typography, radius/elevation rules, layout
  principles. Read this before adding any new screen — it's the contract for whether a new
  page's styling is "on system" or not.
- **Sidebar/nav shell**: `src/components/app-sidebar.tsx` (shadcn `Sidebar`, permission-
  driven via a `permissions: string[]` check — same principle as `product/web`'s
  `dashboard-sidebar.tsx`, new implementation) + `src/components/site-header.tsx` +
  `src/app/dashboard/layout.tsx`. Only 3 nav items exist so far (Overview, Students,
  Campuses-placeholder) — Phase B adds the rest of the Section 6 inventory group by group.
- **Dashboard/overview screen** (`src/app/dashboard/page.tsx`): Super Admin's read-only,
  cross-campus monitoring view — stat tiles, an enrollment trend chart
  (`campus-enrollment-chart.tsx`, shadcn `Chart`/Recharts), a campus comparison table
  (`campuses-overview-table.tsx`). Deliberately not data-entry-shaped, per the brief's
  Super Admin philosophy. Campus drill-down (`/dashboard/campuses/[id]`) is **not** built
  yet — the chevron in the table is a visual affordance only; wire it in the Phase B
  Institute & Structure batch.
- **List+table screen** (`src/app/dashboard/students/`): `DataTable` (generic, reusable,
  `src/components/data-table.tsx`, built on `@tanstack/react-table` v8 — sorting, pagination,
  column visibility, Empty-state fallback) + `columns.tsx` + a search input + a `Combobox`
  class filter (`student-filters.tsx`) + `loading.tsx` skeleton shaped like the table.
  214 mock students (`src/lib/mock/students.ts`).
- **Interaction patterns demonstrated on the Students list** (this is the point of Phase A):
  - Single-field quick edit → `student-status-popover.tsx` (Popover, not a dialog).
  - Medium form tied to a row → `edit-student-sheet.tsx` (side Sheet, list stays visible).
  - Destructive/hard-to-reverse action → `deactivate-student-dialog.tsx` (Alert Dialog).
  - Row actions menu → `student-row-actions.tsx` (Dropdown Menu), never a bare button pile.
- **Detail/drill-down screen** (`src/app/dashboard/students/[studentId]/page.tsx`):
  breadcrumb, header, `Tabs` (Overview / Attendance / Fees / Guardians). Attendance and Fees
  tabs intentionally show `Empty` state with an explanation, not fake data — those modules
  don't exist yet.
- **Mock session** (`src/lib/mock/session.ts`): shaped exactly like the real
  `GET /api/v1/auth/me` response so Phase C is a data-source swap, not a restructure.
  Currently a single fixed Super Admin viewer with the full permission set — Phase B should
  add a role-switcher fixture once more pages exist, so scoped-role behavior (Incharge/
  Teacher campus pickers) can be reviewed screen-by-screen too.

## Verified

- `npx tsc --noEmit` — clean.
- `npx eslint .` — clean except one expected warning (`@tanstack/react-table`'s
  `useReactTable` can't be safely memoized by the React Compiler — known/accepted upstream,
  not a bug).
- `npm run dev` — `/dashboard`, `/dashboard/students`, `/dashboard/students/[id]` all render
  server-side with the expected content, no console/runtime errors in the dev log.
- Not yet checked in a real browser (no browser automation available this session) — the
  user should open `http://localhost:3200` and confirm the visual design before Phase B.

## Explicitly not done yet (by design, not oversight)

- No real API calls anywhere — Phase C only.
- No shared API-error-to-toast handler yet (Section 7 of the brief) — nothing to handle
  until Phase C wires real requests.
- No role switcher — only Super Admin is mocked.
- Only 2 of the ~60+ Section 6 pages exist (Students list+detail, dashboard overview) plus
  the nav shell. This is intentional for Phase A ("small set of representative screens").
- Campus drill-down page, Users page, and every other sidebar-adjacent module: not built.

## Next steps (after Phase A is approved)

1. Batch Phase B by module per the brief (don't build all 60+ at once): start with
   **Institute & Structure** (Institute settings, Campuses incl. the drill-down, Academic
   years, Classes, Sections, Incharge scopes, Delegations, Terminology overrides, Feature
   config), then **People**, then the rest of Section 6's grouping.
2. Each batch: build on mock data, using `DESIGN_SYSTEM.md` + the 4 patterns already
   proven here (Popover/Sheet/Alert Dialog/Dropdown) plus the Section 5 patterns not yet
   demonstrated (multi-step route+step-indicator for admissions/exam-scheduling/promotions).
3. Stop after each batch for review, per the brief — do not run ahead.
