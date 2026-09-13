# Phase 11 Phase A — Campus Scoping: module-by-module implementation plan

**Status (2026-09-12, updated):** Foundation + Groups 1-6 are ALL built and tested (138 + 72 + 28 + 6 + 62 =
306+ integration tests across every module touched — see `PROJECT_STATUS.md` §(aj)/(am)/(an)). This plan is
essentially complete. The schema gaps this doc identified were resolved: `FeeStructure.campusId` (nullable),
`Complaint.campusId` (required), `Invoice.campusId` (snapshot), and `ApprovalRequest.campusId` (now
populated by all 5 real callers, not just added-but-unused) — all in migration
`20260912080822_phase11a_campus_scoping_columns` plus follow-up code in §(an).

**What's genuinely still open**: the role rename (`PRINCIPAL` → `CAMPUS_HEAD`, tracked in
`DYNAMIC_INSTITUTION_ARCHITECTURE.md` Gap 2, not this doc), and two narrow, explicitly-flagged limitations —
(1) a user with more than one campus gets a "defaults to first campus" experience on Reports/list endpoints
rather than a real multi-campus comparison view, and (2) `decideLeaveHandler`'s teacherId-specific-record
path and a couple of similar single-record lookups assume a resolvable campus and refuse (rather than
silently allow) when one can't be determined (e.g. a teacher with no campus-assigned role yet).

Originally: planning only, no code written. This is the detailed build plan for the campus-isolation half of
[`PHASE_11_MULTI_CAMPUS_AND_WORKFLOWS.md`](PHASE_11_MULTI_CAMPUS_AND_WORKFLOWS.md) Phase A ("A1. Roles &
campus scoping"). That doc states the *what*; this doc is the *how*, file by file, so implementation can
proceed as a checklist rather than an open-ended exploration — same reason every other phase in this
project got its own detailed spec section before coding started.

**Why this needs its own plan doc:** checked the schema directly — only 5 models
(`UserRole`, `Section`, `InchargeScope`, `Admission`, `CashClosing`) carry a direct `campusId`. Every other
campus-relevant model (Student, Teacher, Invoice, Timetable, Leave, ...) has to derive its campus through a
relation chain, and the correct chain differs by model. Getting this wrong per-module (e.g. deriving from a
stale enrollment, or missing a model that has no derivable campus at all) is exactly the kind of subtle
authorization bug that's expensive to find later — worth nailing down once, in writing, before touching ~20
files of production authorization code.

## Two real gaps found while writing this plan (not previously known)

1. **`FeeStructure` is institute-wide, not campus-scoped** (`instituteId` + `classId`, no `campusId` at all —
   confirmed in schema). Last session's `seed.ts` change granted Campus Head `fee_structure.create`/`.edit`
   on the assumption fee structures are per-campus data, same as everything else in that grant — **they are
   not**. As written today, that grant would let a Campus Head edit a fee structure used by every campus in
   the institute, breaking isolation. **Needs a decision before Phase A ships**: either (a) add `campusId`
   to `FeeStructure` (nullable — null means institute-wide/shared, a value means campus-specific — mirrors
   the Mandatory/Default/Campus-Controlled spirit of `DYNAMIC_INSTITUTION_ARCHITECTURE.md` Gap 3) and only
   let Campus Head create campus-specific ones, or (b) walk back `fee_structure.create/.edit` from Campus
   Head's grant and treat fee structures as an Office/Super-Admin-only institute-wide catalog after all.
   Flagging here rather than silently shipping the current grant as-is.
2. **`Complaint.studentId` is optional with no other anchor** — a complaint not about a specific student
   (e.g. a general facility complaint) has no derivable campus at all today. Needs either a direct
   `campusId` column added to `Complaint`, or an explicit rule that campus-less complaints are only visible
   institute-wide (Super Admin only) until someone assigns them a student/campus.

## Foundation (build first, before any module rollout)

1. **`ActorProfile` gains `campusIds: string[]`** (`src/lib/scope.ts`) — computed in `getActorProfile()` from
   the user's `UserRole` rows that carry a non-null `campusId` (a user can hold both a campus-scoped role and
   an unrestricted one, or — per Phase 11 Phase A's "one person overseeing 2 campuses" edge case — multiple
   campus-scoped rows for the same role).
