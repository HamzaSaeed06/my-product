# Database Design Review — Production PostgreSQL Rules Applied to the Actual Schema

**Created:** 2026-09-13
**Scope:** `product/api/prisma/schema.prisma` — 74 models, 21 `Decimal` money columns, 201 `DateTime` fields, 16 `@@index`.
**Method:** the production PostgreSQL design checklist (keys, types, money, timestamps, constraints, FK integrity, indexing, JSONB, soft-delete, concurrency, normalization) applied to the **real schema, table by table** — not a generic essay. Every finding cites a line/model. **Review, not redesign** — per the master spec's §0/§54 we do not rewrite a working, migrated schema; we flag concrete, justified improvements only.

**Label legend:** ✅ IMPLEMENTED (correct, production-grade) · 🟡 IMPROVE (safe, worthwhile) · 🔴 RISK (should fix) · ℹ️ INFO (design note, no action).

---

## Executive summary

The schema is **genuinely production-grade** on the things that most often go wrong: **money is `Decimal(12,2)` everywhere** (zero `Float` for money — line 1559 even carries an explicit rule comment), UUID PKs are consistent, foreign keys have deliberate `onDelete` choices, composite unique constraints guard real business keys, soft-delete is used *selectively* (not blanket), JSONB is used only for genuinely semi-structured data, and idempotency + optimistic-locking primitives already exist.

**The one systemic, high-value gap is indexing.** Only **16 `@@index` across 74 models** — and PostgreSQL does **not** auto-index foreign-key columns. Several hot filter/join columns (`campusId`, `studentId`, `sectionId`, `invoiceId`, …) are unindexed, which is fine at seed-data volume but becomes sequential scans as a real institute's data grows. This is the #1 thing to address, **query-driven** (not "index every FK blindly").

---

## 1. Primary keys & identifiers — ✅ IMPLEMENTED

UUID (`@default(uuid())`) on every model. Consistent, not URL-guessable (a security plus for a system exposing IDs in API paths), safe for the provider-side/multi-deployment model.

ℹ️ **Trade-off note (no action):** these are UUIDv4 (random) → no time-ordering and slightly worse B-tree insert locality than `bigint` identity or UUIDv7. At this domain's scale (one institute, thousands–low-millions of rows) this is irrelevant. Not worth changing. If a single table ever becomes append-heavy at very high volume (e.g. `audit_logs`, `attendance`), UUIDv7 for *that* table could be reconsidered then — not now.

## 2. Money & numeric types — ✅ IMPLEMENTED (exemplary)

All 21 monetary columns are `Decimal @db.Decimal(12,2)` (Invoice, InvoiceItem, Payment, PaymentAllocation, PaymentAttempt, refunds/discounts/waivers/cash-closing). **No `Float` for money anywhere.** The 6 `Float` fields are all legitimate: `geoLat`/`geoLng` (GPS for staff attendance) and `marksObtained`/`totalMarks`.

🟡 **IMPROVE (LOW): marks as `Float`.** `marksObtained`/`totalMarks` (lines 1361, 1489-90) are `Float`. Fractional marks (e.g. 33.33) in floating point can accumulate tiny rounding errors in aggregates/averages. `Decimal(5,2)` would be exact. Low stakes (marks aren't money), but a clean, cheap correction if a results migration is happening anyway.

## 3. Timestamps & time zones — 🟡 IMPROVE (MEDIUM)

**0 uses of `@db.Timestamptz`** — all 201 `DateTime` fields map to PostgreSQL `timestamp(3)` **without** time zone. Prisma's driver reads/writes UTC, so for a **single-timezone deployment this is usually fine**. But:

- `InstituteSettings.timezone` is a configurable field (line 429) — the product *intends* to support institutes in different time zones. `timestamp without time zone` stores no offset; correctness then depends entirely on every write going through UTC-normalizing app code, with no DB-level guarantee.
- Attendance/timetable/payments reason about "today" and "now" — the exact class of data where a tz mismatch produces off-by-one-day bugs.

**Recommendation:** for a single-tz customer, leave it. Before onboarding a customer in a different tz (or a multi-campus-across-tz institute), migrate the time-sensitive tables (attendance, timetable, payments, sessions, audit) to `@db.Timestamptz(6)`. Flag now; don't mass-migrate speculatively (that's the "optimize imaginary problems" anti-pattern).

