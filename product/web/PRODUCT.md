# Product

## Register

product

## Users

Seven distinct roles, all staff/family members of a school, academy, or coaching
institute — not consumers, not tech-savvy by default:

- **Super Admin** — system administrator, configures the whole institution.
- **Principal** — campus-wide oversight, approves critical actions.
- **Incharge** — manages an assigned (dynamic, possibly overlapping) set of
  classes/sections — timetable, attendance, substitutions, results review.
- **Office** — front-desk admin: admissions, fees, records, day-to-day data entry.
- **Teacher** — daily teaching: attendance, homework, marks entry, own classes only.
- **Parent** — checks on their own children, pays fees, submits requests. Mobile-first.
- **Student** — views own academics only. Mobile-first, simplest of all roles.

Desktop admin roles (Super Admin/Principal/Incharge/Office/Teacher) work at a desk
during the school day, often multitasking, needing dense information and fast
data entry. Parent/Student check in briefly from a phone, often between other
tasks — glanceable, low-friction.

## Product Purpose

A white-label, single-tenant school/institute management platform (see
`docs/PRODUCT_SPEC.md` at the repo root for the full spec). It replaces manual
registers and ad hoc spreadsheets with one system covering admissions,
academics, attendance, results, fees, and communication — with real
authorization (role + permission + scope + context + state, never role alone),
audit trails on every critical action, and no hard deletes on financial or
academic records.

Success looks like: a Super Admin can configure their institution and trust
the system enforces the rules without hand-holding; a Teacher can mark
attendance and enter marks in seconds, not minutes; a Parent can check their
child's status without training or a manual.

## Brand Personality

Confident, modern, efficient. Same register as Stripe, Linear, Vercel — the
software of a serious tool, not a toy. It earns trust through precision and
restraint, not through friendliness or decoration. Confident means it doesn't
over-explain or over-confirm; modern means current interaction patterns
(command palettes, keyboard shortcuts, real-time feedback), not dated enterprise
software chrome; efficient means the fastest path to the task always wins over
visual flourish.

## Anti-references

- Colorful, childish, or "friendly" edtech aesthetics (rounded mascots, bright
  primary colors, playful illustrations) — explicitly rejected by the product
  spec.
- Generic CRUD admin-panel templates (default Bootstrap-admin look, dense
  unstyled tables with no hierarchy).
- Legacy enterprise software chrome (heavy borders, drop shadows on
  everything, gray-on-gray Windows-95-descended UI).
- Anything that reads as "hobby project" — this is paid B2B software
  institutions trust with financial and student data.

## Design Principles

1. **Clarity over decoration.** Every visual choice should help someone parse
   information faster, never simply "look nice." No ornamentation without a
   job to do.
2. **Density matches the role, not a single template.** Desktop admin roles
   (Super Admin/Principal/Incharge/Office/Teacher) get information-dense,
   efficient layouts; Parent/Student get simplified, glanceable, mobile-first
   screens. One design system, two calibrations — never force parent/student
   into admin density or vice versa.
3. **The system shows its trustworthiness through precision.** Correct
   validation messages, honest error states, consistent behavior — this
   matters more than visual polish for a product handling school records and
   money.
4. **Authorization is invisible until it matters.** Users never see options
   they can't use; when something is genuinely restricted (a locked/finalized
   record, a permission boundary), the UI explains why in plain language
   instead of a bare "Forbidden."
5. **Fast paths for repetitive work.** The people using this daily
   (attendance, marks entry, fee collection) do the same action dozens of
   times a day — optimize for keyboard flow and minimal clicks over showcase
   interactions.

## Accessibility & Inclusion

No formal WCAG conformance target at this stage (explicit product decision —
revisit once the product has real users). Baseline usability still applies:
readable contrast, logical focus order, and functional keyboard navigation are
expected as ordinary good practice, not as a compliance exercise.