2. **`UNRESTRICTED_ROLES` shrinks to `{"SUPER_ADMIN"}`** — but **do not flip this until every branch below
   exists**, or every `PRINCIPAL`/`OFFICE` request immediately 403s (`isUnrestricted()` returning `false`
   with no matching branch falls through to `assertSectionInScope`'s/`assertStudentInScope`'s closing
   `throw`). This is the single most important sequencing rule in this whole plan.
3. **New helpers in `scope.ts`**:
   - `assertCampusInScope(profile, campusId)` — throws `OUT_OF_SCOPE` unless `campusId` is in
     `profile.campusIds` (or the actor is unrestricted).
   - `resolveCampusScopeFilter(profile)` — returns `{ campusId: { in: profile.campusIds } }` for a
     campus-scoped actor, or `{}` (no filter) for unrestricted — the single expression every module's
     `findMany` `where` clause spreads in.
4. **New branches added to the *existing* functions** (`assertSectionInScope`, `assertStudentInScope`,
   `resolveStudentScopeFilter`) for `PRINCIPAL`/`OFFICE`, checking the target's derived campus against
   `profile.campusIds` — reuses the exact same functions Teacher/Incharge/Parent/Student already go through,
   rather than a parallel code path.
5. **Users module**: assigning `PRINCIPAL` or `OFFICE` to a user requires `campusId` in the request —
   service-layer validation (`CAMPUS_REQUIRED_FOR_ROLE`), not a DB constraint (the column must stay nullable
   for roles that don't need it). Existing `PRINCIPAL`/`OFFICE` `UserRole` rows with a null `campusId` (if
   any exist in a real deployment) need a decision: block them at login with a clear error, or auto-migrate
   to "Super Admin retains control" per Phase 11's own documented fallback for a campus with zero Principal.
6. **Dedicated test file** `tests/integration/scope-campus.test.ts` — mirrors how `checkInchargeScope` got
   12 standalone tests in Phase 7 before anything consumed it. Cover: Campus A Head sees Campus A data/DENY
   Campus B; Office same; a user with two campus-scoped `PRINCIPAL` rows sees both; `resolveCampusScopeFilter`
   returns no filter for `SUPER_ADMIN`; assigning `PRINCIPAL` without `campusId` is refused.

Only after this foundation has its own passing tests does step 2 (shrinking `UNRESTRICTED_ROLES`) actually
go live — and even then, every module below still needs its own filter added first, or removing the
role from the unrestricted set will 403 it out of endpoints nobody's fixed yet. Practically: **land the
foundation and the full module rollout in the same PR/session**, not shipped separately with
`UNRESTRICTED_ROLES` flipped early.

## Module rollout, grouped by how campus is actually derived

### Group 1 — already have a direct `campusId` column (simplest change: add to `where`)

| Module | File(s) | Note |
|---|---|---|
| `campuses` | `src/modules/campuses/service.ts` | Campus Head/Office should see only their **own** Campus row(s), not list every campus. `campus.edit` (if granted) restricted to own campus too — Super Admin keeps `campus.create`/`.archive` exclusively (structural, cross-institution). |
| `admissions` | `src/modules/admissions/service.ts` | Straight `campusId` filter. |
| `cash-closing` | `src/modules/cash-closing/service.ts` | Straight `campusId` filter. |
| `sections` | `src/modules/sections/service.ts` | Straight `campusId` filter — also the source of truth other groups below join through. |
| `incharge-scopes` | `src/modules/incharge-scopes/service.ts` | Campus Head should see (not necessarily edit) Incharge scopes on their own campus — filter list, leave create/revoke authority as currently designed (Phase 11 says Super Admin/Campus Head can both delegate). |