## 4. Constraints & referential integrity — ✅ IMPLEMENTED

- **Composite uniques** guard real business rules: `Section(classId,campusId,academicYearId,name)`, `AcademicYear(instituteId,name)`, `Class(instituteId,name)`, `RolePermission(roleId,permissionId)`, `UserRole(userId,roleId,campusId)`, `FeatureConfig(instituteId,campusId,featureKey)`, `TerminologyOverride(instituteId,canonicalKey)`.
- **Business-key uniques:** `invoiceNumber`, `paymentNumber`, `allocationNumber`, `attemptNumber`, `gatewayTxnId`, `Permission.key`, `Role.name`, `Role.systemKey`, `User.email`.
- **`onDelete` is deliberate:** `Cascade` on true ownership (sessions/notifications under user, items under invoice, sections under class); left as default `Restrict` where a delete should be blocked (e.g. `Payment.recordedBy`). Matches §8 "don't CASCADE blindly."

ℹ️ **INFO: `FeatureConfig` institute-level uniqueness** — the `@@unique([instituteId, campusId, featureKey])` does not constrain institute-level rows (`campusId IS NULL`), because Postgres treats NULLs as distinct in a unique index; it's enforced in `lib/featureConfig.ts` instead. 🟡 A **partial unique index** `CREATE UNIQUE INDEX ... ON feature_configs (instituteId, featureKey) WHERE campusId IS NULL` would move that guarantee into the DB (defense in depth). Optional hardening.

ℹ️ **INFO: `Institute` singleton** — enforced at the service layer (refuse a 2nd row), not the DB (line 396-398). Acceptable and documented; a `CHECK`/partial-unique-on-constant could DB-enforce it, but service-layer is a reasonable choice.

## 5. Indexing — 🔴 RISK (the #1 item), query-driven

**16 `@@index` across 74 models.** Present where it counts most (`Session.userId`, `AuditLog(resource,recordId)`, `AuditLog.actorId`, `Notification(userId,readAt)`, `Delegation(delegateToUserId,validFrom,validUntil)`, `InchargeScope.userId`, `Document(ownerType,ownerId)`, `ApprovalRequest.status`). But **PostgreSQL does not auto-create indexes on FK columns** — so the many list/filter/join queries this app runs on unindexed FKs do sequential scans that only get slower with data.

