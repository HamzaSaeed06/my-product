# Phase Tracker

Legend: 🔴 Not Started · 🟡 In Progress · 🟢 Complete · ⏸️ Blocked

A phase moves to 🟢 only when every item in its "Acceptance Criteria" list
(full detail in `PRODUCT_SPEC.md`, section "COMPLETE IMPLEMENTATION ROADMAP")
is checked AND its tests pass. Update the status column here the moment a
phase's state changes — this table is what a new agent scans first.

| # | Phase | Goal | Depends On | Est. Duration | Status |
|---|-------|------|------------|----------------|--------|
| 0 | Foundation | Authorization, Audit, Approval workflow, Notifications, File storage — the substrate every other phase needs | — | 1-2 wk | 🟡 |
| 1 | Core Authorization & Super Admin | Institute config, Campuses, Academic Years, Classes/Sections, Users, dynamic Incharge scopes | 0 | 2-3 wk | 🟡 |
| 2 | Academic Structure | Students, Parents, Teachers, Subjects, Admission → Enrollment workflow | 1 | 3-4 wk | 🟡 |
| 3 | Academic Operations | Timetable, Attendance (student+teacher), Substitution, Curriculum, Homework, Assessments | 2 | 4-5 wk | 🟡 |
| 4 | Results & Promotion | Exams, Result workflow (Draft→Submitted→Reviewed→Finalized→Published), Report cards, Promotion/Class jump | 3 | 3-4 wk | 🟡 |
| 5 | Finance Module | Fee structures, Invoicing, Payments (cash+gateway), Receipts, Refunds, Reconciliation, Cash closing | 2 | 4-5 wk | 🟡 |
| 6 | Operations | Leave management, Complaints | 0, 2, 3 | 2-3 wk | 🟡 |
| 7 | Portals & Role-Based Experiences | Principal / Incharge / Office / Teacher / Parent / Student UIs on top of the above | all prior | 4-5 wk | 🟡 |
| 8 | Reports & Analytics | Cross-module reporting (academic, attendance, finance, staff) | all prior | 3-4 wk | 🟡 |
| 9 | Online Payment Integration | Payment gateway (Easypaisa/JazzCash-style), webhook idempotency, reconciliation | 5 | 3-4 wk | 🟢 |
| 10 | Provider Platform | Provider-side control plane: customer/license/deployment management, heartbeat, support tickets | 1 | 4-5 wk | 🟢 |
| 11 | Multi-Campus Governance & Workflow Routing | Campus Head/Office campus-scoping (**backend complete**), temporary delegation, staff attendance verification, leave/complaint routing, admission inquiries, CNIC/login-identifier, homework/syllabus flexibility, list-page UX overhaul | 1, 2, 6 | TBD | 🟡 |
| 12 | Dynamic Institution Architecture | Configurable UI terminology (institute-scoped), role `systemKey`/display-name separation, generic institution-governance policy model (Mandatory/Default/Campus-Controlled), zero-friction single-campus setup | 11 (Gap 2 shares files with Phase 11 Phase A) | 2026-09-12 | 🟡 backend done, frontend not started |

Design docs for Phases 11 and 12 exist and are under discussion, not yet approved for coding:
[`PHASE_11_MULTI_CAMPUS_AND_WORKFLOWS.md`](PHASE_11_MULTI_CAMPUS_AND_WORKFLOWS.md),
[`ROLE_PERMISSION_MATRIX.md`](ROLE_PERMISSION_MATRIX.md) (full role/permission gap analysis feeding into
Phase 11), and [`DYNAMIC_INSTITUTION_ARCHITECTURE.md`](DYNAMIC_INSTITUTION_ARCHITECTURE.md). Standing
engineering rules that apply to every phase (edge-case checklist, never-trust-the-frontend, no-hardcoding,
feature-completion definition) are in [`ENGINEERING_PRINCIPLES.md`](ENGINEERING_PRINCIPLES.md).

**Total estimated: ~6-9 months** for a single developer working sequentially;
faster with parallelization across independent branches (e.g., Phase 6 can run
alongside Phase 4/5 once Phase 0/2/3 are done).

## Current focus