### Group 2 — derive via `Section.campusId` (join through the section a record belongs to)

| Module | Derivation | Note |
|---|---|---|
| `enrollments` | `enrollment.section.campusId` | |
| `students` | active `Enrollment.section.campusId` | A student with no active enrollment (mid-admission) has no derivable campus yet — falls back to the campus named on their (still-open) `Admission` record, consistent with Phase 11 Phase B's same fallback for routing. |
| `teacher-assignments` | `teacherAssignment.section.campusId` | |
| `timetable` | `timetable.section.campusId` | Direct FK on `Timetable`, no extra join needed. |
| `attendance` | via the `Attendance` row's `Enrollment` → `section.campusId` | Confirm `Attendance` stores `enrollmentId` or `studentId`+date; derive accordingly — check at implementation time, not guessed here. |
| `curriculum` | **institute-wide catalog, no change** — `Curriculum` is Subject+Class+AcademicYear scoped (like `Class`/`Subject` themselves), not campus-specific. `curriculum-progress` (the per-section completion record) **does** need the `Section.campusId` filter. |
| `homework` | `homework.section.campusId` | |
| `assessments` / assessment results | `assessment.section.campusId` | |
| `exam-schedules` | `examSchedule.section.campusId` | `exams` itself (the named series, e.g. "Midterm") is academic-year scoped like `Curriculum` — **institute-wide, no change** — only its per-section `ExamSchedule` rows are campus-specific. |
| `results` | via the `Result`'s enrollment → `section.campusId` | |
| `report-cards` | via the underlying `Result` | |
| `promotions` | via the source `Enrollment.section.campusId` | A class-jump target section could theoretically be in a different campus — decide whether cross-campus promotion is even allowed; if not, add a same-campus check on `promotion.create`, not just a list filter. |
| `substitutions` | via the covered `TimetableEntry`'s section | |

### Group 3 — derive via `UserRole.campusId` (the actor's own campus-scoped role, not a joined record)

| Module | Derivation | Note |
|---|---|---|
| `teachers` | the Teacher's own `UserRole.campusId` (role = `TEACHER`) | `Teacher` itself has no `campusId` — it's attached to the person's campus-scoped role assignment, not to any single class/section (a teacher might have zero assignments yet and still needs to appear in their campus's staff list). |
| `teacher-attendance` | same — via `teacherId` → `Teacher.userId` → that user's `TEACHER` `UserRole.campusId` | |
| `users` (staff list) | the target user's relevant `UserRole.campusId` | A user can hold roles at multiple campuses (the "one Principal, two small campuses" case) — show them under each campus they're actually assigned to, not just their first role. **Not implemented in this pass regardless** — recall `user.create`/`.edit`/`.disable` stayed withheld from Campus Head pending exactly this scoping; this row is about what Campus Head can *see* in a future users-list view, not full CRUD. |

### Group 4 — derive via the student's campus, but through Finance-specific models

| Module | Derivation | Note |
|---|---|---|
| `fee-structures` | **See Gap 1 above — blocked on a decision, not a mechanical join.** | |
| `fee-categories` | institute-wide catalog, same reasoning as `Subject` — no change | |
| `student-fees` (fee assignments) | via the student's active enrollment → `section.campusId` | |
| `invoices` | via `invoice.studentId` → active enrollment → `section.campusId` | Edge case: a student transfers campuses after being invoiced — decide whether the invoice "belongs" to the campus at invoicing time (would need a snapshot `campusId` on `Invoice`) or always reflects current enrollment (simpler, but a stale/old invoice could vanish from the original campus's Head's view after a transfer). Recommend the snapshot approach for auditability, matching how `ReportCard` already snapshots data rather than always-recomputing. |
| `payments` / `refunds` / `discounts` / `waivers` | via the parent `Invoice`'s campus (whichever approach Gap above resolves to) | |

