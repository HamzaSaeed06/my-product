# Dynamic Institution Architecture — Design Doc

**Status:** Design only — NOT approved for implementation. No code written against this yet.
Captures the user's "product must not be school-specific" requirement (2026-09-12), scoped against what the
codebase actually does today (confirmed by reading the schema and frontend, not assumed).

## Why this doc exists

The user's requirement: this platform must work for schools, academies, coaching centers, tuition
institutes, and training centers — without a separate codebase per type, and without core business logic
ever hardcoding school-specific assumptions (fixed class lists, sections named A/B/C, a mandatory Parent
entity, school-only terminology, etc.).

## Good news first: the data model is already mostly there

Checked directly against `product/api/prisma/schema.prisma` before designing anything, per this project's
own rule of reading the real code instead of assuming:

- `Institute.type` (`InstituteType`: SCHOOL / ACADEMY / COACHING_CENTER / INSTITUTE) **already exists** —
  but nothing reads it anywhere except the Institute settings form itself (confirmed: the only two files
  referencing it in `product/web` are `dashboard/institute/page.tsx` and `institute-forms.tsx`). It's stored
  but functionally inert.
- `Class`, `Section`, `Subject` are **already free-text-named**, not fixed enums — `Section.name` even has an
  existing code comment: *"configurable, not fixed A/B/C, per spec."* An institute can already create a
  `Class` row named "Program A" or a `Section` named "Batch 3" today. **The underlying entities are already
  generic.**
- `StudentParent` is a **separate, optional join table** — a `Student` never requires a `Parent` row to
  exist. An adult-learner training institute can already operate with zero Parent records.
- `Campus` is already its own model, not assumed-singular or assumed-plural.

**So this is not a data-model rewrite.** The actual gap is narrower than the full requirement doc implies:
nobody has wired `Institute.type` (or anything else) to change what label the UI shows, and role
authorization checks the role's *name string* directly rather than a stable key, which blocks role
relabeling. Both are addressable additively.

## Gap 1 — UI terminology is hardcoded English, not configurable

Every page, sidebar link, and form label ("Classes", "Sections", "Subjects", "Class Teacher", "Enrollment")
is a literal string baked into `product/web`'s JSX. A coaching center forced to see "Class → Section →
Subject" instead of "Course → Batch → Subject" is exactly the complaint the requirement doc raises.

**Proposed model — a `TerminologyOverride` table, institute-scoped (not per-campus):**

```
TerminologyOverride
  id            String   @id
  instituteId   String
  canonicalKey  String   // e.g. "CLASS", "SECTION", "SUBJECT", "CAMPUS", "TEACHER", "ENROLLMENT"
  singularLabel String
  pluralLabel   String
  @@unique([instituteId, canonicalKey])
```

- **Institute-scoped, not campus-scoped** — same reasoning already established in Phase 11's
  C-addendum for custom admission fields: two campuses of the same institute using different words for the
  same concept would be confusing, not helpful. Terminology is an identity decision for the whole
  institute, same tier as its name/branding.
- **Canonical entity/model names in the code never change** — `Class`, `Section`, `Subject` stay exactly as
  they are in the schema, API routes, and permission keys (`class.view`, `section.create`, ...) forever.
  Only the **displayed label** changes. This is deliberate: renaming database/API identifiers to match
  per-customer vocabulary would be a much larger, riskier change for zero functional benefit — the whole
  point is that "Program" and "Class" are the same underlying thing wearing a different label.
- **Institution-type presets, editable after the fact:** picking a type at Institute setup seeds sensible
  defaults into `TerminologyOverride` (School → Class/Section/Subject; Academy/Coaching Center →
  Program/Batch/Course; Training Institute → Program/Group/Module) via a static preset map, not a second
  source of truth — it's a one-time seed, and Super Admin can edit any label afterward same as any other
  setting.
