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
| 5 | Finance Module | Fee structures, Invoicing, Payments (cash+gateway), Receipts, Refunds, Reconciliation, Cash closing | 2 | 4-5 wk | 🔴 |
| 6 | Operations | Leave management, Complaints | 0, 2, 3 | 2-3 wk | 🔴 |
| 7 | Portals & Role-Based Experiences | Principal / Incharge / Office / Teacher / Parent / Student UIs on top of the above | all prior | 4-5 wk | 🔴 |
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
checks only. An intermittent Neon connection drop (P1001) during long
test runs was investigated and confirmed to be external flakiness, not a
code defect — see `PROJECT_STATUS.md` §5a. See also §1c/§1d/§1e/§1f/§1g/
§1h/§1i/§1j for full detail.

## Notes on dependency ordering

- Phase 5 (Finance) only needs Phase 2 (Students/Enrollment exist), not Phase 3
  or 4 — you can build Finance in parallel with Academic Operations if desired.
- Phase 6 (Leave/Complaints) only needs Phase 0's Document/Notification models
  plus Students (Phase 2) and Teachers/Timetable context (Phase 3).
- Phase 7 (Portals) is really "wire up role-scoped UI for everything built so
  far" — it can be done incrementally per-role as each backend phase lands,
  rather than as one giant phase at the end. Recommended: build each portal's
  relevant screens right after the backend phase that feeds it, and treat
  Phase 7 as the hardening/consistency pass rather than a from-scratch build.
- Phase 10 (Provider Platform) is a separate application from the customer
  product and only depends on Phase 1 (needs the license/entitlement shape
  defined in Institute config). It can be built by a different
  session/developer in parallel with Phases 2-9 without conflict.
