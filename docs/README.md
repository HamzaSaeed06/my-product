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
4. **`archive/`** — historical planning documents from an earlier, abandoned
   attempt at this product (codenamed at `D:\sm`, which used a different,
   now-discarded multi-tenant architecture). Kept only for context on past
   decisions. **Do not treat anything in `archive/` as current truth** — it
   describes a different codebase that this project does not use or migrate
   from. This project starts from zero code.

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
