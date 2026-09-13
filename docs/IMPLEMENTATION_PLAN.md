# Implementation Plan — Finish, Harden & Roll Out

**Created:** 2026-09-13
**Basis:** [`SPEC_COMPLIANCE_AUDIT.md`](SPEC_COMPLIANCE_AUDIT.md) (architecture is ~90% built across Phases 0–12).
**Nature of this plan:** this is a **finish-and-harden** roadmap, not a from-scratch build. Per the master spec's §0/§54, we do **not** rewrite working architecture or duplicate existing systems. Each phase closes a real, audited gap or rolls existing foundations out to the roles that don't have UI yet.

**How to use:** phases run top-to-bottom. Each has a concrete, testable exit condition. A phase is "done" only by the spec's §53 definition (UI + API + validation + authz + isolation + object-scope + business rules + state + errors + concurrency + tests), not just "it saves."

> Existing docs (`PROJECT_STATUS.md`, `PHASE_TRACKER.md`, `PRODUCT_SPEC.md`, the Phase-11/12 design docs, `ROLE_PERMISSION_MATRIX.md`) are **kept as-is** — this plan and its sibling review docs are additive.

---

## Phase A — Database design review & hardening ← A1/A2 DONE, A3 awaiting go-ahead

Apply production-grade PostgreSQL design rules to the **existing** schema. **Review, not redesign** — the schema works and is migrated; the goal is to catch concrete risks (money types, timestamp tz, missing indexes on FK/filter columns, over-/under-normalization, JSONB misuse, soft-delete consistency, CASCADE safety) and fix only what's justified.

- [x] A1. Full read of `prisma/schema.prisma` (all models).
- [x] A2. Produce [`DATABASE_DESIGN_REVIEW.md`](DATABASE_DESIGN_REVIEW.md) — every area reviewed, each item labelled ✅/🟡/🔴/ℹ️. **Finding: schema is production-grade; the one systemic gap is query-driven FK/filter indexing (16 indexes across 74 models).**
- [x] A3. Query-driven indexes ADDED to `schema.prisma` and **migrated** (user-authorized) — `migrations/20260913023829_add_query_driven_indexes` (16 indexes across 12 models; redundant ones skipped where a composite unique already covers the prefix). `prisma migrate status` → in sync (20 migrations). Note: `prisma generate` hit a benign Windows EPERM (running api dev server holds the query-engine DLL) — harmless, since indexes don't change the Client's types; regenerates on next server restart. For a large customer DB, hand-edit future index migrations to `CREATE INDEX CONCURRENTLY`.
- [ ] A4. Verify: `prisma migrate` clean + full integration suite green.

**Exit:** review doc exists ✅; agreed fixes migrated; tests green.

---

## Phase B — Folder-structure review ← DONE

Backend is already cleanly modular (`src/modules/*`, `middleware/`, `lib/`, `config/`). Frontend is Next.js app-router (`src/app/dashboard`, `src/app/portal`, `src/components`, `src/lib`). This phase was a **review + light cleanup**, not a restructure.

- [x] B1. Backend module layout matches spec §26; route→auth→validation→authz→controller→service→Prisma flow consistent; no concern-mixing found.
- [x] B2. Frontend separation confirmed: server/client boundary respected, shared primitives in `components/`, no duplicated dialogs/tables.
- [x] B3. Canonical structure documented in [`DATABASE_DESIGN_REVIEW.md`](DATABASE_DESIGN_REVIEW.md) → "Folder structure" section. **No restructure needed.**

**Exit:** structure documented ✅; no real violations — the one ongoing discipline is permission-driven visibility + scope filters on every new page/endpoint.

---

## Phase C — Backend gap closure (from the audit, ranked) ← C1/C2/C3 DONE + tested