- **Frontend consumption:** a single `getTerminology()` server-side helper (mirrors the existing
  `getCurrentUser()` `cache()`-wrapped pattern in `src/lib/session.ts`) loads the institute's overrides once
  per request and falls back to the English default for any key with no override row. Every page swaps its
  hardcoded label strings for `t.class.plural` etc. — a mechanical, page-by-page rollout (same "incrementally,
  not a giant rewrite" approach already used for Phase 11's planned `DataTable` rollout), not a single
  flag-day cutover.

**Edge cases:**

| Scenario | Problem | Solution |
|---|---|---|
| An institute changes its terminology after already having months of data | Old screenshots/reports/PDFs used the old word | Not a data problem — labels are rendered live at request time, never baked into stored records. Historical PDF report-card snapshots (already stored as JSON, per Phase 4) keep whatever label was live when generated — acceptable, matches how a paper report card would work too |
| A custom institute type needs a word this preset list doesn't have | Preset list is finite | `canonicalKey` set is fixed (it maps 1:1 to real entities), but the **label** is always freely editable per institute regardless of type — the preset is just a starting point, never a ceiling |
| Institute-mandatory academic policy text (e.g. grading scale descriptions) also uses "Class" | Terminology leak outside the table/label layer | Out of scope for this table — copy inside long-form policy text is a content-authoring problem, not a UI-chrome one; not solved here |

## Gap 2 — role names are used as authorization identity, not just as labels

The requirement doc is explicit: *"Role names shown in the UI must not determine business logic. Permissions
and scopes must control access."* Checked against the real code: `product/api/src/lib/scope.ts` and 7 other
files currently branch on the literal string `"PRINCIPAL"` (soon "CAMPUS_HEAD") — e.g. `UNRESTRICTED_ROLES`
is a hardcoded array of role-name strings. This is exactly the anti-pattern the requirement doc warns against,
and it's already load-bearing in the current codebase, not hypothetical.

**Proposed model:**
- Add `Role.systemKey` (nullable, unique when set) — a stable identifier (`SUPER_ADMIN`, `CAMPUS_HEAD`,
  `INCHARGE`, `OFFICE`, `TEACHER`, `PARENT`, `STUDENT`) that **authorization code checks instead of
  `Role.name`**. `Role.name` becomes purely the **display label**, freely editable (an institute can rename
  "Campus Head" to "Director" or "Branch Manager" without touching a single permission grant).
- A custom, institute-defined role (e.g. "Counselor") has `systemKey: null` — it behaves purely through its
  granted permissions, with no special-cased business logic anywhere, which the platform already mostly
  supports today (permissions are already a generic many-to-many grant) — the only thing stopping a fully
  custom role from working today is the handful of `role.name === "X"` checks this gap fixes.
- Migration is mechanical but must touch every one of those 8 files: replace each `role.name === "PRINCIPAL"`
  /`UNRESTRICTED_ROLES.includes(role.name)` with the equivalent `role.systemKey` check, backfilling
  `systemKey` for the 7 seeded core roles in the same migration that adds the column.

**Edge cases:**

| Scenario | Problem | Solution |
|---|---|---|
| Someone renames "Teacher" to "Instructor" via the Roles screen | Could look like it silently breaks teacher-specific logic | It doesn't — every check now reads `systemKey`, untouched by the rename. Verify this with a dedicated test once implemented: rename a system role's `name`, confirm authorization behavior is unchanged |
| A future feature is tempted to add a new `role.name === "X"` check | Regression back into the anti-pattern | Add this rule to `ENGINEERING_PRINCIPLES.md`'s standing checklist (already added) and call it out explicitly in `docs/README.md`'s conventions list, so it's checked every session, not just remembered once |
| A custom role needs a genuine behavior difference no permission covers (rare) | Permissions alone can't express it | Not solved generically — flagged as a case-by-case decision if it ever actually comes up, not designed for speculatively |

## Gap 3 — the institution-governance policy model needs to be a reusable pattern, not repeated per feature

The requirement doc's Mandatory / Institution-Default / Campus-Controlled model (already scoped narrowly to
a few features in Phase 11 — Attendance Method, Payment Gateway policy) needs to generalize to **any**
configurable feature without a new table per feature.

**Proposed model — one generic `FeatureConfig` table:**

```
FeatureConfig
  id           String   @id
  instituteId  String
  campusId     String?  // null = institute-level row
  featureKey   String   // e.g. "ATTENDANCE_METHOD", "PAYMENT_GATEWAY_POLICY", "PERIOD_DURATION"
  policyMode   PolicyMode  // MANDATORY | INSTITUTE_DEFAULT | CAMPUS_CONTROLLED   (set at the institute-level row only)
  valueJson    Json
  @@unique([instituteId, campusId, featureKey])
```

