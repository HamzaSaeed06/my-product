# Spec Compliance Audit — Master Architecture Prompt vs. Actual Codebase

**Created:** 2026-09-13
**Author:** audit pass against the full "Educational Institution Management Platform" master spec (60 sections + deployment-model correction + a separate domain-neutral PostgreSQL research request).
**Method:** every status below was checked against real files (grep + reads), not asserted from memory. Where a claim was only spot-verified, it says so. Per the spec's own §60, nothing here is marked "production-ready" that wasn't actually inspected, and incomplete work is labelled honestly.

**Status legend** (the spec's §59–60 vocabulary):
- **IMPLEMENTED** — exists, wired, and (where noted) covered by an integration test.
- **PARTIAL** — core exists; a named sub-capability is missing or unverified.
- **MISSING** — not built.
- **BLOCKED** — deliberately not built, with a recorded prerequisite.
- **CONVENTION DIFF** — built, but a cosmetic shape/naming difference from the spec's example (not a defect).

**Headline finding:** the spec describes an architecture that is **~90% already implemented** across Phases 0–12. The single most important consequence — flagged because the spec's own **§0 / §54** forbid it — is that executing the spec's "Phase 1–15 build plan" verbatim would **create duplicate permission systems, duplicate role tables, and parallel architecture over a working one.** This audit exists so that future work targets the real gaps instead of rebuilding what exists.

---

## 0. Deployment model correction — ALREADY MATCHES

The spec corrects an earlier assumption ("multiple institutions in one DB") to: **ONE DEPLOYMENT → ONE INSTITUTE → ONE DATABASE → MULTIPLE CAMPUSES**, codebase reusable across unlimited customer deployments.

**Status: IMPLEMENTED (no change needed).** There is no multi-tenant `Institution` table. `prisma/schema.prisma` has a single `Institute` model (`schema.prisma:399`) with `campuses Campus[]` beneath it; every campus-owned entity carries `instituteId` + (where relevant) `campusId`. The whole database is one customer's institute. The separate provider-side control plane (customer/license/hosting/deployment) already lives in `provider/api` + `provider/web` (Phase 10) and does **not** read customer educational data — exactly the split the spec's "YOUR INTERNAL MANAGEMENT" section describes.

---

## §1–5 Authorization core (chain, model, naming, scopes, hierarchy)

| Spec | Status | Evidence / gap |
|---|---|---|
| §1 Auth→Role→Permission→Institution→Campus→Object→BusinessRules→State→Operation | **IMPLEMENTED** | `getUserPermissionKeys()` (`src/middleware/authorize.ts`), `getActorProfile()` + `assertStudentInScope` / `assertSectionInScope` / `resolveSectionScopeFilter` / `resolveStudentScopeFilter` (`src/lib/scope.ts`). Backend denies even on direct API call — verified by `tests/integration/scope-enforcement.test.ts`. |
| §2 No `if role === "X"` scattered; centralized | **IMPLEMENTED** | Routes use `requirePermission("resource.action")`; role-name checks are confined to genuine UI-shape / license decisions, not per-operation authorization. |
| §3 Permission naming `<resource>:<action>` | **CONVENTION DIFF** | Codebase uses `<resource>.<action>` (dot), e.g. `leave.approve`, `user.view`, `teacher.create`. 170 seeded permissions. **Do NOT migrate to colon** — it would touch all 170 keys + every route + every frontend check for zero functional gain. Convention is already consistent. |
| §4 Scope types INSTITUTION / CAMPUS / ASSIGNED_SCOPE / OWN / LINKED_CHILDREN | **IMPLEMENTED** | INSTITUTION = unrestricted roles; CAMPUS = `profile.campusIds`; ASSIGNED_SCOPE = `InchargeScope` + teacher assignments; OWN = `profile.studentId`; LINKED_CHILDREN = `getOwnChildStudentIds()`. |
| §5 Role hierarchy (SuperAdmin→CampusHead→Incharge→Teacher/Office→Parent/Student), explicit grants not inheritance | **IMPLEMENTED** | `seed.ts` `ROLE_PERMISSIONS` grants each role explicitly; no automatic inheritance. |

---

## §6–17 Per-role authorization

| Role (spec §) | Status | Evidence / gap |
|---|---|---|
| §6 Super Admin (institution-wide) | **IMPLEMENTED** | All 170 permissions granted at seed; institute config / campus CRUD / user mgmt all present. |
| §7–11 Campus Head (Incharge+Office+exclusive, campus-scoped, NO institution perms) | **IMPLEMENTED** | Verified exhaustively this session; `seed.ts` grants the academic create/edit set, approvals, campus-scoped finance. `user.create/edit/disable` correctly **BLOCKED** (Users module lacks campus-scoping guard — recorded in `ROLE_PERMISSION_MATRIX.md`). `teacher.create/edit/archive` added 2026-09-13 (guard already existed). |
| §12 Incharge (campus + assigned-scope) | **PARTIAL** | Permission set correct. **Gap:** `GET /api/v1/sections` and `GET /api/v1/teachers` return the *whole institute* for a zero-`campusIds` actor (Incharge) instead of their assigned scope — a real §19/§50 violation (see Gaps below). |
| §13 Office (admin/financial) | **IMPLEMENTED** | Admissions/enrollment/fees/payments/complaints grants present. |
| §14 Teacher (assigned academic scope) | **IMPLEMENTED** | Section-scoped via assignments; cross-campus denied (`scope-enforcement.test.ts`). |
| §15 Class Teacher = assignment, not a role | **IMPLEMENTED** | Modeled as `Section.classTeacherId` field, not a separate role — matches spec exactly. |
| §16 Parent (LINKED_CHILDREN, incl. cross-campus children) | **IMPLEMENTED** | `getOwnChildStudentIds()` is relationship-based, not campus-based — satisfies §20's cross-campus-parent case. |
| §17 Student (OWN) | **IMPLEMENTED** | Scoped to `profile.studentId`; `studentIdIn: []` when no profile (never widened to "everyone"). |

---

## §18–25 Dynamic model, isolation, gateways, finance, attendance, timetable, policy

| Spec | Status | Evidence / gap |
|---|---|---|
| §18 Dynamic institution (no hardcoded school terms) | **IMPLEMENTED** | `TerminologyOverride` (Phase 12 Gap 1) — canonical keys STUDENT/TEACHER/CLASS/SECTION/SUBJECT/CAMPUS/ENROLLMENT with per-institute singular/plural labels. `Institute.type` enum. |
| §19 Campus isolation (server-side resolve, never trust client campusId) | **PARTIAL** | Pattern is correct and enforced widely (`assertCampusInScope`, `campusIdIn` from profile). **2 live leaks** — see Gaps. |
| §20 Cross-campus parent | **IMPLEMENTED** | Relationship-based, see §16. |
| §21 Gateway policy modes (SHARED_ONLY / CAMPUS_ONLY / BOTH_ALLOWED) | **BLOCKED** | grep = 0 hits. `PaymentGateway` is institute-wide (no `campusId`); campus-level gateway config deliberately withheld until `FeatureConfig` gating exists — recorded in `ROLE_PERMISSION_MATRIX.md` open items. |
| §22 Financial authorization granularity (view/create/record/approve/cancel/reverse/refund/reconcile separate) | **IMPLEMENTED** | Distinct seeded perms: `payment.view/record/reverse`, `refund.view/approve`, `discount/waiver.view/approve`, `cash_closing.view/approve`, `invoice.view/create/void/export`. Reversal is a request→decide flow via `ApprovalRequest`, not a delete. |
| §23 Configurable attendance methods (Manual/QR/Camera/Hardware) | **PARTIAL** | Staff QR check-in exists (`StaffCheckInMethod { QR, MANUAL }`, Phase 11 A3). **Student** attendance is manual-only; camera/hardware-scanner integration + per-campus method policy **not built**. |
| §24 Timetable draft→publish + conflict detection | **IMPLEMENTED** | Teacher double-book detection (`timetable/service.ts:55`), draft→`publishTimetable` with `ALREADY_PUBLISHED` guard (`:193`). |
| §25 Policy resolution engine (MANDATORY / INSTITUTE_DEFAULT / CAMPUS_CONTROLLED) | **IMPLEMENTED (exact match)** | `FeatureConfig` model + `resolveFeatureConfig()` (`lib/featureConfig.ts`, Phase 12 Gap 3) — one shared resolver, explicitly modeled on the Google Cloud Org-Policy hierarchy the spec describes. |

---

## §26–37 Engineering foundations

| Spec | Status | Evidence / gap |
|---|---|---|
| §26 Modular backend | **IMPLEMENTED** | ~50 module folders under `src/modules/`, each route/controller/service. |
| §27 Thin controllers, logic in services | **IMPLEMENTED** | Consistent controller→service split across modules. |
| §28 Zod validation (body/params/query) | **IMPLEMENTED** | Zod schemas in controllers; `ZodError` handled centrally. |
| §29 DB: FK/unique/index/transactions | **IMPLEMENTED** | FKs + `@@unique` + `@@index` throughout schema; `$transaction` used in 11 modules (payments, results, enrollments, etc.). |
| §30 Security middleware (helmet/cors/rate-limit/body-limit) | **IMPLEMENTED** | `app.ts:66-88` — helmet, credentialed origin-locked CORS, cookie-parser, 1MB json limit, read+write rate limiters, license write-gate. |
| §31 Authentication (login/logout/hash/session/rotation) | **IMPLEMENTED** | argon2 hashing (`lib/password.ts`), refresh-token rotation, session revoke-all on password/role change, MFA, httpOnly cookies re-issued web-side. |
| §32 Consistent error format | **CONVENTION DIFF** | Centralized `errorHandler` returns `{error, message[, details]}`. Spec example is `{success:false, error:{code,message}}`. Functionally equivalent; envelope shape differs. Changing it would touch every frontend error-read site — recommend leaving unless a client contract needs it. No stack traces / SQL leaked in prod path. |
| §33 Audit logging | **IMPLEMENTED** | `writeAuditLog()` + `audit` module + `audit.test.ts`; login, role/permission changes, financial mutations, publishes recorded. Secrets never logged. |
| §34 Idempotency (payments/admission/result/webhooks) | **PARTIAL** | Verified in `payments/service.ts` + `online-payment/service.ts` (incl. webhook HMAC over raw body, `app.ts:80`). **Not verified** for admission-submission / result-submission — needs per-path check before claiming complete. |
| §35 Concurrency (races/locks/isolation) | **PARTIAL** | Transactions + unique constraints + payment idempotency cover the main financial races. Explicit `SELECT FOR UPDATE` / optimistic version columns **not systematically verified** — needs a per-critical-path review (timetable-slot, result-approval, duplicate-payment-callback). |
| §36 Seed reflects final model | **IMPLEMENTED** | `seed.ts`: 7 roles, 170 permissions, campuses, all-role users, relationships. |
| §37 No global perms to Campus Head | **IMPLEMENTED** | Verified this session — `institution:update` / cross-campus never granted; `user.create` withheld with recorded reason. |

---

## §38–48 Dashboards, routing, sidebar (all permission-driven)

**Status: IMPLEMENTED this session** (see `PROJECT_STATUS.md` (ay)/(az)). The sidebar (`dashboard-sidebar.tsx`) and ~12 pages now derive visibility from the live `permissions[]` from `/auth/me`, not role names — exactly §46's "never return everything and let frontend hide" rule. Metrics are scope-calculated server-side (e.g. Institute Overview counts are real Prisma counts, deltas from `createdAt` history).

**Caveat (PARTIAL):** two pages still crash for Incharge on their *main list* fetch (Homework, Assessments — the list endpoint needs a `sectionId` for a zero-`campusIds` actor and the page has no section-picker). This is the §46 "dashboard metric must be calculated from the authenticated user's scope" requirement not being satisfiable until the picker exists. Tracked as a spawned task.

Per-role dashboards §39–45: Super Admin ✅, Campus Head ✅, Incharge ✅ (minus the 2 crashes), Office ✅, Teacher/Parent/Student portals ✅ (portal shell built Phase 7; not re-audited role-by-role this session).

---

## §49–52 Testing, IDOR, negative, no-fake-success

| Spec | Status | Evidence / gap |
|---|---|---|
| §49 API test matrix per role | **IMPLEMENTED** | 51 integration test files (every module), run against real Postgres. |
| §50 IDOR / BOLA | **PARTIAL** | `scope-enforcement.test.ts` covers cross-campus denial for the main entities. **Gap:** the 2 live sections/teachers list leaks are exactly the IDOR class this section targets — they need a test + fix. |
| §51 Negative testing | **IMPLEMENTED** | Extensive wrong-role/wrong-campus/invalid-state coverage across the 51 files. |
| §52 No fake success | **IMPLEMENTED (by convention)** | This is a code-quality invariant, not a single artifact; the session's whole ethos enforces it (no placeholder `success:true`, real rollbacks). Cannot be "proven" exhaustively — reviewed opportunistically. |

---

## The genuinely actionable gap list (ranked)

1. **§19/§50 — campus-isolation leak (HIGH, security).** `GET /api/v1/sections` and `GET /api/v1/teachers` return institute-wide data for a zero-`campusIds` actor (Incharge). `seed.ts` comments claim `checkInchargeScope()` narrows this "at the route level" but it isn't wired into these two controllers. Confirmed live. → fix + `scope-enforcement.test.ts` case.
2. **§46 — Homework/Assessments 500 for Incharge (MEDIUM).** Main list endpoint requires `sectionId` for zero-campus actors; pages lack a section-picker (Timetable/Attendance/Results already have the pattern to copy).
3. **§34/§35 — idempotency/concurrency (MEDIUM, verify-then-fill).** Confirmed on the payment paths; admission-submit, result-submit, and timetable-slot concurrency need a per-path review before claiming complete.
4. **§23 — student attendance methods (LOW/scope).** Camera/hardware-scanner + per-campus method policy not built (staff QR exists).
5. **§21 — gateway policy modes (LOW, BLOCKED).** Needs `FeatureConfig`-gated per-campus gateway config; deliberately deferred.

**Explicitly NOT worth doing:** the `:` vs `.` permission rename (§3) and the error-envelope reshape (§32) — both cosmetic, both high-blast-radius, both zero functional gain.

---

## Separate deliverable — the PostgreSQL design guide

The spec's second half ("Act as a senior PostgreSQL database architect…") is a **domain-neutral, reusable DB-design methodology document** — not a change to this codebase. It's a standalone reference. If wanted, it should be authored as its own file (e.g. `docs/POSTGRES_DESIGN_GUIDE.md`) without touching any existing docs. Not started — awaiting a go-ahead, since it's independent of the platform work.

---

## What this audit deliberately did NOT do

- Did not modify any code or existing docs (this is the docs-first Phase-0 step the spec's §0 demands).
- Did not re-run the full test suite (last green this session: backend `npm test` 25/25 unit; integration suites run per-area against local Postgres).
- Did not exhaustively read all ~50 modules — sections marked PARTIAL/verify are honestly flagged rather than assumed complete, per §60.