**Phase 0 — complete.** **Phase 1 — backend and frontend both built** (70
integration tests; 6 screens under the dashboard sidebar). **Phase 2 —
backend and frontend both built**: Students (list/search/detail/enroll/
transfer/withdraw/documents), Parents (+ child linking), Teachers, Subjects,
Admissions (+ approve/reject/withdraw), Teacher Assignments — 116
integration tests total, 18 pages across both phases. **Phase 3 — backend
and frontend both built**: Timetable (+conflict detection), Attendance
(+correction workflow), Teacher Attendance, Substitution, Curriculum/
Progress, Homework, Assessments (+marks lock/correction) — 168 integration
tests total, 25 pages total, all smoke-tested authenticated-200. **Phase 4
— backend and frontend both built**: Exams (+schedule conflict detection),
Result workflow (Draft→Submitted→Reviewed→Finalized→Published, +correction
workflow), Report Cards (JSON snapshot), Promotion (Promote/Repeat/Pending
immediate, Class Jump requires approval) — 209 integration tests total, 29
pages total, all confirmed passing/rendering across several verification
runs. Server-rendered data verified live on every page; the interactive
dialogs across all four phases are built on the same proven cookie/CSRF
pattern as login/logout but have not been individually click-tested in a
real browser (a genuine attempt to reproduce the JS-invoked Server Action
protocol via curl hit real complexity — React Flight's multipart argument
encoding, not just field names — documented as a known gap rather than
pursued further). Incharge scope checks (`checkInchargeScope`) still have
no route consumer — Phase 3/4's routes are gated by plain permission
checks only. **Phase 5 — backend and frontend both built**: Fee
Structures, Invoicing, Payments (cash + a manual-trigger online-gateway
state machine, +reversal approval workflow), Refunds, Discounts, Waivers,
Cash Closing, Reconciliation Exceptions — confirmed via a fully clean
**39-file, 269-test** run spanning Phase 0-5 together (the first such
clean full-suite run since Phase 3 was added) plus 8 new pages, 37 total,
all smoke-tested authenticated-200. Getting to that clean test run
surfaced and fixed 3 real bugs (2 Zod-validation-ordering issues, a Prisma
transaction-timeout fix, plus a session auto-refresh added to the test
harness itself) — see `PROJECT_STATUS.md` §1k. An intermittent Neon
connection drop (P1001) during long test runs was separately investigated
and confirmed to be external flakiness, not a code defect — see §5a.
Interactive dialogs across all five phases remain not individually
click-tested in a real browser — the one open item standing between
"built" and "actually done" for the whole product so far. **Phase 6
backend built**: Leave management (Student/Teacher, retrospective
detection, approve/reject/cancel) and Complaints (6-state lifecycle:
Open→Assigned→In Progress→Resolved→Closed→Reopened, investigation notes,
cannot-close-without-resolution rule) — 26 new integration tests, all
passing against the real database. Closes a deferral logged back in
Phase 3: an approved Leave now auto-overrides a teacher's ABSENT mark to
LEAVE in `markAttendance`, verified by a dedicated cross-module test.
**Phase 6 frontend built**: Leaves (single list page) and Complaints
(list + per-complaint detail page driving its lifecycle) under a new
"Operations" sidebar group — 39 pages total, smoke-tested
authenticated-200 against live dev servers via the established curl
login technique. **Phase 7 backend built**: permission grants for all 6
non-SUPER_ADMIN roles (previously only SUPER_ADMIN had any — everyone
else was locked out of every route), `userId` login linkage added to
Student and Parent (previously only Teacher could log in at all), a new
`src/lib/scope.ts` data-scoping layer wired into ~14 modules so a
Teacher/Parent/Student/Incharge only sees their own section/children/
self/scope — 12 new dedicated tests, all passing. **Phase 7 frontend
built**: a role-filtered `/dashboard` sidebar for staff roles, plus a
brand-new mobile-first `/portal` shell (9 pages: Overview, Timetable,
Attendance, Homework, Leave, Results, Report Card, Fees, Complaints) for
Teacher/Parent/Student — genuinely new UI per spec's mobile-first
requirement, not a filtered admin reuse. Live-verified by logging in as
all 4 role shapes (Super Admin, Teacher, Parent, Student) against real
running dev servers — correct post-login redirect per role, every page
200 with accurate empty states, zero error-boundary text. 48 pages
total. Bespoke Principal/Incharge/Office dashboard home pages (they
currently reuse the shared admin Overview) are a deliberate, documented
follow-up. **Phase 8 backend built**: 5 report categories (Academic,
Attendance, Financial, Admissions, Staff) computed live from real data
via genuine Prisma aggregation — verified against a fixture with known
marks, asserting exact computed percentages, not just "data returned."
CSV export gated by a separate `report.export` permission per spec — 9
new tests, all passing. **Phase 8 frontend built**: Report Center + 5
Viewer pages with `recharts` charts and a same-origin CSV-download
route. Live verification caught and fixed a real bug: a role with
`report.view_X` but not the permission for a filter dropdown's
supporting data (e.g. Office viewing Financial reports without
`exam.view`) was crashing with a raw 500 — now degrades gracefully
(page still renders, filter list just narrower) while a genuine
report-permission denial shows a clean message. 55 pages total. All
Phase 0-8 backends and frontends are now built; interactive dialogs
across all eight phases remain the one standing item not yet
click-tested in a real browser. PDF/Excel export and scheduled report
generation are deliberate, documented deferrals. **Phase 9 backend
built**: a real HMAC-SHA256 signed payment-gateway webhook flow —
Payment Gateway config (`payment_gateway.manage`), initiate/checkout/
confirm/cancel on the payer's own hosted checkout screen, a public
`payment-callback` endpoint authenticated purely by signature (not
session/CSRF, matching a real gateway), and a reconciliation summary —
covering all 10 of spec's named test scenarios (successful/failed/
pending payment, duplicate callback, amount mismatch, unmatched
transaction, concurrent payments, invalid signature, reconciliation,
refund through gateway) plus 2 scope tests, 12/12 passing. Closes a
real (if narrow) double-payment race by adding a `FOR UPDATE` row lock
to both the new webhook path and Phase 5's pre-existing cash-payment
path. Two real issues root-caused and fixed during verification: a
self-HTTP-loopback design that hung inside the test harness (removed in
favor of an in-process function call carrying the same signed payload),
and several tests' default timeout being too tight for genuine chained-
call Neon latency (raised just those tests' timeouts, not the service
code). **Phase 9 frontend built**: a real Parent Portal Pay Online flow
(replacing the old "pay through the office" placeholder), an admin
Payment Gateway config screen, and a staff Reconciliation dashboard —
60 pages total, live-verified end-to-end via curl against real running
dev servers (a parent paid a real invoice online; its status flipped
UNPAID→PAID; the Pay Online button correctly disappeared afterward).
Tonight's full-suite verification was messier than prior phases —
documented honestly rather than glossed over: a 40+ file run stalled
repeatedly under heavy concurrent Neon load (two API dev servers plus
this session's own smoke testing all hitting the database at once) and
was abandoned in favor of targeted isolated re-runs of the 3 files this
phase touched, all confirmed clean once load normalized. **Phase 10
backend built**: two brand-new applications, `provider/api` and
`provider/web`, on their own genuinely separate Neon Postgres database
(the user supplied a dedicated connection string mid-session — see §1u
for the full story, including that it initially held substantial
unrelated data from a different old project which the user explicitly
had deleted before this platform's schema was deployed there), with
its own isolated generated Prisma client. A real RS256-signed License
& Entitlement architecture matching spec's exact claim shape and
day-threshold state table, a heartbeat-ingestion endpoint authenticated
by a per-deployment bearer token, and Customer/Plan/Deployment/
SupportTicket/Dashboard modules — 12/12 new tests. **Phase 10 customer-
side integration** wired into `product/api`: an independent, from-
scratch license verifier (no code shared with `provider/api`, matching
spec's "no source code to the customer" split), a global write-gate
enforcing grace-period rules, an `EXPIRED_FINAL` login restriction, and
a heartbeat sender — 9 new unit tests, zero regression on the existing
suite. **Phase 10 frontend built**: `provider/web`'s 6 screens
(Dashboard, Customers, Plans, Deployments, Licenses, Support) — 11
pages total. A real bug (non-`async` Server Action exports) found and
fixed live. Verified end-to-end on both apps against real running dev
servers: a real Customer/Plan/Deployment/License created, installed
into `product/api`'s own `.env`, a real heartbeat sent and confirmed,
a license suspended/reactivated with the heartbeat response flipping
accordingly — and, a step further than any prior phase, a genuine
no-JS login form submission against `provider/web`'s real rendered
HTML. **All 11 phases in this table are now backend+frontend
complete.** See also
§1c/§1d/§1e/§1f/§1g/§1h/§1i/§1j/§1k/§1l/§1m/§1n/§1o/§1p/§1q/§1r/§1s/§1t/§1u/§1v
for full detail.

**Phase 11 — backend complete** (2026-09-12): Phase A's full campus-scoping
foundation (`docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md` Groups
1-6, all of it, including Finance/Complaints/Leaves/Reports/Approvals) is
built and tested — `lib/scope.ts`'s `UNRESTRICTED_ROLES` is now just
`SUPER_ADMIN`. The `PRINCIPAL` → `CAMPUS_HEAD` role rename is done (code +
data). Phase B (Leave/Complaint auto-routing + forwarding to the covering
Incharge/Class Teacher) is done. Phase C (Admission Inquiry pre-enrollment
stage + login-by-identifier via studentCode/CNIC) is done. Phase D
(Homework's single `documentId` replaced with a proper one-to-many
`HomeworkAttachment` relation; a new lightweight `ClassDiaryEntry` "today
we covered X" log; Campus Head already holds `curriculum.create/edit`) is
done. Phase A2 (general-purpose temporary role Delegation, live-computed via
an `AsyncLocalStorage` request context so permission/scope widening and
audit-log tagging reach 137 existing call sites with zero changes to any of
them) is done. Phase A3 (Staff attendance: anti-spoofing daily-rotating QR
check-in with no cron job, manual/remote-approved fallbacks, and a
financial-action gate on recording payments) is done. **Every phase above
verified with real-database integration tests** (two full-suite regression
passes across the whole session's changes, both clean once isolated re-runs
ruled out Neon-latency-under-load flakiness — see `PROJECT_STATUS.md`
§(as)/(at)), `tsc --noEmit` clean throughout — see `PROJECT_STATUS.md`
§(aj) through §(aq) for the full per-phase detail, including the two real
scope-check gaps closed this session in the create/update/publish/archive
Homework write surface (previously had zero scope enforcement at all,
mirroring earlier findings in Assessments/Payments/Attendance) and the new
Class Diary module built to match it from day one.

**Phase 12 — backend complete** (2026-09-12): before coding, researched
whether the design doc's three proposed models match real production
precedent rather than being ad-hoc — confirmed against Salesforce's Rename
Tabs and Labels (Gap 1), Azure RBAC's own "use role ID not name" guidance
(Gap 2), and Google Cloud's Organization Policy hierarchy (Gap 3). All four
gaps built: `Role.systemKey` decouples authorization identity from a role's
now-freely-editable display name (a real correctness gap in `prisma/
seed.ts`'s role upsert — matched by `name`, which would have silently
created a duplicate role after any rename — closed as part of this);
`TerminologyOverride` generalizes (and replaces, via a compatible shim) a
Phase 1 mechanism found stored-but-inert, same pattern as `Institute.type`;
a generic `FeatureConfig` table replaces per-feature bespoke governance
columns, proven end-to-end by gating Phase 11 A3's staff check-in methods
through it; `createInstitute()` now auto-creates a default "Main Campus".
Verified with 3 new dedicated test files, two full local-suite regression
passes (53/53 files, 395/395 tests) plus targeted re-verification against
the real Neon DB, `tsc --noEmit` clean throughout — see `PROJECT_STATUS.md`
§(av)/(aw). **Only the frontend consumption of all this (terminology-aware
page labels, a Roles-rename UI, a Feature-Config admin screen) remains,
deferred to frontend work same as Phase 11's Phase E.**

## Notes on dependency ordering

- Phase 5 (Finance) only needs Phase 2 (Students/Enrollment exist), not Phase 3
  or 4 — you can build Finance in parallel with Academic Operations if desired.
- Phase 6 (Leave/Complaints) only needs Phase 0's Document/Notification models
  plus Students (Phase 2) and Teachers/Timetable context (Phase 3).
- Phase 7 (Portals) is really "wire up role-scoped UI for everything built so
  far" — it can be done incrementally per-role as each backend phase lands,
  rather than as one giant phase at the end. In practice it was built as one
  pass after Phase 6 rather than incrementally, since permission grants and
  scope enforcement are cross-cutting and easier to reason about all at
  once than retrofitted phase-by-phase.
- Phase 10 (Provider Platform) is a separate application from the customer
  product and only depends on Phase 1 (needs the license/entitlement shape
  defined in Institute config). It can be built by a different
  session/developer in parallel with Phases 2-9 without conflict.
