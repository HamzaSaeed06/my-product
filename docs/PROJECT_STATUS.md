# Project Status

**Last updated:** 2026-09-11
**Current phase:** Phase 0 complete. Phase 1 backend+frontend complete
(interactive dialogs unverified in-browser — see §1d). **Phase 2 backend
now built**: Students, Parents, Teachers, Subjects, Admissions, Enrollments,
Teacher Assignments — 116 passing integration tests total (46 new). No
Phase 2 frontend yet. See §1e.
**Repo state:** Monorepo scaffolded. `product/api` has a working Express +
TypeScript + Prisma backend implementing all of Phase 0's API surface (auth,
users, roles/permissions, approvals, documents, notifications, audit).
**A real PostgreSQL database is provisioned (Neon) and the full auth
lifecycle has been exercised against it live: login → session created →
refresh (rotation) → logout → session revoked, all confirmed via curl, with
matching entries in the audit log.** `product/web` (Next.js 16 + shadcn/ui)
now has a working login page and protected dashboard shell, both verified
end-to-end against the real backend and real database — see §1b.

---

## 1. What exists right now

### Docs
- `docs/PRODUCT_SPEC.md` — complete, internally-consistent master
  specification. Treat as the locked reference for "what to build." Has a
  signed-off "IMPLEMENTATION APPROVAL" section at the end — Phase 0 work is
  authorized.
- `docs/PHASE_TRACKER.md` — scannable phase-by-phase checklist.
- `docs/README.md` — index / reading order / standing conventions.
- `docs/archive/` — planning docs from a prior, discarded attempt
  (codenamed `D:\sm`) that used a different multi-tenant architecture. Not
  applicable to this codebase. Reference only, never authoritative.

### `product/api` (Express + TypeScript + Prisma) — VERIFIED WORKING

What's actually built and confirmed (not just written — see "How this was
verified" below):

- **Prisma schema** (`product/api/prisma/schema.prisma`) — all 10 Phase 0
  models from the spec (Permission, Role, RolePermission, UserRole, Session,
  AuditLog, ApprovalRequest, Document, Notification, NotificationPreference)
  **plus a `User` model** (see "Deviations from spec" below). `prisma generate`
  succeeds; schema is valid Prisma/PostgreSQL.
- **Auth** (`src/modules/auth/`) — login, refresh (with rotation), logout,
  MFA setup/confirm (TOTP via otplib). Argon2id password hashing. Access
  token = short-lived JWT; refresh token = opaque random string, only its
  SHA-256 hash stored (`Session.refreshTokenHash`), rotated on every refresh.
  httpOnly+secure+sameSite=strict cookies for access/refresh; a separate
  non-httpOnly CSRF cookie for the double-submit CSRF check.
- **Middleware**: `authenticate` (verifies access token + confirms the
  backing Session isn't revoked/expired — this is what makes "password/role
  change invalidates all sessions" take effect immediately, not just at next
  token expiry), `authorize(permissionKey)` (Role→Permission check only —
  Scope/Context/State layers are explicitly deferred to Phase 1+ per a
  comment in the code, not silently skipped), `csrfProtection`
  (double-submit cookie), rate limiters (5/min on login — per-IP, not
  per-account, per spec correction #15 to avoid lockout-DoS), centralized
  error handler (maps `HttpError` and `ZodError` to proper JSON responses).
- **Audit** (`src/lib/audit.ts`) — `writeAuditLog()` helper that redacts
  password/token/secret fields before writing, per spec's "audit log never
  stores secrets" rule. Wired into every mutation across every module below.
  `GET /api/v1/audit` (permission `audit.view`) is the read-only viewer —
  intentionally no create/update/delete routes; audit logs are immutable.
- **Users** (`src/modules/users/`) — list, create, edit, enable/disable
  (disable immediately revokes all sessions), assign/remove role (role
  changes also revoke all sessions, per spec §8). All audited.
- **Roles & Permissions** (`src/modules/roles/`) — list/create/edit/archive
  roles (archiving a system role or one still assigned to a user is
  refused), set a role's full permission set (diffed + audited so the audit
  log shows exactly what changed), list the permission catalog.
- **Approvals** (`src/modules/approvals/`) — `createApprovalRequest()` is a
  service function later phases call directly (result corrections, fee
  waivers, Incharge scope changes, ...) rather than each building its own
  approval table. `GET /approvals` (filter by status) and `POST
  /approvals/:id/decide` (approve/reject, must be PENDING) are the generic
  routes Phase 0 owns.
- **Documents** (`src/modules/documents/`) — multipart upload via multer 2.x,
  whitelisted MIME types (PDF/JPG/PNG/DOCX), random stored filenames
  (never the user-provided name), size-limited. Sensitive documents
  (`isSensitive: true`) are filtered out of listing/download for anyone
  without `document.manage`, per spec's "teacher can't see student identity
  documents by default" rule.
- **Notifications** (`src/modules/notifications/`) — in-app notifications are
  fully functional (list own, mark read, per-user email/in-app
  preferences). **Email sending is a stub** (logs to console) — no SMTP/email
  provider has been chosen yet. `createNotification()` is the internal
  function other modules will call.
- **Seed script** (`prisma/seed.ts`) — creates the 7 core roles and Phase 0's
  permission set, grants all of them to `SUPER_ADMIN`.
- **Bootstrap script** (`scripts/create-super-admin.ts`) — creates the first
  Super Admin user (no self-registration, by design).
- **Tests** — two separate suites, deliberately not run together:
  - `npm test` (`tests/unit/**`, `vitest.config.ts`) — 16 tests, no database
    needed: password hashing round-trip + policy, token sign/verify/tamper-
    detection, refresh token hashing, CSRF token uniqueness, `/health`.
    Safe to run anywhere, including CI without Postgres.
  - `npm run test:integration` (`tests/integration/**`,
    `vitest.integration.config.ts`) — **30 tests, run for real against the
    live Neon database**: Users (create/duplicate-rejection/weak-password-
    rejection/edit/role-assign-revokes-sessions/role-remove/disable-revokes-
    sessions/audit-trail), Roles & Permissions (create/duplicate-rejection/
    set-permissions-diffed-and-audited/unknown-permission-rejection/system-
    role-archive-refused/archive/edit-after-archive-refused), Approvals
    (audit-on-create/list-pending/decide/double-decide-refused/approvedBy-
    recorded), Documents (unsupported-type-rejected/upload/download-exact-
    bytes/sensitive-doc-hidden-without-document.manage/download-denied-
    without-permission/audit-on-upload), Notifications (list-own/mark-read/
    cant-mark-others-as-read/preferences-get-and-set/email-suppressed-when-
    opted-out). All 30 passed on first run. Verified test cleanup leaves
    zero residue (checked actual row counts after the run: 1 user, 7 roles,
    0 leftover documents/approvals/notifications/test-users/test-roles).
  - Integration tests log in **once** via a Vitest `globalSetup`
    (`tests/integration/globalSetup.ts`) that persists the session to a
    gitignored temp file — this is deliberate, to stay under the login
    endpoint's 5-req/min rate limit across ~5 test files.

