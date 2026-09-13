# Design

## Visual Theme

Precise, confident, institutional — closer to a control panel than a
consumer app. Pure white (light) / near-black (dark) surfaces carry no brand
tint; the brand identity lives entirely in the primary green and the sparing
gold accent, never in the background. This is a deliberate choice: the
"forest-green-on-cream" combination is a well-known generic AI default and
was explicitly avoided.

Deep green was chosen over the more conventional SaaS blue/purple to read as
trustworthy and institutional (education, growth, "in the black") without
tipping into anything playful or organic-crunchy. The gold accent is used
sparingly — badges, highlights, a wordmark detail — never as a structural
color (menu hovers, selected states use neutral tints, not gold).

## Color Palette (OKLCH)

Defined in `src/app/globals.css`. Both light and dark are fully specified;
the app defaults to light (no theme toggle wired up yet — see Open Items).

| Role | Light | Dark | Use |
|---|---|---|---|
| `background` | `oklch(1 0 0)` pure white | `oklch(0.12 0.006 145)` near-black | Page background |
| `foreground` | `oklch(0.19 0.02 145)` | `oklch(0.96 0.01 145)` | Body text |
| `primary` | `oklch(0.32 0.13 142)` deep green | `oklch(0.55 0.14 142)` | Buttons, links, focus rings, brand mark |
| `primary-foreground` | `oklch(0.98 0.01 145)` | `oklch(0.98 0.01 145)` | Text on primary — always near-white |
| `secondary` / `muted` / `accent` | `oklch(0.96 0.006 145)` | `oklch(0.22-0.24 0.01 145)` | Structural tinted-neutral surfaces (inputs, hover states, subtle panels) — intentionally NOT the brand gold |
| `muted-foreground` | `oklch(0.46 0.015 145)` | `oklch(0.65 0.015 145)` | Secondary text |
| `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Errors — kept as shadcn's conventional red, unrelated to brand identity |
| `border` / `input` | `oklch(0.90 0.008 145)` | `oklch(1 0 0 / 10%)` | Borders, input outlines |
| `--brand-accent` (custom, not a shadcn built-in role) | `oklch(0.72 0.14 75)` warm gold | `oklch(0.75 0.14 75)` | Sparing second brand color — badges, highlighted metrics, a wordmark detail. Always paired with white/near-black text per the mid-luminance-saturated-fill rule, never wired into structural hover/select states. |
| `--success` / `--success-foreground` | `oklch(0.6 0.16 152)` | `oklch(0.72 0.17 152)` | Positive status only (delta badges, success pills) — a **different** green from `--primary` on purpose: this is a green-brand product, so a status color identical to the brand action color would read as "clickable" where it should read as "positive metric." Same /10-/20 tinted-background pattern as `--destructive`. |
| `--warning` / `--warning-foreground` | `oklch(0.72 0.16 70)` | `oklch(0.78 0.17 70)` | Pending/attention status (e.g. a pending-admissions count) — same tinted-background pattern. |

Color strategy: **Restrained** (tinted neutrals + one accent used sparingly)
— the correct default for product/app-shell register, per the brief's
"clarity over decoration" principle. Status vocabulary (success/warning/
destructive) stays semantic-only per product.md's own rule — never used as
decoration, only as a real state indicator (a delta, a pending count, an
error).

## Typography

Geist Sans (shadcn's default for this init) — a single family, multiple
weights. No second display face: this is a utilitarian admin tool, not an
editorial surface, and pairing fonts would add a decision with no payoff
here. Geist's geometric-but-humanist character already reads as "modern,
efficient" per the brand personality.

## Radius

`--radius: 0.5rem` (8px) — tighter than shadcn's 10px default, for a
crisper, more precise feel (Linear-adjacent), consistent with "efficient"
over "soft/friendly."

## Components

shadcn/ui, `nova` style, `neutral` base, Lucide icons — installed as-needed
per screen, not bulk-installed upfront. Installed so far: button, card,
input, label, alert, skeleton, separator, avatar, dropdown-menu, sonner,
**chart** (added for the Super Admin dashboard rebuild — the official
`ui.shadcn.com/docs/components/base/chart` wrapper around Recharts 3;
`src/app/dashboard/reports/charts.tsx`'s `BarChartCard`/`LineChartCard`/
`AreaChartCard` all use it, never a raw `<Tooltip />` or hand-rolled
styling — that was the pre-rebuild state and read as generic).

### Shared primitives (not shadcn — this app's own, reused across pages)

- **`src/components/data-table.tsx`** — the shared sortable/searchable/
  paginated list-page primitive (client-side sort/filter/paginate on an
  already-fetched array). Correct for small-to-medium admin datasets
  (campuses, a single campus's classes/teachers). A dataset that can
  genuinely grow into the thousands (Students institute-wide) needs
  server-side pagination instead, matching the Students page's existing
  `/search` endpoint — not this component as-is.
- **`src/components/delta-badge.tsx`** — the "+3.6%" / "-0.8%" pill for KPI
  cards, using the new `--success`/`--destructive` tokens. Renders "New"
  (a neutral pill) instead of a fabricated percentage when there's no
  honest 30-day-ago baseline to compare against — never invents a number.

### A real Base UI gotcha hit building this

This app's shadcn install uses **Base UI**, not Radix, under the hood
(`components.json`'s `"base-nova"` style). Base UI's composition prop is
`render` (not Radix's `asChild`), and it takes a `ReactElement` directly:
`<Button render={<Link href="/x">Text</Link>} />`, no children needed. A
`Button` also defaults to `nativeButton: true` (it assumes the `render`
target is a real `<button>`) — composing it with an `<a>`-rendering
component like `next/link`'s `Link` needs `nativeButton={false}` explicitly,
or Base UI throws a console error about lost button semantics. Every
Link-styled-as-Button in this codebase should follow this pattern.

### A real Next.js Server/Client boundary gotcha

A Server Component (any `page.tsx`/async component doing its own
`apiRequest` fetch) **cannot** pass functions as props to a Client
Component — `"use client"` components' props cross a serialization
boundary, and plain functions (a `DataTable` column's `render`/`sortValue`
closures, for instance) aren't serializable. The fix isn't "make the
render function simpler" — it's **moving the thing that needs the
function-shaped API into its own small Client Component** that receives
only plain, serializable data as props and builds the function-shaped
config (column defs, event handlers, etc.) internally. See
`src/app/dashboard/campuses-table.tsx` for the pattern: `institute-
overview.tsx` (Server Component, does the fetch) passes only
`perCampus: CampusOverview[]` down; `CampusesTable` (`"use client"`) builds
the `DataTable` columns itself.

### The permission-driven convention — nav items and action buttons

**Never gate a nav item, button, or dialog on `roles.includes("SOME_ROLE")`.** Role names drift from what a
role can actually do the moment a backend permission is added, removed, or delegated — confirmed happening
in this app: the sidebar hid Leaves from Incharge and Users from Campus Head despite both holding the real
permission, purely because nobody remembered to update a hand-maintained role→nav-item map. `ApiUser` (see
`src/lib/api.ts`) carries a real `permissions: string[]` — the exact permission-key set `authorize.ts`
enforces server-side (role grants + active Delegations) — fetched fresh on every request via `/auth/me`.
Gate on that instead:

```tsx
const permissions = (await getCurrentUser())?.permissions ?? [];
const canCreate = permissions.includes("leave.create"); // the exact key routes.ts requires
```

Two things this buys, beyond correctness today:

1. **A nav item's visibility check must name the same permission key its backing route actually enforces**
   — grep the module's `routes.ts` for `requirePermission("...")` rather than guessing from the resource
   name (`leave.create` ≠ `leave.edit` ≠ `leave.approve` — verify each action button against its own route,
   not the list route). `src/components/dashboard-sidebar.tsx`'s `NAV_GROUPS` is the reference: every item's
   `anyOf` is a permission key copied verbatim from a real route.
2. **Auxiliary data a page fetches only to feed a create-dialog's dropdown must be gated the same way as
   the dialog itself, not fetched unconditionally.** A real, repeated bug this session: pages like Leaves,
   Complaints, Homework, Assessments, Exams, Sections, Teachers all unconditionally fetched something like
   `/api/v1/students` or `/api/v1/roles` purely to populate a "Create X" dialog's picker — and 500'd outright
   for a viewer (Incharge, in every case found) whose real permission set includes the page's `.view` but not
   its `.create`, because that fetch's own endpoint requires a permission/scope the viewer never had reason
   to hold. Fix: `canCreate ? apiRequest(...) : Promise.resolve([])`, and gate the dialog on the same flag.
   When the fetched data is used only to *label* something (e.g. a campus/academic-year name next to a
   section), and the viewer's role structurally can't see that reference list (Incharge lacks `campus.view`
   by design — their oversight is section-scoped, not institute-wide), degrade gracefully instead: skip the
   fetch, let the existing `?? "—"` fallback show instead of a permission error. Never crash a page over data
   that's cosmetic to the feature the viewer is actually allowed to use.

See `docs/PROJECT_STATUS.md`'s 2026-09-13 (ay) entry for the full list of pages this was found and fixed on.

## Layout Density

Two calibrations of the same system (per PRODUCT.md's design principles) —
not built yet, noted here for when Teacher/Office/Incharge screens arrive:

- **Desktop admin roles** (Super Admin, Principal, Incharge, Office,
  Teacher): dense, table-heavy, keyboard-friendly.
- **Parent/Student**: mobile-first, simplified, glanceable single-column
  layouts, larger touch targets.

## Open Items

- No dark-mode toggle wired up yet (tokens exist, `.dark` class works, but
  nothing sets it). Add `next-themes` when a theme switcher is actually
  needed. (`next-themes` the *package* is already installed — it's a
  dependency of shadcn's `sonner.tsx` template — but nothing renders a
  `<ThemeProvider>` yet, so `useTheme()` always returns its `"system"`
  fallback.)
- No brand mark/logo yet — the login page uses a text wordmark for now.
- `<Toaster />` is now mounted in `src/app/layout.tsx` (it wasn't before
  this pass) — every future mutation (Server Action or client fetch) should
  surface its result via `sonner`'s `toast.success()`/`toast.error()`,
  not a bespoke inline banner.
- The dashboard's `AdminSidebar` (`src/components/dashboard-sidebar.tsx`)
  doesn't collapse/adapt below ~640px — confirmed while testing the
  Institute Overview rebuild at mobile width. Not fixed this pass: it's a
  shell-wide concern affecting every desktop-admin page, not specific to
  Institute Overview, and per PRODUCT.md's own density principle these
  roles (Super Admin/Campus Head/Incharge/Office/Teacher) are desktop-
  first by design — a collapsible-shell pass is legitimate future scope,
  not a defect in what shipped here.

## Session log

- **2026-09-12**: Super Admin "Institute Overview" rebuilt as the proof
  case for a shared frontend foundation (KPI cards with honest delta
  badges, shadcn's real Chart component, the new `DataTable` primitive,
  Sonner wired app-wide) — see `docs/PROJECT_STATUS.md`'s session log for
  the full story, including a small backend change (real 30-day-ago deltas
  computed from `createdAt` history, never fabricated) needed to make the
  KPI deltas honest.
- **2026-09-13**: Sidebar and ~12 dashboard pages rewritten to be
  permission-driven instead of role-name-hardcoded, after finding real
  drift (Leaves hidden from Incharge) and several outright page crashes
  for Incharge caused by unconditional fetches gated on permissions that
  role never held. See the new convention documented above and
  `docs/PROJECT_STATUS.md`'s (ay) entry for the full list.