**Do NOT index every FK blindly** (that's the §9 anti-pattern — write overhead + storage for nothing). Index **query-driven**: the columns actually used in `WHERE`/`JOIN`/`ORDER BY` by real endpoints. Confirmed hot paths from this session's code:

| Table | Column(s) needing an index | Query that needs it |
|---|---|---|
| `sections` | `campusId`; `(classId, academicYearId)` | list sections by campus / by class+year |
| `enrollments` | `sectionId`; `studentId`; `academicYearId` | roster by section, student history |
| `invoices` | `studentId`; `campusId`; `status` | student ledger, campus finance, unpaid filter |
| `payments` | `studentId`; `createdAt` | payment history, daily collection |
| `payment_allocations` | `invoiceId`; `paymentId` | invoice balance calc |
| `attendance` | `(sectionId, date)`; `studentId` | mark/view attendance for a section+date |
| `teacher_assignments` | `teacherId`; `sectionId` | teacher's classes, section's teachers |
| `results` / `assessments` | `sectionId`; `(examId/…, sectionId)` | results per section |
| `complaints` / `leaves` | `campusId`/`studentId`; `status` | campus queues, status filters |
| `user_roles` | `campusId` | "staff on my campus" (Campus Head) |

**Action (A3):** one additive migration adding these indexes. `CREATE INDEX` is non-destructive and reversible — but it runs against the live **Neon** database, so it needs an explicit go-ahead first (and ideally `CREATE INDEX CONCURRENTLY` on any already-large table to avoid write locks). **Verify with `EXPLAIN ANALYZE`** on the real queries before/after, per §10 — don't add on faith.

## 6. JSONB / semi-structured — ✅ IMPLEMENTED (correct restraint)

`Json` used only where data is genuinely schema-less: `AuditLog.oldValue/newValue`, `ApprovalRequest.payload`, `FeatureConfig.valueJson`. **Not** used as a lazy replacement for relational modeling (the §17 anti-pattern). No action. (If any `valueJson` ever needs server-side querying by inner key, add a GIN index on that column then — not preemptively.)

## 7. Soft delete & lifecycle — ✅ IMPLEMENTED (correct restraint)

`archivedAt` appears **selectively** (Role, Campus, Class, Section, …) — not blanket `deleted_at` on every table (the §16 anti-pattern). Immutable records (`AuditLog`) are never soft-deleted. Financial reversal is a state transition (`REVERSED`/`VOID` + reason), not a delete — exactly §22.

## 8. Concurrency primitives — ✅ PARTIAL (good foundation)

- **Optimistic locking:** `InchargeScope.version` (line 645) with documented "reject on mismatch, never last-write-wins."
- **Idempotency:** `PaymentAttempt.gatewayTxnId @unique` prevents duplicate `Payment` from a replayed webhook (§34).
- **Transactions:** `$transaction` used in 11 modules for multi-write operations.

🟡 **IMPROVE:** extend the same rigor to the other concurrency-sensitive paths flagged in the audit (§35): timetable-slot assignment (unique constraint on `(timetableId, dayOfWeek, periodNumber)` + on teacher-slot), result-approval double-submit, and admission/result submission idempotency. Verify each; add a constraint/version only where a real race exists.

## 9. Normalization — ✅ IMPLEMENTED

Cleanly ~3NF. Deliberate, documented denormalizations are justified and safe: `Invoice.campusId` is a **point-in-time snapshot** of the student's campus at invoice time (so a later campus transfer doesn't move history) — a correct, reasoned denormalization with the consistency implication written down (lines 1671-1677). No accidental duplication found.

---

## Prioritized action list (DB)

1. 🔴 **FK/filter indexes (query-driven)** — the table in §5, one additive migration, `EXPLAIN ANALYZE`-verified, `CONCURRENTLY` on large tables. **Needs go-ahead (touches live Neon).**
2. 🟡 **Concurrency hardening** — timetable-slot unique constraint + verify result/admission idempotency (ties into audit gap C3).
3. 🟡 **Timestamptz** — only before onboarding a differently-tz'd customer; migrate time-sensitive tables then.
4. 🟡 **Marks → `Decimal(5,2)`** — cheap correctness, do it if a results migration happens anyway.
5. 🟡 **`FeatureConfig` partial-unique + `Institute` singleton DB guard** — optional defense-in-depth.

Nothing here is a rewrite. The schema's foundations (money, keys, constraints, FK integrity, restraint on soft-delete/JSONB) are already correct.

---

## Folder structure (Plan Phase B) — ✅ mostly clean

**Backend** (`product/api/src/`): `app.ts` (composition root), `config/`, `middleware/`, `lib/` (shared: scope, audit, featureConfig, terminology, requestContext, tokens, password), `modules/<domain>/{routes,controller,service}.ts` ×~50. Matches the spec's §26 conceptual structure. Route→auth→validation→authz→controller→service→Prisma flow is consistent (§27). No parallel/duplicate architecture found.

**Frontend** (`product/web/src/`): Next.js app-router — `app/dashboard/*` (staff shell), `app/portal/*` (teacher/parent/student), `components/` (shared primitives: `data-table`, `delta-badge`, `form-dialog`, `confirm-action-button`, `ui/*`), `lib/` (`api`, `apiClient`, `session`). Server/client boundary respected. Shared dialogs/tables not duplicated per-page.

**No restructure needed.** One convention to keep enforcing: every new dashboard page derives visibility from `permissions[]` (the pattern established this session), and every new backend list endpoint applies the scope filter — the two places drift creeps in.