**Not built yet within Phase 0:**
- Real email delivery (notification service has a stub only — see
  `src/modules/notifications/service.ts`).
- Everything in `product/web` beyond login + dashboard shell (see §1b) —
  which is all of it, since no other screens exist in the spec's Phase 0
  scope anyway.

### 1a. Database — provisioned and verified (Neon Postgres)

- **Connection**: a Neon Postgres database, connection string lives in
  `product/api/.env` (gitignored, never commit it). **This is a real,
  reachable database with a live password in that file — treat `.env` with
  the same care as any other credential, and rotate the password if it's
  ever exposed (e.g. pasted in a chat log, screen-shared, etc.).**
- **This database previously belonged to `D:\sm`'s project** — it had ~41
  tables of that project's full multi-tenant school-management schema
  (schools, students, staff, fee_invoices, admissions, timetable_entries,
  ...) plus 11 tables from `D:\sm`'s own in-progress Phase 0 work. **The user
  explicitly confirmed, twice, after being shown the full table list, to
  wipe it.** The `public` schema was dropped and recreated from scratch —
  none of that data exists anymore. If this was needed for anything else,
  it's gone; there was no backup taken before the wipe (none was requested).
- **What's actually in it now**: exactly this project's Phase 0 schema (11
  tables), migrated via `prisma migrate dev --name init_phase0` (migration
  file committed at `product/api/prisma/migrations/`), seeded with the 7
  core roles + 19 Phase 0 permissions, and one bootstrapped Super Admin user
  (`admin@myproduct.local` — change or replace this via the users API before
  any real use).
- **Verified live against this real database** (not mocked, not assumed):
  `POST /auth/login` → 200 + session created; `GET /auth/me` → 200;
  `POST /auth/refresh` → 200, old session revoked, new one created
  (rotation confirmed); `POST /auth/logout` (with correctly rotated CSRF
  token) → 204, session revoked; subsequent `GET /auth/me` → 401
  `SESSION_INVALID`; `GET /users`, `GET /roles` → 200 with real seeded data;
  `GET /audit` → shows the LOGIN/LOGOUT events with correct actor/session
  IDs and timestamps.
- **Side effect during this session, worth knowing about**: port 4000 was
  occupied by Docker Desktop's backend process (`com.docker.backend.exe`)
  and `wslrelay.exe`, likely forwarding a container's port (possibly
  `D:\sm`'s own dockerized `product/api`, per its `docker-compose.yml`).
  Both were killed to free the port for testing. **If you had a Docker
  container or WSL workload running for another project, it was stopped.**
  Restart Docker Desktop if you need that back.

### 1b. `product/web` (Next.js 16 + shadcn/ui) — VERIFIED WORKING

Scaffolded via `create-next-app` (App Router, TypeScript, Tailwind, src dir)
then `shadcn init` (style `nova`, base **Base UI** — not Radix; see the
gotcha below). Two screens exist, matching the exact scope agreed with the
user (nothing else was in scope):

- **Login** (`src/app/login/`) — email/password form. Uses React 19's
  `useActionState` + a Server Action, not client-side fetch.
- **Dashboard shell** (`src/app/dashboard/`) — shows the logged-in user's
  name/email, a logout control. No other content (nothing else exists to
  show yet — this is intentionally not padded with placeholder widgets).

