# Engineering Principles — standing rules for every phase

These are not a one-time checklist for a single feature — they apply to **every** phase, every session,
every agent. Captured once here (2026-09-12, from the user's own detailed requirement doc) instead of
repeated in each phase design doc. `docs/README.md` links here as a standing convention; every phase's
"Acceptance Criteria" in `PRODUCT_SPEC.md`/`PHASE_TRACKER.md` is implicitly gated by this list too.

## 1. Edge-case-first, not happy-path-only

Before writing a feature, work through every category below for it — not just "click button → save →
success message":

- **Normal cases**: successful create/update/delete-or-archive, normal workflow completion.
- **Validation cases**: missing fields, invalid values, duplicates, invalid relationships/dates/amounts,
  invalid status transitions, invalid configuration.
- **Permission cases**: unauthorized user, wrong role, wrong campus, wrong class/section/batch scope, wrong
  student ownership, direct API access bypassing the UI, cross-institution access attempt, cross-campus
  access attempt.
- **Concurrency cases**: two users editing the same record, two payments arriving simultaneously, two users
  assigning the same resource, simultaneous timetable changes, duplicate submissions.
- **Failure cases**: network failure, DB failure, external API failure, payment gateway timeout, partial
  operation failure, unexpected server error, browser refresh mid-operation, request retry.
- **Configuration cases**: feature disabled, feature mandatory at institute level, feature using the
  institute default, campus override allowed/prohibited, configuration changed after records already exist.
- **Data cases**: no data, one record, a large number of records, archived records, inactive users,
  deleted/deactivated relationships, historical records, missing optional relationships.
- **State cases**: every important entity has explicit, named states (e.g. Invoice:
  Draft/Issued/Partially Paid/Paid/Cancelled/Expired) and the system must refuse invalid transitions between
  them — this codebase already does this correctly for Result, Payment/Invoice, and Complaint; keep doing it
  for every new stateful entity.

## 2. Sixteen questions every feature must answer before it's "done"

1. What happens on success?
2. What happens if validation fails?
3. What happens if the user lacks permission?
4. What happens if the record doesn't exist?
5. What happens if the record belongs to another campus/institution?
6. What happens if the record is inactive/archived?
7. What happens under simultaneous operation by two users?
8. What happens if the request is submitted twice?
9. What happens if the DB operation fails?
10. What happens if an external service fails?
11. What happens if configuration changes mid-flight?
12. What happens if related data is missing?
13. Can the operation be safely retried?
14. Should it roll back on partial failure?
15. Should it create an audit record?
16. What does the user actually see on failure?

## 3. Never trust the frontend for security

A hidden button is not a security control. Every protected operation is independently enforced server-side
through the full chain — this is already this codebase's stated model (`docs/README.md`: "every access check
is Role + Permission + Scope + Context + State, never role alone"):

```
Authentication → Role/Permission → Institution Scope → Campus/Branch Scope → Object Scope → Business Rules → State Rules → Operation
```

A Campus A user must not gain Campus B data merely by editing an ID in the URL/payload — the backend
independently re-verifies ownership on every request, never inferring it from what the frontend chose to
render or disable.

## 4. Never hardcode business assumptions

No `if className === "9th"`, `if section === "A"`, `if campus === "main"`, `if role === "teacher"`,
`if subject === "math"` — anything institution-configurable is looked up by ID/permission/relationship, not
matched by name or position. This directly motivates
[`DYNAMIC_INSTITUTION_ARCHITECTURE.md`](DYNAMIC_INSTITUTION_ARCHITECTURE.md)'s Gap 2 (role checks must use a
stable `systemKey`, never the display name) — the same principle applied to roles specifically, because the
existing code already violates it in 8 files today.

## 5. Data integrity outweighs a green UI

A successful UI response is never proof an operation is correct. The system must independently guarantee DB
constraints, FK integrity, unique constraints, transactional writes where required, correct
campus/institution ownership, correct financial arithmetic, correct state transitions, idempotency where
required, and auditability. A partial failure must never leave contradictory business data behind — this is
why this codebase already prefers explicit multi-step transactions (e.g. `transferEnrollment`) over
sequential unguarded writes, and why the one known exception (`promotions/service.ts`'s two-write gap,
documented in `PROJECT_STATUS.md` §1i) is called out rather than silently accepted as fine.

## 6. AI-agent-specific rules

An agent must understand existing architecture, entities, relationships, permissions, business rules,
configuration system, state machines, API conventions, and DB constraints **before** writing code — not
"build this feature" in isolation. Concretely, an agent must not:

- Create duplicate models/APIs where an existing one already covers the need.
- Bypass authorization to make a feature "just work."
- Hardcode institution-specific values (see §4).
- Change unrelated modules while implementing one feature.
- Rewrite a working module without a stated reason.
- Remove an existing business rule without the user confirming that's intended.
- Invent a workflow the user/spec never asked for.
- Assume happy-path-only behavior (see §1).
- Store secrets insecurely.
- Trust frontend-only validation (see §3).

## 7. Feature-completion definition

A feature is **not** done at "UI works + API works + DB saves." It's done when all of the following are
addressed: UI, API, DB, validation, authorization, scope isolation, business rules, state handling, error
handling, concurrency handling where relevant, configuration handling, audit requirements, edge cases, and
testing. This matches how this project already tracks phases in `PHASE_TRACKER.md` — a phase only moves to
🟢 once its full acceptance-criteria list is checked **and** its tests pass, not just "the code compiles."

## 8. Production mindset

Assume, always: multiple concurrent users, user mistakes, page refreshes mid-operation, duplicate requests,
network/external-service/DB failures, growing historical data, permissions changing over time, unusual
per-institution workflows, campuses operating differently from each other, configuration changing after
deployment, deliberate unauthorized-access attempts, and eventually large datasets. Priorities, in order:
correctness > convenience; data integrity > quick implementation; security > UI-only restriction;
configurability > hardcoding; recoverability > silent failure; explicit business rules > assumptions.

## 9. The core question to keep asking

*"What other valid configuration, user, state, failure, permission, or real-world condition could exist
here?"* — then handle it deliberately. The goal isn't maximum code volume; it's a system where legitimate
edge cases are handled safely, invalid ones are rejected correctly, and business data never becomes
inconsistent or exposed.