### Group 5 — Operations

| Module | Derivation | Note |
|---|---|---|
| `leaves` | student leave: via enrollment → `section.campusId`. Teacher leave: via the teacher's `TEACHER` `UserRole.campusId` (Group 3 pattern) | |
| `complaints` | via `complaint.studentId`'s enrollment **when present** — **see Gap 2 above**, campus-less complaints need a decision | |

### Group 6 — Reports & Approvals

| Module | Derivation | Note |
|---|---|---|
| `reports` | each of the 5 report categories (Academic/Attendance/Financial/Admissions/Staff) needs its own aggregation query updated with the same campus filter its underlying data uses (Group 2/3/4's patterns, per category) — not a single shared change, since each report's Prisma query is bespoke (per `PROJECT_STATUS.md` §1q). | |
| `approvals` (Phase 0's generic engine) | **No campus anchor exists on `ApprovalRequest` itself today.** A Campus Head with `approval.decide` could currently decide another campus's `PAYMENT_REVERSAL`/`PROMOTION_CLASS_JUMP`/etc. request. Simplest fix: add a `campusId` column to `ApprovalRequest`, populated at creation time by whichever module calls `createApprovalRequest()` (each caller already knows the campus of the thing it's requesting correction on) — avoids re-deriving campus from a polymorphic `type`+target-id pair at decide-time. | |

### Explicitly not touched (institute-wide by design, confirmed via schema)

`institute`, `classes` (catalog), `subjects` (catalog), `academic-years`, `roles`/`permissions`, `audit`,
`documents`/`notifications` (owner-scoped, not campus-scoped), `payment-gateways` config (pending
`DYNAMIC_INSTITUTION_ARCHITECTURE.md` Gap 3's `FeatureConfig` model instead of ad-hoc campus filtering).

## Suggested build/test order

1. Foundation (above) + its dedicated test file — lands with `UNRESTRICTED_ROLES` **still including**
   `PRINCIPAL`/`OFFICE` (so nothing breaks yet; the new branches exist but aren't load-bearing).
2. Resolve Gap 1 (`FeeStructure`) and Gap 2 (`Complaint`) — schema decisions needed before Group 4/5 can be
   written correctly.
3. Group 1 (direct `campusId`, simplest) — flip filters on, add/extend each module's integration tests with
   a "Campus B actor gets empty/403" case, same shape as every existing cross-scope test in this codebase
   (e.g. Phase 1's incharge-scope section-mismatch tests).
4. Groups 2 and 3 (join-derived) — the bulk of the work, module by module, each with its own cross-campus
   test case added.
5. Group 4 (finance) — only after Gap 1's decision lands.
6. Group 5 (leaves/complaints) — only after Gap 2's decision lands.
7. Group 6 (reports/approvals) — last, since it depends on every module above already being correct (reports
   aggregate the same data; approvals need the `campusId` snapshot column from whichever module created the
   request).
8. **Only now** flip `UNRESTRICTED_ROLES` to drop `PRINCIPAL`/`OFFICE` for real, run the **full** existing
   test suite (not just the new tests) to catch anything Group 1-6 missed, then live-smoke-test logging in
   as a Campus Head against real running dev servers — same "don't trust it until you've actually clicked
   through it" standard this project holds every other phase to.

## Open items needing the user's decision before coding starts

1. Gap 1 — `FeeStructure`: add `campusId` (nullable, institute-wide-vs-campus-specific) or walk back Campus
   Head's `fee_structure.create`/`.edit` grant?
2. Gap 2 — `Complaint`: add a direct `campusId` column, or accept campus-less complaints stay Super-Admin-
   visible only until assigned a student?
3. Invoice campus snapshot vs. always-current-enrollment for a transferred student's historical invoices?
4. Promotion class-jump across campuses — allowed at all, or must target section be same-campus?