**Resolution logic** (one shared function, `resolveFeatureConfig(instituteId, campusId, featureKey)`), not
duplicated per feature:
1. Read the institute-level row (`campusId: null`) for `featureKey` — its `policyMode` governs.
2. `MANDATORY` → return the institute-level `valueJson` always; a campus-level row for this key is refused
   at write time (`FEATURE_POLICY_MANDATORY`), never silently ignored if one somehow exists.
3. `INSTITUTE_DEFAULT` → return the campus-level row's `valueJson` if one exists, else fall back to the
   institute-level `valueJson`.
4. `CAMPUS_CONTROLLED` → the institute-level row is only a suggested starting value; each campus manages its
   own row independently, campus row required before first use (seed it from the institute default at
   campus-creation time so there's never a "missing config" gap).
- This directly replaces the ad-hoc per-feature scoping Phase 11 sketched for Attendance Method and Payment
  Gateway — those become two `featureKey` values on this one generic table instead of bespoke columns.

**Edge cases:**

| Scenario | Problem | Solution |
|---|---|---|
| Super Admin flips a feature from `CAMPUS_CONTROLLED` to `MANDATORY` after campuses already diverged | Existing campus-level rows now conflict with the new mandatory value | The campus rows aren't deleted (never destroy data) — they become inert/unread once `MANDATORY` is set, visible in an admin screen as "overridden, no longer in effect" rather than silently vanishing, so a later revert to `CAMPUS_CONTROLLED` restores exactly what each campus had |
| A `featureKey` is queried but no institute-level row exists yet | Undefined behavior | `resolveFeatureConfig` requires an institute-level row to exist per key at institute-setup time (seeded with a sensible built-in default) — never an unconfigured feature reaching runtime code |
| Two features need genuinely different value shapes (a string enum vs. a nested object) | `valueJson` is untyped at the DB level | Each `featureKey` owns its own Zod schema in application code (same pattern as every other JSON field already in this codebase, e.g. `ReportCard`'s snapshot) — validated at write time, not enforced by the DB |

## Gap 4 — campus is optional for a single-campus institution

Confirmed already correct in intent (Phase 1 lets an institute exist with a single `Campus` row), but the
requirement doc is explicit that a single-campus institution **must not be forced through unnecessary setup
steps**. Proposed: `create-institute.ts`'s bootstrap (or the equivalent onboarding flow) auto-creates one
default `Campus` ("Main Campus", renameable) in the same transaction as the `Institute` row, so a
single-campus customer never sees an empty "no campuses yet" screen or a mandatory "create your first
campus" step before anything else works — it's invisible plumbing for the common case, not a missing
feature for the multi-campus case.

## Explicitly out of scope for this phase

- Renaming database tables/columns/API routes/permission keys to match customer vocabulary — never done;
  canonical names stay stable forever (Gap 1's whole point).
- A plugin/workflow-engine system for genuinely different step sequences per institution type — not
  requested by any concrete example in the requirement doc; the examples given (School vs. Coaching Center
  vs. Training Institute flows) are all the same underlying Student→Enrollment→Section shape wearing
  different labels, not structurally different workflows. Revisit only if a real customer surfaces a
  workflow this can't express.

## Suggested sequencing relative to Phase 11

Gap 2 (role `systemKey`) should land **before or alongside** Phase 11 Phase A, since Phase A already touches
`scope.ts`'s `UNRESTRICTED_ROLES` — doing both in the same pass avoids touching that file twice. Gaps 1, 3,
and 4 have no hard dependency on Phase 11 and can be sequenced independently once approved.

## Open items needing the user's confirmation before coding starts

1. Confirm the `TerminologyOverride` approach (label-only, institute-scoped, canonical names never change)
   matches what "dynamic terminology" means to the user — versus expecting something deeper.
2. Confirm `Role.systemKey` migration is in scope now (it's a real refactor of 8 existing files) versus
   deferring until a customer actually needs to rename a role.
3. Confirm the generic `FeatureConfig` table is preferred over continuing to bespoke-model each governed
   feature individually as Phase 11 currently sketches for Attendance Method / Payment Gateway.
