# Documentation Index

**Read `PROJECT_STATUS.md` first — always.** It is the single source of truth for
"what phase are we on, what's done, what's next." Everything else here is
supporting reference.

If you are an agent (human or AI) picking up this project cold, read in this order:

1. **`PROJECT_STATUS.md`** — current phase, what exists, what's next, session log.
   Update this file at the end of every work session. This is the only file
   that changes frequently.
2. **`PHASE_TRACKER.md`** — the 11-phase roadmap (Phase 0 → Phase 10) as a
   scannable checklist. Tells you which phase to work on and its dependencies.
3. **`PRODUCT_SPEC.md`** — the master product specification (roles, permissions,
   authorization model, data models, workflows, business rules, UI/UX
   guidelines, testing strategy, one detailed section per phase). This is the
   **"what to build"** reference. Treat it as stable/locked — see the note at
   its top before editing it.
4. **`PHASE_11_MULTI_CAMPUS_AND_WORKFLOWS.md`**, **`ROLE_PERMISSION_MATRIX.md`**,
   **`DYNAMIC_INSTITUTION_ARCHITECTURE.md`** — design docs for Phase 11/12, not yet approved for coding. See
   `PHASE_TRACKER.md`'s Phase 11/12 rows.
5. **`ENGINEERING_PRINCIPLES.md`** — standing rules (edge-case checklist, never-trust-the-frontend,
   no-hardcoding, feature-completion definition) that apply to every phase, not just a specific one.

(`archive/` — historical planning docs from an earlier, abandoned attempt at this product, codenamed
`D:\sm` — was deleted 2026-09-12 with the user's confirmation; it described a different, discarded
multi-tenant architecture this project never used. If you're reading this and `archive/` still shows up
somewhere, it's stale — check `PROJECT_STATUS.md`'s session log.)

## Working conventions for every agent/session

- **Before coding a feature:** find its phase in `PHASE_TRACKER.md`, read that
  phase's full section in `PRODUCT_SPEC.md`, confirm dependencies are actually
  met (not just marked done).
- **After finishing meaningful work:** update `PROJECT_STATUS.md` — move
  checkboxes in `PHASE_TRACKER.md`, add a dated entry to the session log, note
  any deviations from `PRODUCT_SPEC.md` and why.
- **Authorization model is non-negotiable:** every access check is
  `Role + Permission + Scope + Context + State`, never role alone. See
  `PRODUCT_SPEC.md` §5.
- **No hard deletes** on Student, Payment, Invoice, Receipt, Attendance, Marks,
  Results, Admission/Enrollment history, or Audit logs. Archive/void/withdraw/
  reverse instead. See `PRODUCT_SPEC.md` §7.
- **Audit vs. Activity log are different things** — don't conflate them. See
  `PRODUCT_SPEC.md` §8.
- **UI must use shadcn/ui exactly** — official components, default sizing/
  spacing/theme tokens, no ad-hoc component reinvention. When doing any
  UI/design work, invoke the `impeccable` skill rather than freehanding layout
  or visual decisions.
- **Single-tenant deployment model:** one customer = one isolated deployment
  (own domain, own hosting, own database, customer-owned). The provider
  platform (Phase 10) never touches customer operational data. See
  `PRODUCT_SPEC.md` §2.
- **Every phase is also gated by `ENGINEERING_PRINCIPLES.md`** — edge cases, never-trust-the-frontend,
  no hardcoded business assumptions (class/section/role names, etc.), and the full feature-completion
  definition. Read it once, then keep it in mind every session — it isn't repeated per phase doc.
