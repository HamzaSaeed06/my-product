# Product

## Register

product

## Users

Principals (Super Admin / Campus Head), office/admin staff, and teachers at a school,
academy, coaching center, or training institute — see `docs/PRODUCT_SPEC.md`. They use this
tool for hours at a stretch, most of the day on desktop, in short bursts on a phone or
tablet between periods. The job to be done is almost always repetitive and record-keeping
shaped: mark today's attendance, record a fee payment, look up one student's record, approve
a leave request — the same handful of tasks, every single day, for months. Super Admin's own
primary task is different: cross-campus oversight, not data entry (see `PROGRESS.md`).

## Product Purpose

A white-label, single-tenant education-institution management platform (see
`docs/PRODUCT_SPEC.md`, `docs/ENGINEERING_PRINCIPLES.md`). `product/web-v2` is a from-scratch
frontend rebuild of `product/web` against the same fixed backend contract (`product/api`),
built beside the old frontend rather than in place of it. Success for this rebuild
specifically: every interaction pattern actually matches what the task needs (a quick status
flip is not a full-page form; a destructive action always confirms; a long list is a real
data table, not a bare `.map()`), and the visual system reads as a purpose-built records tool,
not a generic AI-generated admin panel.

## Brand Personality

**Revised 2026-09-13 on explicit user direction: follow Vercel's actual Geist design system
specifically, not a generic composite of the four named references.** Three words:
**neutral, precise, restrained** — Vercel's dashboard/settings UI is the concrete target,
not an abstraction of it: true monochrome surfaces (zero-chroma black/white/gray, no tinted
"brand" primary), Geist Sans/Mono, one saturated color reserved for the interaction focus
ring, small dot indicators instead of colored badge fills for status. The other three named
references (`docs/PRODUCT_SPEC.md` Section 9: Stripe, Linear, shadcn/ui) remain compatible
— they share the same restraint and borders-over-shadows instinct — but Vercel's system is
now the literal target being matched, not one voice among four. Emotional goal: staff should
feel the tool is fast, precise, and won't lose their place, not that it's exciting.

## Anti-references

Explicitly rejected (see `product/web-v2/DESIGN_SYSTEM.md` for the full list): the "generic
AI admin panel" family — identical soft-shadow rounded cards everywhere as the only surface
language; **any tinted/colored primary color, including this project's own first attempt at
one** (a blue-slate "ink" — corrected once the user flagged that a single retouched color
wasn't the ask); a saturated accent used as a background fill instead of a small dot
indicator; ALL-CAPS tracked-out eyebrow labels above every section; a single border-radius
applied regardless of element role; gradient washes as decoration; a plain `<Select>` used
for lists that can run into the hundreds; a Dialog reached for by default regardless of
whether the interaction is simple or complex (the single biggest thing the old `product/web`
frontend got wrong, and the reason this rebuild exists). Also explicitly not: colorful/
childish/over-designed templates (`docs/PRODUCT_SPEC.md` Section 9), and — per this skill's
own house rules — the cream/sand/beige "AI default" body background family.

## Design Principles

1. **Match the interaction to the task, not the task to a reusable pattern.** A single-field
   change is a Popover; a row's medium form is a Sheet; a destructive action is an Alert
   Dialog; a genuinely multi-step flow is a real route with a step indicator. Never default
   to the easiest-to-reach component.
2. **Information density done well beats whitespace done safely.** This is a records tool
   used for hours; a data-dense table with real hierarchy reads as competence here, not as
   clutter — the failure mode to avoid is sparse "SaaS landing page" padding, not density.
3. **Every reference to another entity shows its human label, never its raw ID.** A student
   row shows a name and an admission number a human chose, never a database cuid.
4. **Long-session legibility over first-impression wow.** Contrast, spacing, and type scale
   are tuned for someone reading this screen for the fortieth time today, not the first.
5. **Filters must answer the real operational question in one motion.** "This class, this
   section, unpaid fees" is a single compound filter action for staff, not three separate
   trial-and-error steps.
6. **A page's layout is built for what that page is answering, not reused from whichever
   other page is closest.** A list, a monitoring dashboard, and an entity-detail page ask
   different structural questions and get different shapes (full-width table + toolbar;
   tiered numbers→trend+attention→comparison; sticky identity rail beside tabbed content) —
   this was a direct correction after review flagged every page sharing the same generic
   stack-of-cards shell as "the same architecture as the old app, just recolored."

## Accessibility & Inclusion

WCAG AA at minimum (`docs/PRODUCT_SPEC.md`'s own non-negotiables plus the rebuild brief's
Section 8): visible keyboard focus on every interactive element, color contrast passing AA
for both body and placeholder text, no layout shift on data load (Skeletons reserve space),
responsive down to mobile width since teachers and parents also use this on phones.