**Architecture decision — backend-for-frontend via Server Actions, not
direct browser→API calls:** The browser never talks to `product/api`
directly. `src/app/login/actions.ts` and `src/app/dashboard/actions.ts` are
Server Actions that `fetch()` the real Express API **server-to-server**,
read the `Set-Cookie` values Express returns, and re-issue them as this
app's *own* cookies via Next's `cookies()` API (`src/lib/api.ts`'s
`parseCookiePairs()` extracts just the name=value pairs; Next sets its own
httpOnly/sameSite/secure attributes rather than parsing Express's). Reasons:
avoids all cross-origin cookie complexity in the browser, matches how this
will actually deploy (web + api behind one reverse-proxied origin per
PRODUCT_SPEC.md §2), and is the officially-recommended Next 16 pattern per
its own bundled docs (`node_modules/next/dist/docs/.../authentication.md`).
`src/lib/session.ts`'s `getCurrentUser()` is the authoritative server-side
auth check (forwards this app's cookies to `GET /auth/me`); the dashboard
and login pages both call it (login redirects away if already authenticated;
dashboard redirects to `/login` if not). **No client-side auth state, no
token refresh-on-expiry yet** — an expired access token just bounces the
user back to `/login` rather than silently refreshing. Add that when it
becomes annoying enough to matter.

**Design system** — see `product/web/PRODUCT.md` and `DESIGN.md` for the
full rationale. Summary: brand personality "confident, modern, efficient"
(user-confirmed), deep green primary (`oklch(0.32 0.13 142)`) on pure
white/near-black surfaces — deliberately NOT the generic "forest-green-on-
cream" AI default — with a sparing warm-gold second accent reserved for
future badges/highlights, never wired into structural hover states. Geist
Sans (shadcn's default). Radius tightened to 8px. No formal WCAG target at
this stage (explicit user decision).

**Gotcha worth knowing**: this `shadcn init` run picked **Base UI**
(`@base-ui/react`), not Radix, as the underlying primitive library —
different from most shadcn examples/training data. Composable components
use a `render={<Element />}` prop, not Radix's `asChild` + child-element
pattern. Using `asChild` (the Radix convention) produces a real TypeScript
error, not a silent no-op — caught this while building the dashboard's
dropdown menu. Verified the actual prop contract by reading
`node_modules/@base-ui/react/internals/types.d.ts` and
`.../merge-props.js`'s bundled docs rather than assuming.

**Verified live, real end-to-end** (curl simulating the exact multipart
POST a no-JS browser form submission produces — action IDs pulled from the
real rendered HTML / build's `server-reference-manifest.json`, not
guessed): login with valid credentials → 303 to `/dashboard` with
`accessToken`/`refreshToken`/`csrfToken` cookies set **on the Next.js app's
own origin** (proving the BFF proxy works); dashboard renders the real
`fullName`/`email` from the database; unauthenticated `/dashboard` → 307 to
`/login`; already-authenticated `/login` → 307 to `/dashboard`; wrong
password → 200 with "Invalid email or password" rendered in the form;
logout → 303 to `/login`, all three cookies cleared, **and the session
verified truly revoked server-side** (a direct call to the API with the old
cookie afterward returns `SESSION_INVALID`, not just "cookie gone").

**Not verified**: actual visual appearance in a real browser (no browser
automation tool was connected in this environment — `claude-in-chrome` is
listed as available but has no working backend here). Everything above is
proven at the HTTP/data level; nobody has looked at it render yet. Do that
before considering this screen "done" in any visual-polish sense —
`npm run dev:api` (root) and `cd product/web && npm run dev`, then open
`http://localhost:3000/login`.

**Environment gotchas hit while building this** (see session log entry (g)
for full detail): Turbopack builds and even `tsc`/npm install itself were
crashing with what looked like out-of-memory errors; the real cause was the
machine's `C:` drive being nearly full (page file can't grow when the disk
is full, which presents as OOM). Fixed by the user freeing space on `C:`.
Also worked around a separate, real memory issue where `next build`'s
*internal* typecheck step is far more memory-hungry than running `tsc
--noEmit` standalone — `next.config.ts` now sets
`typescript.ignoreBuildErrors: true` with a comment explaining why, and
`npm run typecheck` (plain `tsc --noEmit`) is the actual authoritative type
gate. **A green `npm run build` alone does not prove types are correct** —
always run `npm run typecheck` too.

### 1c. Phase 1 backend (`product/api`) — VERIFIED WORKING

Institute Structure per PRODUCT_SPEC.md's "PHASE 1" section. All of it is
built, integration-tested against the real database (40 new tests, on top
of Phase 0's 30 — 70 total, all passing), and live-smoke-tested.

- **Schema**: `Institute` (singleton — service layer refuses a second row,
  no DB constraint for it), `InstituteSettings` (kept separate per spec's
  explicit rule), `Campus`, `AcademicYear` (institute-scoped, deliberately
  allowed to overlap), `Class` (institute-wide catalog, configurable
  names/order), `Section` (the actual campus+year-specific instance
  students will enroll into in Phase 2 — has `classTeacherId`, a real FK,
  distinct from the TEACHER role itself), `InchargeScope` +
  `InchargeScopeClass` + `InchargeScopeSection` (normalized junction
  tables, `version` field for optimistic concurrency, exactly as the spec's
  Authorization Architecture section specifies).
- **Completed a Phase 0 deviation**: `UserRole.campusId` was a bare
  nullable string in Phase 0 (Campus didn't exist yet, deviation logged at
  the time). Now a real FK to `Campus`, as promised.
- **APIs**: `/institute` (+`/institute/settings`), `/campuses`,
  `/academic-years`, `/classes`, `/sections`, `/incharge-scopes`. Same
  pattern as every Phase 0 module: authenticate → authorize(permission) →
  csrf → rate-limit → zod validation → service → writeAuditLog.
- **Business rules actually enforced, not just documented**: closed
  academic years are read-only (edits refused); campus/class archive is
  refused while active (non-archived) sections exist under them — the
  closest available proxy for spec's "cannot delete campus with active
  students/staff" until Phase 2's Student/Staff models exist; sections
  can't be created in a closed academic year; duplicate names refused
  (institute-scoped for Class/AcademicYear, class+campus+year-scoped for
  Section).
- **Incharge scope**: `createInchargeScope` refuses a user without the
  INCHARGE role. `updateInchargeScope` implements real optimistic
  concurrency — an update with a stale `expectedVersion` gets a 409
  `VERSION_CONFLICT`, never silent last-write-wins, exactly per spec.
  `checkInchargeScope()` (in `src/modules/incharge-scopes/service.ts`) is
  the reusable ALLOW/DENY function future phases' `authorize()` calls will
  layer on top of permission checks once there's an actual resource
  (Timetable, Attendance, ...) for an Incharge to act on — **not wired into
  any route yet**, since Phase 1 has nothing else for it to gate. Tested
  directly (not just via HTTP): assign scope to Class A → ALLOW for A, DENY
  for B → expand scope to A+B → ALLOW for B too → revoke → DENY again.
  `sectionIds` are validated to actually belong to the scope's campus,
  academic year, and one of its assigned `classIds` — a gap caught and
  fixed while building the frontend's section-picker (a scope could
  otherwise reference a section from an unrelated campus).
- **Bootstrap script** (`scripts/create-institute.ts`, mirrors
  `create-super-admin.ts`) — Institute is a singleton, so seeding one is a
  real one-time deployment action, not disposable test data. Run once
  against the dev database with a placeholder name ("Demo Institute",
  type SCHOOL) — **rename this via `PATCH /institute` before any real use.**
- **Verified for real**: all 70 integration tests pass (institute
  singleton/duplicate-refused/update/settings-update; campus create/list/
  update/archive/archive-refused-with-active-section/edit-after-archive-
  refused; academic year date-validation/create/duplicate-refused/update/
  close/edit-after-close-refused; class create/duplicate-refused/update/
  archive; section create/duplicate-refused/closed-year-refused/update/
  archiving-parent-campus-or-class-blocked-then-unblocked-after-section-
  archived; incharge scope non-incharge-user-refused/create/section-scope-
  mismatch-refused/scope-check-allow/scope-check-deny/stale-version-
  refused/version-conflict-free-update/expanded-scope-now-allows/revoke/
  revoke-twice-refused). Live server smoke test confirms all 6 new route
  groups are mounted and correctly require authentication. Row-count check
  after the full test run confirms zero residue beyond the real
  bootstrapped Institute, Super Admin, roles, and permissions.
- **Not done in the backend itself**: `checkInchargeScope` has no route
  consumer yet (expected — nothing to gate until Phase 2/3).

### 1d. Phase 1 frontend (`product/web`) — screens built, server-rendering verified

Six new screens under a shared dashboard sidebar shell
(`src/components/dashboard-sidebar.tsx`, wired into
`src/app/dashboard/layout.tsx` — the header/logout logic that used to live
in `dashboard/page.tsx` moved here so it's shared across every dashboard
route): Institute (profile + settings, singleton edit-in-place, no create
flow needed), Campuses, Academic Years, Classes, Sections, Incharge Scopes.

**Two reusable pieces worth knowing about** (used across all six screens,
not one-off per-page code):
- `src/components/form-dialog.tsx` — the "+ Add X" / "Edit X" dialog
  pattern: open state, submit-via-`useTransition`, inline error, close +
  `router.refresh()` on success. The `<form action={...}>` is bound to a
  **client** function (not passed the server action directly) precisely so
  this open/close/refresh orchestration is possible — a plain `<form
  action={serverAction}>` (the pattern login/logout use) can't do this
  because that path is designed around full navigation/redirect, not
  staying on the same page.
- `src/components/confirm-action-button.tsx` — the "Archive / Close /
  Revoke" confirm-then-mutate pattern, same shape.
- `src/lib/apiClient.ts`'s `apiRequest()` (added this session) is what
  every Server Action above calls — it forwards this app's cookies and CSRF
  token to `product/api`, exactly the pattern already proven correct for
  login/logout, just generalized for GET/POST/PATCH to any endpoint.
- `getCurrentUser()` (`src/lib/session.ts`) is now wrapped in React's
  `cache()` so the layout (auth gate + header) and a page can both call it
  without doubling the network round-trip in one render pass.

**Verified for real**: all 6 pages return 200 when authenticated (and the
layout's auth gate still correctly protects them — unauthenticated access
redirects to `/login`, proven already at the layout level). The Institute
page renders the real bootstrapped institute name ("Demo Institute") pulled
live from the database. Empty-state pages (Classes, Incharge Scopes — no
data exists after integration test cleanup) correctly show their "no X yet"
messaging rather than crashing or showing blank tables. `npm run typecheck`
and `npm run build` both pass.

**Not verified**: the interactive dialogs themselves (create/edit/archive/
revoke button clicks) have not been individually tested in a real browser.
Reproducing them via curl — the trick used for login/logout — doesn't work
here: those two use a plain `<form action={serverAction}>` (a discoverable
no-JS-fallback POST), while every dialog action here is invoked
programmatically via `startTransition` (the JS-driven Server Action call
protocol, not the form-post fallback), which is materially harder to
reproduce by hand. They rely on the same `apiRequest()` cookie/CSRF
forwarding already proven correct for login/logout, so confidence is
reasonably high, but **this is inference, not verification** — click
through each "+ Add", "Edit", "Archive", "Close", and "Revoke" control in
an actual browser before trusting this is done.

### 1e. Phase 2 backend (`product/api`) — VERIFIED WORKING

Academic Structure per PRODUCT_SPEC.md's "PHASE 2" section — Student,
Parent, StudentParent, Teacher, Subject, Admission, Enrollment,
TeacherAssignment, StudentDocument. 46 new integration tests (116 total
with Phase 0/1's 70), all passing against the real database.

- **Schema**: `Student` is deliberately institute/campus-context-free — a
  permanent `studentCode` (STU-00000001, sequential, generated in
  `lib/studentCode.ts` with retry-on-collision) that never changes.
  `Enrollment` is a fully separate model carrying all context (year, class,
  section, roll number) — a student accumulates many Enrollment rows over
  time (transfers, re-admission), never overwritten. `Teacher` sits 1:1 on
  top of a `User` with the TEACHER role (same "must already have the role"
  pattern as Incharge scope/Phase 1). `StudentDocument` formalizes the
  Student↔Document link with a real FK instead of Document's loose
  ownerType/ownerId strings.
- **One active enrollment per academic year** (spec's explicit rule) is
  enforced at the service layer, not a DB constraint — a student can have
  multiple Enrollment rows in the same year (transfer history), but only
  one may be ACTIVE. `transferEnrollment` atomically marks the old row
  TRANSFERRED and creates a new ACTIVE one in a single transaction, never
  mutating history in place.
- **Duplicate detection**: `GET /students/search?q=` and `GET
  /parents/search?phone=` — the frontend will show these as "possible
  existing match" before letting Office create a new record, per spec.
  Office makes the final call; nothing is silently blocked.
- **Withdrawal cascades correctly**: withdrawing a Student also withdraws
  their currently-ACTIVE enrollment (a withdrawn student can't
  simultaneously have an active one) — in one transaction. Re-enrolling a
  withdrawn student (re-admission) automatically reactivates them.
- **Cross-entity consistency validated, not just existence**: creating an
  Enrollment or TeacherAssignment checks the given Section actually
  belongs to the given Class and Academic Year (`SECTION_CLASS_MISMATCH`/
  `SECTION_YEAR_MISMATCH`) — same category of gap as Phase 1's Incharge
  Scope section-mismatch fix, caught proactively this time by writing the
  check before the frontend existed to expose it.
- **Admission ≠ Enrollment** (spec's explicit rule): approving an Admission
  does not auto-create an Enrollment — that's a deliberate separate
  `POST /enrollments` call. Admission decisions are two dedicated routes
  (`/admissions/:id/approve`, `/admissions/:id/reject`) rather than one
  route with a decision body, so `admission.approve` and `admission.reject`
  can be granted independently.
- **DEVIATION from spec**: added `subject.archive` (spec's Phase 2
  permission list only names `subject.view/create/edit`). The blanket
  no-hard-delete policy needs an archive path for every catalog, same
  reasoning as Phase 0's `User` model addition and Phase 1's `Role`
  archive — logged in `schema.prisma`'s comment too.
- **Verified for real**: all 116 integration tests pass, covering (per
  module) — Students: create-generates-code/duplicate-search/detail/
  update-audited/document-upload-and-link/list-documents/withdraw/
  withdraw-twice-refused/archive. Parents: create/phone-search/link-child/
  duplicate-link-refused/list-with-children/unlink. Teachers: non-teacher-
  refused/create/duplicate-profile-refused/update/list/archive. Subjects:
  create/duplicate-refused/update/archive. Admissions: closed-year-refused/
  create/list/approve/double-decide-refused/create-and-withdraw-second/
  approvedBy-recorded. Enrollments: section-class-mismatch-refused/create/
  second-active-refused/transfer-creates-new-marks-old-transferred/still-
  one-active-after-transfer/history-shows-both-rows/withdraw/reenroll-
  reactivates-student. Teacher Assignments: section-class-mismatch-refused/
  create/duplicate-refused/blocks-teacher-archive-while-active/list/
  archive-then-unblocks-teacher-archive. Live server smoke test confirms
  all 7 new route groups are mounted and require authentication. Row-count
  check after the full run confirms zero residue.
- **Not done**: no `product/web` screens for any of Phase 2 yet (Students
  List/Detail, Admission Application, Enrollment, Teachers List, Teacher
  Assignment, Subjects, Parents — all unbuilt, per PRODUCT_SPEC.md's Phase
  2 "Screens" list).

### How this was verified (not just "should work")

In this session, with dependencies actually installed against a real npm
registry:
- `npm install` — clean, 0 vulnerabilities (see §6 for the dependency
  security fixes applied)
- `npx prisma generate` — succeeds against the schema
- `npx tsc --noEmit` — no type errors
- `npm run build` — compiles to `dist/` with no errors
- `npx vitest run` — 16/16 tests pass
- **Booted the built server and hit it over real HTTP**: `GET /health` →
  200 with correct Helmet security headers and CORS headers; malformed
  `POST /api/v1/auth/login` → 400 with proper Zod field errors; rate-limit
  headers present and counting down correctly; unauthenticated requests to
  `/users`, `/roles`, `/audit`, `/notifications`, and `POST /documents` all
  correctly return 401; unknown routes return 404.

What was **not** verified (no Postgres instance available in this
environment): actual DB-backed login (user lookup, session creation,
argon2 verify against a real stored hash), refresh rotation against a real
Session row, or the seed/bootstrap scripts actually writing to a database.
**Do not claim these work until they've been run against a real Postgres.**

## 2. Decided tech stack (from PRODUCT_SPEC.md §3)

**Installed and verified in `product/api`:** express, prisma/@prisma/client
5.22.0 (pinned to latest stable — an 8.0.0-rc is available but RC builds are
not used for production-track work), argon2 0.41 (Argon2id), jsonwebtoken,
otplib (TOTP/MFA), helmet, cors, cookie-parser, express-rate-limit, zod,
vitest 5 + supertest, tsx, typescript 5.6. Exact versions in
`product/api/package.json`.

**Installed and verified in `product/web`:** Next.js 16.3.4 (App Router,
Turbopack — newer than the spec's "14+" floor; see the Next-16-specific
notes in §1b, this version has real breaking changes from what most
training data assumes), React 19.2, TypeScript 5, Tailwind CSS 4,
shadcn/ui (`nova` style, **Base UI** primitives — not Radix), Lucide icons,
Zod, `server-only`. **Not yet added:** React Hook Form, TanStack Table,
Recharts, Sonner (sonner is installed as a shadcn component but not wired
up) — none were needed for a 2-field login form and a static dashboard
shell; add them when a screen actually needs them.

**Frontend:** Next.js 14+ (App Router), React 18+, TypeScript 5+, Tailwind
CSS 3+, shadcn/ui, Lucide icons, React Hook Form + Zod, TanStack Table,
Recharts, Sonner.

**Backend:** Node.js 20+, Express.js, TypeScript 5+, PostgreSQL 15+,
Prisma 5+, Zod, JWT (access + refresh, httpOnly cookies + CSRF per §8),
Vitest + Supertest.

**Architecture:** Modular monolith (not microservices), single-tenant
deployment (one customer = one isolated deployment they host themselves).

**Planned repo layout:**
```
product/
  web/        # Next.js frontend (customer-facing app, all 7 roles)
  api/        # Express backend
platform/
  web/        # Provider control panel frontend (Phase 10)
  api/        # Provider control panel backend (Phase 10)
packages/
  shared/     # Shared types, Zod schemas, utilities
docs/
```

## 3. Immediate next action

Phase 0: fully done. Phase 1: backend + frontend built (§1c/§1d), dialogs
not yet click-tested in browser. Phase 2: backend built and tested (§1e),
no frontend yet. What's left, in order:

1. **Build Phase 2's frontend** (Students List/Detail, Admission
   Application, Enrollment, Teachers List, Teacher Assignment, Subjects,
   Parents) — matches the "finish a phase fully before moving to the next"
   approach used for Phase 1.
2. **Click through Phase 1's screens in a real browser** (§1d's "Not
   verified" note) — still outstanding, can be done alongside Phase 2
   frontend work.
3. **Then Phase 3** (Timetable, Attendance, Curriculum, Homework,
   Assessments) — this is also where `checkInchargeScope` finally gets a
   real route to gate.
4. **Minor cleanup, low priority**: wire real email delivery when a
   provider is chosen; consider a session-refresh-on-expiry flow for
   `product/web` once 20-minute re-logins become annoying; rename the
   placeholder "Demo Institute" to something real before any actual use.

## 3a. Deviations from PRODUCT_SPEC.md (and why)

- **Added a `User` model to Phase 0's schema.** The spec's Model Ownership
  Table lists 10 Phase 0 tables and never explicitly names `User`, even
  though `UserRole`, `Session`, `AuditLog.actorId`, `ApprovalRequest`, and
  `Document.uploadedBy` all require one. Clear spec oversight — Phase 0
  cannot ship login without an identity table. Documented directly in
  `schema.prisma`'s header comment too.
- **`UserRole.campusId` is a bare nullable string, no FK.** Campus doesn't
  exist until Phase 1. It'll gain a real relation then — same pattern the
  spec itself used for moving `InchargeScope` from Phase 0 to Phase 1.

## 4. Standing decisions (do not re-litigate without a real reason)

- Single-tenant only. No multi-tenant mode, ever, in this codebase.
- Customer owns hosting, domain, database. Provider never touches customer
  operational data. License validated locally (signed JWT, RS256), heartbeat
  is async/non-blocking.
- 7 core roles (Super Admin, Principal, Incharge, Office, Teacher, Parent,
  Student). Incharge scope is dynamic (many-to-many, overlap allowed) — never
  hardcode "one incharge per range."
- Authorization = Role + Permission + Scope + Context + State. Role alone
  never grants access.
- No hard deletes on financial/academic/identity records — archive/void/
  reverse/withdraw instead, always audited.
- Student ≠ Enrollment. Invoice ≠ Payment ≠ Receipt. Never merge these.

## 5. Dependency security notes

- `npm install` initially reported 7 vulnerabilities (5 moderate, 1 high, 1
  critical): a `qs` DoS/bypass issue via Express's transitive dependency, and
  a `vitest`/`vite`/`esbuild` dev-server path-traversal chain (dev-only,
  never runs in production, but fixed anyway).
- Fixed via: root `package.json` `overrides: { "qs": "6.16.0" }`, and bumping
  `vitest` to `^5.0.0` in `product/api/package.json`. Required a clean
  `node_modules`/lockfile reinstall for the override to actually resolve —
  `npm audit fix` alone did not apply it.
- Current state: **0 vulnerabilities** (`npm audit`). Re-run `npm audit`
  periodically as new phases add dependencies.
- This environment gates native/postinstall scripts (Prisma client
  generation, argon2's native build, esbuild) behind an `allowScripts` field
  in the root `package.json` — already approved for the packages that need
  it. If a future `npm install` reports "packages have install scripts not
  yet covered," run `npm approve-scripts <pkg>` for legitimate build tools
  (Prisma, argon2, esbuild, native modules) after checking what the script
  actually does — don't blanket-approve without looking.

## 6. Session log

Append a dated entry every session. Keep entries short — what changed, what's
left, anything the next session needs to know that isn't obvious from the
code/docs themselves.

### 2026-09-11 (j) — Phase 2 backend built: Academic Structure

- User asked to finish each phase properly before moving to the next
  (matches the approach already taken for Phase 1) and to report status +
  a recommendation periodically rather than silently plowing ahead.
- Added Phase 2's schema: Student (permanent studentCode, institute/campus-
  context-free), Parent, StudentParent (join), Teacher (1:1 on User with
  TEACHER role), Subject (institute catalog), Admission, Enrollment
  (separate from Student, carries all context), TeacherAssignment,
  StudentDocument (formalizes the Document link with a real FK).
- Built and wired 7 API modules: students (+ nested document upload/list),
  parents (+ child linking), teachers, subjects, admissions, enrollments,
  teacher-assignments. Same pattern throughout: authenticate → authorize
  → csrf → rate-limit → zod → service → writeAuditLog.
- Enforced the two trickiest business rules for real: "one active
  enrollment per academic year" (service-layer check, not a DB constraint,
  since transfer history needs multiple rows per year) and "Admission ≠
  Enrollment" (approving an admission never auto-creates an enrollment).
- Proactively added cross-entity consistency checks (section must actually
  belong to the given class/year) to Enrollment and TeacherAssignment
  creation, before any frontend existed to expose the gap — learned from
  Phase 1's Incharge Scope section-mismatch fix, applied preemptively here.
- Wrote 46 new integration tests (116 total), all passing against the live
  database on the first full run. Verified zero residue via real row
  counts afterward. Live server smoke test confirms all 7 new route groups
  require authentication.
- **Deviation**: added `subject.archive` (not in spec's Phase 2 permission
  list) for the same no-hard-delete reason as prior deviations.
- **Not done**: no `product/web` screens for Phase 2 yet. Phase 1's
  interactive dialogs are still not click-tested in a browser (carried
  over from the previous entry).
- **Next session should**: build Phase 2's frontend (Students, Admissions,
  Enrollment, Teachers, Subjects, Parents screens) to keep Phase 2 "done"
  in the same complete sense Phase 1 is, then move to Phase 3.

### 2026-09-11 (i) — Phase 1 frontend built: 6 screens under a dashboard shell

- User said (paraphrased): finish phases one at a time, use your own
  judgment on what's next. Decided to complete Phase 1's frontend before
  moving to Phase 2, rather than stacking up unbuilt UI across phases.
- Refactored the dashboard: header/logout moved from `dashboard/page.tsx`
  into a new `dashboard/layout.tsx` (single auth gate for every dashboard
  route now, not just one page), added a sidebar (`dashboard-sidebar.tsx`)
  linking to all six new screens.
- Built two reusable client components used across every screen —
  `form-dialog.tsx` (add/edit dialogs) and `confirm-action-button.tsx`
  (archive/close/revoke confirms) — plus `lib/apiClient.ts`'s
  `apiRequest()`, a server-side authenticated-fetch helper generalizing the
  cookie/CSRF-forwarding pattern already proven for login/logout to every
  other endpoint. Wrapped `getCurrentUser()` in React's `cache()` so the
  layout and a page don't double the network round-trip per request.
- Built all six screens: Institute (profile + settings, singleton
  edit-in-place), Campuses, Academic Years, Classes, Sections (with
  Class/Campus/Year dropdowns), Incharge Scopes (with a user-role filter
  for the Incharge picker and checkbox multi-select for classes/sections).
- Found and fixed a real backend gap while building the Incharge Scope
  section-picker: `createInchargeScope`/`updateInchargeScope` validated
  that `sectionIds` existed but never checked they actually belonged to the
  scope's campus/academic year/assigned classes — a scope could reference
  an unrelated campus's section. Added `SECTION_SCOPE_MISMATCH` validation
  to both, plus 2 new integration tests (70 total now, up from 68).
- Learned Base UI's Select/Checkbox both support `name`/`value` and submit
  through native FormData like real form controls — used this for the
  class/section checkbox groups (`FormData.getAll("classIds")`) instead of
  building a custom multi-select.
- **Verified for real**: `npm run typecheck` and `npm run build` both pass;
  all 6 pages return 200 when authenticated; Institute page renders the
  real bootstrapped institute name from the live database; empty-state
  pages show correctly (no fake/placeholder data).
- **Not done**: the interactive dialogs (the actual add/edit/archive/
  revoke button clicks) are not click-tested in a real browser — curl
  can't easily reproduce the JS-invoked Server Action call protocol these
  use (different from login/logout's plain-form-post fallback). See §1d.
- **Next session should**: click through every dialog in a real browser
  first (§3 item 1), then start Phase 2.

### 2026-09-11 (h) — Phase 1 backend built: Institute Structure + Incharge scopes

- User visually confirmed login works in a real browser (the one open item
  from entry (g)). Then asked to proceed to whatever's next per my own
  judgment, explained in text first.
- Added Phase 1's schema: `Institute` (singleton, service-enforced),
  `InstituteSettings`, `Campus`, `AcademicYear`, `Class`, `Section`,
  `InchargeScope`/`InchargeScopeClass`/`InchargeScopeSection` (normalized
  junctions + `version` field for optimistic concurrency, exactly matching
  the spec's Authorization Architecture section). Completed the Phase 0
  deviation note's promise: `UserRole.campusId` is now a real FK to
  `Campus`.
- Built and wired 6 new API modules (institute, campuses, academic-years,
  classes, sections, incharge-scopes) — full CRUD + archive/close/revoke,
  business rules enforced (closed years read-only, archive blocked while
  active sections exist, duplicate names refused, INCHARGE-role required
  for scope assignment, real optimistic-concurrency conflict on stale
  scope updates).
- Added `scripts/create-institute.ts` (mirrors `create-super-admin.ts`) and
  ran it for real — Institute is a singleton, so this was a genuine
  one-time bootstrap action, not test setup. Created a placeholder "Demo
  Institute" — rename before real use.
- Wrote 38 new integration tests (68 total with Phase 0's) against the live
  database, all passing. Verified zero residue afterward via real row
  counts.
- Hit and fixed a Windows file-lock issue: `prisma migrate dev`'s
  auto-generate step failed with `EPERM` renaming the query engine DLL
  because the still-running dev servers (from the previous session) had it
  loaded. Killed them, regenerated cleanly.
- **Not done**: no frontend screens for any of this yet. `checkInchargeScope`
  is implemented and tested directly but has no route consumer yet —
  correctly so, nothing exists for an Incharge to act on until Phase 2/3.
- **Next session should**: build Phase 1's frontend screens, or move to
  Phase 2 backend (Student/Parent/Teacher/Subject/Admission→Enrollment) —
  see §3.

### 2026-09-10 (g) — product/web built: login + dashboard, verified end-to-end

- Scaffolded `product/web` (create-next-app → Next.js 16.3.4, Turbopack,
  Tailwind 4) then `shadcn init`, which picked **Base UI** primitives
  (not Radix) — a real API difference from most shadcn examples (`render`
  prop, not `asChild`); caught via a genuine TS error, fixed by reading the
  actual bundled type/doc files rather than assuming.
- Ran the `impeccable` skill's init flow: wrote `PRODUCT.md` (confirmed with
  the user: brand personality "confident, modern, efficient", no formal
  WCAG target yet) and `DESIGN.md` (composed a deliberate OKLCH palette from
  a random seed — deep green primary + pure white/near-black, explicitly
  avoiding the generic "forest-green-on-cream" AI default; gold accent
  reserved for later, not wired into structural UI).
- Built login (Server Action, `useActionState`, inline field/form errors)
  and a protected dashboard shell (name/email + logout), both backed by a
  backend-for-frontend pattern: Server Actions call `product/api`
  server-to-server and re-issue its cookies as this app's own — the
  officially-recommended Next 16 pattern (verified against its own bundled
  docs), and it sidesteps cross-origin cookie complexity entirely.
- Improved `GET /auth/me` (`product/api`) to return the full public user
  object instead of a bare `userId` — the dashboard needed it; no test
  depended on the old shape.
- Hit real environment trouble and diagnosed it rather than working around
  it blindly: builds were crashing with apparent OOM errors; root cause was
  `C:` almost completely full (0.2 GB free), which breaks Windows' page
  file growth and presents as memory errors. Investigated what was
  consuming space (found a 6+ GB Docker WSL disk, several GB of Windows
  Update cache, among others) and reported findings before the user did
  their own cleanup. Separately found and worked around `next build`'s
  internal typecheck step being far more memory-hungry than a standalone
  `tsc --noEmit` — see §1b for the `ignoreBuildErrors` + `npm run
  typecheck` split this led to.
- **Verified for real** (curl reproducing the exact multipart POST a no-JS
  browser form submit sends, using real action IDs from rendered HTML and
  the build's server-reference-manifest — not a guess): full login → BFF
  cookie re-issue → dashboard render with real user data → logout →
  server-side session revocation confirmed via a direct API call
  afterward. See §1b for the complete list.
- **Not done**: nobody has looked at this in an actual browser — no
  browser automation tool was connected in this environment despite
  `claude-in-chrome` being listed as available. Visual/interaction QA
  (does it actually look right, is it responsive, keyboard nav) is
  unverified. Session-refresh-on-access-token-expiry is not implemented
  (expired token just bounces to `/login`).
- **Next session should**: open it in a real browser first (§3 item 1),
  then move to Phase 1 or add integration tests for the API modules that
  still lack them.

### 2026-09-10 (f) — Automated integration test suite added, all passing

- Split tests into `tests/unit/` (no DB, default `npm test`) and
  `tests/integration/` (real DB, explicit `npm run test:integration`) with
  separate Vitest configs — kept the fast/safe default suite fast and safe.
- Found and fixed a real gap while doing this: `tsconfig.json` excluded
  `tests/` entirely, so `tsc --noEmit` was never actually typechecking any
  test file, and Vitest's esbuild transpilation doesn't typecheck either.
  Added `tsconfig.typecheck.json` (includes both `src/` and `tests/`) and
  pointed the `typecheck` script at it.
- Wrote 30 integration tests covering Users, Roles/Permissions, Approvals,
  Documents, and Notifications against the live Neon database — see §1 for
  the full list. All 30 passed on the first run. Verified afterward (real
  row counts, not assumed) that test cleanup left zero residue: exactly 1
  user (the bootstrapped Super Admin) and 7 roles (the seed) remain, 0
  leftover test data anywhere.
- Login-rate-limit-safe by design: a Vitest `globalSetup` logs in once for
  the whole run and shares that session across all integration test files
  via a gitignored temp file, rather than each file logging in separately.
- **Phase 0 backend is now considered functionally complete** — built,
  live-verified by hand, and covered by an automated suite. See §3 for
  what's next.

### 2026-09-10 (e) — Real database provisioned, full auth flow verified live

- User provided a Neon Postgres connection string. Before using it,
  introspected it (`prisma db pull --print`, read-only) and found it already
  contained ~52 tables — `D:\sm`'s complete school-management schema plus
  that project's own in-progress Phase 0 tables. Flagged this explicitly
  and got explicit confirmation (twice) before wiping it — see §1a for
  full detail on what was found and destroyed.
- Dropped and recreated the `public` schema, ran
  `prisma migrate dev --name init_phase0` (migration committed), seeded
  roles/permissions, bootstrapped a Super Admin.
- Freed port 4000 (occupied by Docker Desktop's backend + wslrelay, likely
  forwarding a container) to run a live smoke test — see §1a for the
  "worth knowing about" note on what that stopped.
- **Verified for real, against the live database**: full login → me →
  refresh (rotation confirmed) → logout → session-revoked → audit-log-shows-
  it-all cycle, plus `GET /users` and `GET /roles` returning real seeded
  data. This was the single biggest unverified risk from the previous
  session's work — it's now confirmed working.
- **Not done:** automated tests still don't exist for anything beyond
  auth's password/token utilities — everything in this entry was verified
  by hand via curl, not by a test suite. See §3.

### 2026-09-10 (d) — Phase 0 backend: remaining API surface built

- Added `Role.archivedAt` to the schema (no-hard-delete for roles).
- Built and wired: Users API (list/create/edit/enable-disable/assign-role),
  Roles+Permissions API (CRUD + archive + set-permissions), Approvals API
  (generic engine other phases will call into), Documents API (multer 2.x
  upload, sensitive-document gating), Notifications API (in-app working,
  email stubbed — no provider chosen), read-only Audit Log API. All mutating
  routes: authenticate → authorize(permission) → csrf → rate-limit → zod
  validation → service → writeAuditLog, consistently.
- Fixed two things while wiring this up: a bad `findUnique` on a
  nullable-field compound key (Postgres treats NULL as distinct in unique
  indexes — switched to `findFirst` with an explicit application-level
  check), and a corrupted local `.env` line from a shell append that merged
  two vars onto one line (not a code bug, just a footgun — appending to a
  file with no trailing newline via `cat >>` on Windows/git-bash silently
  concatenates; always verify with Read after appending).
- Swapped `multer@1.4.5-lts` (deprecated, upstream recommends 2.x) for
  `multer@^2.3.0` before it ever shipped — 0 vulnerabilities maintained.
- Verified again end-to-end: `tsc --noEmit`, `npm run build`, `vitest run`
  (still 16/16 — no new tests added for the new modules, see §1), and a
  live-server smoke test confirming every new route is mounted and
  correctly rejects unauthenticated requests (401) while unknown routes
  still 404.
- **Not done:** no tests (mocked or real-DB) exist yet for the new service
  logic — write these once Postgres is available, or add mocked-Prisma unit
  tests sooner if that's preferred. Email delivery is still a stub.
- **Next session should:** provision Postgres and run the full flow for
  real (migrate → seed → create-super-admin → login → exercise every new
  endpoint), or start `product/web`.

### 2026-09-10 (c) — Phase 0 backend scaffold: auth/session/audit/authorize

- Scaffolded the monorepo: root `package.json` (npm workspaces), `.gitignore`,
  `product/api` (Express+TS+Prisma), `packages/shared` (empty placeholder).
- Wrote Phase 0's Prisma schema (10 spec models + `User`, see §3a deviation),
  and implemented: password hashing (Argon2id), JWT access tokens, opaque
  hashed+rotated refresh tokens, Session-backed `authenticate` middleware,
  permission-based `authorize()` middleware (Role+Permission only — Scope/
  Context/State deferred to Phase 1+ by design, not oversight), double-submit
  CSRF, per-IP login rate limiting, MFA (TOTP) setup/confirm, redacting audit
  log writer, a Phase 0 seed script (7 roles + permissions), and a
  create-super-admin bootstrap script.
- Verified for real: `npm install` (0 vulnerabilities after fixing qs +
  vitest advisories — see §5), `prisma generate`, `tsc --noEmit`, `npm run
  build`, `vitest run` (16/16 passing), and booted the built server to
  confirm `/health` and `/api/v1/auth/login` actually respond correctly over
  HTTP with proper security headers, CORS, and validation errors.
- **Not done / explicitly deferred:** no real Postgres was available in this
  environment, so DB-backed behavior (actual login round-trip, session
  rows, seed/bootstrap scripts writing data) is unverified — do not assume
  it works without testing against a real database first. Role/Permission
  management, Approval, Document, and Notification APIs are not built yet
  (models exist, no service/routes). `product/web` doesn't exist yet.
- **Next session should:** provision Postgres and verify the DB-backed auth
  flow end-to-end, or continue building out the remaining Phase 0 API
  surface — see §3.

### 2026-09-10 (b) — Spec verified against original requirements, approved

- Cross-checked `PRODUCT_SPEC.md` end-to-end against the user's original,
  independently-written requirements dump (roles, permission model, UI
  screens/sidebars per role, workflows, business rules) to confirm the phase
  division actually reflects what was asked for. No gaps or contradictions
  found — the spec already matches faithfully.
- Closed the spec's own "PENDING HUMAN APPROVAL" gate: added an
  "IMPLEMENTATION APPROVAL" section at the end of `PRODUCT_SPEC.md` recording
  the user's explicit go-ahead. Phase 0 is now authorized to start.
- **Next action:** scaffold the Phase 0 monorepo skeleton and begin
  implementing Phase 0 models/middleware per `PRODUCT_SPEC.md`.

### 2026-09-10 (a) — Docs reorganized for fresh start

- Discovered this repo (`D:\my Product`) was empty except for `docs/` copied
  from a different, unrelated repo (`D:\sm`) that has real (but architecturally
  different, multi-tenant) code and in-progress work. User confirmed: ignore
  `D:\sm`, this repo starts from zero code, spec-only.
- Archived the 4 docs that described migrating `D:\sm`'s multi-tenant code
  (`ALIGNMENT_PLAN.md`, `DOCUMENTATION_UPDATE_SUMMARY.md`,
  `SPEC_CORRECTIONS_APPLIED.md`, old `BUILD_STATE.md`) into `docs/archive/` —
  none of it applies to a zero-code repo.
- Created `PROJECT_STATUS.md` (this file), `PHASE_TRACKER.md`, and `README.md`
  as the new living status/index docs so any future agent can orient itself
  without re-deriving context.
- No code written. No dependencies installed. No commits made yet (repo has
  zero commits — first commit is still pending, awaiting user go-ahead).
- **Next session should:** confirm with the user whether to scaffold the
  Phase 0 monorepo skeleton, then start implementing Phase 0 per
  `PRODUCT_SPEC.md`.
