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
| 8 | Reports & Analytics | Cross-module reporting (academic, attendance, finance, staff) | all prior | 3-4 wk | 🔴 |
| 9 | Online Payment Integration | Payment gateway (Easypaisa/JazzCash-style), webhook idempotency, reconciliation | 5 | 3-4 wk | 🔴 |
| 10 | Provider Platform | Provider-side control plane: customer/license/deployment management, heartbeat, support tickets | 1 | 4-5 wk | 🔴 |

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
total. All Phase 0-7 backends and frontends are now built; interactive
dialogs across all seven phases remain the one standing item not yet
click-tested in a real browser. Bespoke Principal/Incharge/Office
dashboard home pages (they currently reuse the shared admin Overview)
are a deliberate, documented follow-up. See also
§1c/§1d/§1e/§1f/§1g/§1h/§1i/§1j/§1k/§1l/§1m/§1n/§1o/§1p for full detail.

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