- [x] C1. **HIGH/security** — `GET /api/v1/sections` + `/teachers` no longer leak. New `getInchargeScopedSectionIds()` (incharge-scopes/service.ts) resolves an Incharge's scope to concrete section ids; both list handlers now branch unrestricted → campus → INCHARGE → else-nothing. `listTeachers` also fixed off `Role.systemKey` (was the now-editable `name`). Proven by 2 new `scope-enforcement.test.ts` cases (Incharge sees in-scope section/teacher, not out-of-scope). (§19/§50)
- [x] C2. **MEDIUM** — Homework/Assessments/Class-Diary 500 for Incharge fixed at the source: `resolveSectionScopeFilter` now returns the Incharge's scoped-sections filter (`{ sectionId: { in } }`) instead of throwing `SECTION_REQUIRED` — consistent with how Campus Head gets campus-wide, no frontend picker needed. New test: Incharge `GET /homework` with no sectionId returns 200, scoped correctly. (§46)
- [x] C3. **MEDIUM (results done)** — Result lifecycle transitions (submit/review/finalize/publish) refactored to an atomic conditional `updateMany(where: { id, status: from })` — closes the read-then-write race (spec §35 "two users approve the same result"). Results suite 14/14. Payment idempotency already existed (`gatewayTxnId @unique`). **Deferred to the index migration bundle:** a DB unique on the timetable slot (app-level conflict detection already exists) + admission-submit idempotency review.
- [ ] C4. **LOW** — Student attendance method policy (camera/hardware) — only if the customer needs it; staff QR already exists. (§23)
- [ ] C5. **BLOCKED** — Gateway policy modes (SHARED_ONLY/CAMPUS_ONLY/BOTH_ALLOWED) via `FeatureConfig` gating. (§21)

**Exit:** C1–C3 done + tested ✅ (unit 25/25, scope 19/19, results 14/14); C4/C5 deferred with reason.

---

## Phase D — Frontend role rollout

Foundation (permission-driven sidebar, `DataTable`, `DeltaBadge`, shadcn charts, Sonner, permission-gated pages) is built and proven on Super Admin + the staff shell. Roll it out to the roles that still lack polished UI.

- [x] D1. Office dashboard: served by the permission-driven staff shell (audited in (ay)/(az)) — Office sees exactly its permitted pages. No separate rebuild needed. (§42)
- [x] D2. Teacher portal audited — real: `/portal` shows real teacher-assignments; attendance/homework/timetable branch to the teacher's own assigned sections; leave is real. (§43)
- [x] D3. Parent portal audited + gap fixed — children selector (`ChildSwitcher`) used across attendance/timetable/homework/results/fees/complaints/leave; each fetch is scope-correct (own children only). **Fixed: Report Card was missing for Parent** (page was student-only, not in Parent nav) despite Parent holding `report_card.view` — report-card page now supports Parent via `ChildSwitcher` and it's added to the Parent nav (§44).
- [x] D4. Student portal audited — real, own-data only (`user.studentId`) across timetable/attendance/homework/results/report-card. (§45)
- [x] D5. Portal already meets the production UI standard: semantic Lucide icons (portal-nav + home actions), real empty states, real scope-correct fetches, no fake interactions found. Role-based portal-variant selection is a legitimate UI-shape decision (not the role-name drift the dashboard had).

**Exit:** portal is real and scope-correct — **verified per role at the data layer** (2026-09-13): seeded a coherent demo scenario (`scripts/_seed-portal-demo.ts` — Teacher+assignment as class teacher, Student+enrollment+login, Parent+linked child, published homework, attendance, invoice) and drove authenticated fetches as each role:
- Teacher → `/teacher-assignments` 200 (own assignment).
- Parent → `/students` 200 (own child); child-scoped `/invoices` 200, `/results` 200, `/report-cards` 200 (validates the report-card fix), `/attendance` 200.
- Student → `/students` 200 (self), `/attendance` 200, `/results` + `/report-cards` 200. `/invoices` 403 is **by design** (STUDENT lacks `invoice.view`; Fees not in student nav).

Visual browser pane walkthrough was blocked this run by a window-focus issue (Claude's window behind another → screenshots time out); the data-layer verification above is the stronger check. Demo logins (password `Verify123!Pass`): `verify-teacher@`, `verify-parent@`, `verify-student@myproduct.local` — the user can do the visual pass anytime.

---

## Phase E — Testing & hardening sweep

- [ ] E1. IDOR/BOLA pass across student/parent/teacher/section/attendance/marks/invoice/payment (§50).
- [ ] E2. Negative-testing pass (§51): wrong role/campus/scope, inactive user, archived resource, invalid state, duplicate request.
- [ ] E3. Full integration suite green against local Postgres + Neon.

**Exit:** suites green; IDOR/negative cases explicitly covered.

---

## Phase F — (Optional, on request) Standalone PostgreSQL design guide

The spec's domain-neutral "reusable DB design methodology" as `POSTGRES_DESIGN_GUIDE.md` — reference material, independent of this codebase. Author only if the user wants the generic guide in addition to the applied review in Phase A.

---

## Sequencing rationale

DB review (A) first because everything sits on the schema and the user asked for production DB rules explicitly. Folder structure (B) is a quick review, done alongside A. Then the ranked backend gaps (C) — security leak first. Then frontend rollout (D) on the now-solid base. Testing (E) throughout, formalized at the end. The generic PG guide (F) is optional and independent.
