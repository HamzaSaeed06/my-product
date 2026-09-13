# web-v2 Progress

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
