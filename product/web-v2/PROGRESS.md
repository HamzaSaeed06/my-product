# web-v2 Progress

## 2026-09-14 — Portals complete (Phase B, batch 8) — Phase B is now fully built

Teacher, Parent, and Student portals — the last Phase B batch. **All ~60+ pages from the
Section 6 inventory now exist on mock data.** Only Phase C (real backend wiring, module by
module) remains.

- **Confirmed one unified `/portal` route tree**, not three separate ones — the real
  backend branches every page internally on the signed-in user's role (`TEACHER`/`PARENT`/
  `STUDENT`), with a STAFF user redirected to `/dashboard` instead. Rebuilt that shape
  exactly: `src/app/portal/layout.tsx` wraps every page in `PortalProvider` (role +
  active-child state) and `PortalShell` (its own plainer, friendlier header+tab-nav shell —
  deliberately not the dashboard's sidebar, since a parent or teacher needs low information
  density, not an office admin's dense operational views).
- **Role-based, not permission-based**: confirmed the real backend gates the portal by raw
  `UserRole` membership, a completely separate auth path from the admin dashboard's granular
  permission system built everywhere else in this project. Phase B has no real
  login/session, so a **persona switcher** in the portal header (Teacher/Parent/Student, plus
  a child switcher when the Parent persona has more than one linked child) stands in for it —
  explicitly a review-time-only aid, same spirit as the design-system switcher from Phase A,
  not meant to ship.
- **Nav differs by role**, confirmed from the real frontend's own static per-role map:
  Teacher gets Overview/Timetable/Attendance/Homework/Leave (no Results — marks entry stays
  admin-only); Student gets Overview/Timetable/Attendance/Homework/Results/Report Card (no
  Fees/Leave/Complaints — those stay Parent-only); Parent gets all of the above plus
  Fees/Leave/Complaints. Leave's page itself still guards against direct navigation by a
  Student (shows a plain explanatory message) even though the nav never links there for that
  role.
- **Confirmed real interactive actions vs. read-only display, matching the old frontend's
  actual scope** — not just applying our own judgment: Teacher marks attendance and assigns
  homework; Parent requests leave for a child, files complaints, and (uniquely) **pays
  invoices online** — modeled as a small 3-step dialog (confirm → processing spinner →
  success) mirroring the real backend's own genuinely multi-step initiate→confirm online-
  payment flow, the one part of Finance actually meant to be customer-facing rather than
  admin-facing. Everything else (Timetable for all three roles, Results, Report Card,
  attendance/homework history) is plain read-only.
- **Demo identities deliberately chosen to reuse real seeded data** rather than inventing a
  parallel dataset: `src/lib/mock/portal-session.ts` fixes the demo Teacher as `tch_1`
  (teaches `sec_2`, the section every batch since Academic Operations has used because it
  actually has students) and the demo Parent (`par_4`, newly added to `parents.ts`) as
  linked to two of `sec_2`'s real roster students — one with a PUBLISHED result and a
  generated report card (good for Results/Report Card), the other with an UNPAID invoice
  (good for the Fees pay-online demo). Added `getSectionForStudent()` to `sections.ts` — the
  inverse of the existing `getSectionRoster()`, needed since a Student only carries flat
  className/section/campusId fields, not a sectionId FK. Also added a published `sec_2`
  timetable (`tt_3`) and one published `sec_2` homework row (`hw_5`) — both had been missing
  since earlier batches happened to seed `sec_2` data for other purposes only.
- **Verified all three personas' page logic**, not just the default: typecheck/lint passed
  for every role branch in the same files, and — since the persona switcher is pure client
  state with no URL parameter — the Teacher and Student branches were verified by
  temporarily flipping `portal-context.tsx`'s default role and re-curling every route before
  reverting to the real default (Parent), rather than left unverified just because a live
  browser click-through wasn't available in this environment.

## 2026-09-14 — Operations & Governance complete (Phase B, batch 7) — a genuinely new interaction shape

Leaves, Complaints, Reports (hub + 5 sub-reports), Audit Log, Roles & Permissions, License
Status — the second-to-last Phase B batch. Only Portals remain after this.

- **Leaves** (`/dashboard/leaves`) — student or teacher requests, maker-checker
  (Approve/Reject/Cancel) plus a **Forward** action unique to this module (student leaves
  only — Incharge hands the decision to the section's class teacher instead of deciding it).
  A past-dated request is flagged "(retrospective)" automatically.
- **Complaints** (`/dashboard/complaints` + `/dashboard/[complaintId]`) — confirmed NOT a
  simple maker-checker like Discounts/Waivers/Refunds; it's a genuine 5-state ticket
  workflow (Open → Assigned → In progress → Resolved → Closed) with reopen and forward
  along the way, plus an append-only notes thread. Closest existing analog to a real
  support-ticket system anywhere in this project.
- **Reports** (`/dashboard/reports` hub + `academic`/`attendance`/`financial`/`admissions`/
  `staff`) — confirmed a **fixed, pre-built report set, deliberately not a report builder**
  (an explicit real-backend code comment says so). Every figure is computed live from
  records already built in earlier batches (Results, Attendance, Invoices/Payments/Refunds,
  Admissions, Teacher Attendance + Leaves for Staff) — no separate "reports data" mock file,
  matching the real backend's own "no persistence" behavior. Each report shares the same
  shape: `StatStrip` summary → breakdown list → CSV export. **New shared pieces**:
  `src/lib/export-csv.ts` (a real client-side Blob-based CSV download, since the real
  backend also only implements CSV, nothing else) and `src/components/export-button.tsx` —
  reach for both on any future page that needs a data export.
- **Audit Log** (`/dashboard/audit-log`) — confirmed genuinely immutable by design (a real
  backend code comment: "no create/update/delete routes exist or ever should"), so this is a
  pure read-only, filterable `DataTable` with zero row actions — the only list page in the
  whole project with no actions column at all. Mock rows deliberately reference real ids
  from across almost every earlier batch (admissions, payments, leaves, exams, roles,
  substitutions) since `resource`/`recordId` are free strings covering any model in the
  real schema.
- **Roles & Permissions** (`/dashboard/roles` + `/dashboard/[roleId]/permissions`) —
  confirmed **no old-frontend page existed for this at all**, genuinely new for web-v2. The
  permission-edit page is this project's **first entirely new interaction shape**: a
  permission checklist grouped by resource (Student, Payment, Leave, ...), one role at a
  time, checkboxes toggled locally and a single "Save" that replaces the role's whole
  permission set — matching the real backend's own `PUT /:roleId/permissions` (full
  replace, never a diff/patch). Role archive is disabled in the UI both for system roles and
  for any role currently assigned to a user, mirroring the real `ROLE_IN_USE` rule.
- **License Status** (`/dashboard/license`) — confirmed **no DB model at all** on the
  product side; it's a JWT issued by the provider and verified in-memory, so this page is
  pure read-only display (plan, features, usage-vs-limit bars, expiry) with zero
  interaction. Deliberately the only nav entry with no permission gate (`anyOf` omitted) —
  the real endpoint is intentionally unauthenticated since the login screen needs it before
  any session exists.

**New mock data**: `leaves.ts`, `complaints.ts`, `audit-log.ts`, `license.ts`,
`role-permissions.ts` (the `RolePermission` join, replacing wholesale per role — 6 roles
seeded including one custom "Exam Coordinator" role with no `systemKey`, to exercise the
custom-role path). Extended `roles.ts` with `archivedAt`. All permissions CONFIRMED against
`product/api`'s routes.ts, including two cross-module namespace notes worth remembering:
`role.assign_permissions` is a distinct permission from `role.edit` (which only
renames/describes a role), and `institute.monitor` (Institute Overview) is explicitly NOT
part of "the Report Center" despite living in the same nav group here for convenience.

Hit a low-memory `tsc` OOM at 320MB heap mid-batch (system had only ~410MB free at that
moment) — not a code issue, resolved by waiting for memory to free up and retrying at
1000MB once ~1.3GB was available again, per the project's standing memory-check-before-tsc
practice.

## 2026-09-14 — Finance batch 2: Payments & Reconciliation complete (Phase B, batch 6b) — Finance module done

The money-in half of Finance: Payments, Refunds, Cash Closing, Payment Gateways,
Reconciliation. Together with batch 6a this closes out the entire Finance module (11 built
concepts — Online Payment deliberately excluded, see 6a's note).

- **Payments** (`/dashboard/payments`) — record Sheet (student search-button → their own
  unpaid/partially-paid invoices via Combobox → amount → method), with a note that any
  excess over the invoice total is **held as credit, not auto-refunded** (confirmed: real
  backend creates a `CreditTransaction`, never an automatic refund). Reversal is
  request-then-approve, same maker-checker shape as Discounts/Waivers — a "Pending reversal
  requests" panel (built with real local-state mutation, like Attendance/Assessment
  corrections before it) approves or rejects, flipping the payment to Reversed on approval.
- **Refunds** (`/dashboard/refunds`) — confirmed genuinely 4-state, not the usual 3-state
  maker-checker: Pending → Approved → **Completed** are three separate steps, since approval
  alone doesn't mean money has actually moved yet. The row actions change shape per stage
  (Approve/Reject while Pending, a single "Mark completed" once Approved).
  Always targets a Payment, never an Invoice directly — different from Waiver.
- **Cash Closing** (`/dashboard/cash-closing`) — confirmed NOT an editable list of
  transactions, exactly the "record a day's summary, then confirm" shape predicted going
  in. One closing per campus per day; the create dialog live-computes Expected
  (opening + collections − refunds) and Variance (actual − expected) as the four inputs are
  typed, so the numbers that get submitted are never a surprise.
- **Payment Gateways** (`/dashboard/payment-gateways`) — simple provider config + an
  active/inactive toggle, admin-setup style. Confirmed only `SIMULATED` is actually wired
  server-side today — Easypaisa/JazzCash are honest placeholders, called out in the page's
  own description text rather than pretending they're live.
- **Reconciliation** (`/dashboard/reconciliation`) — deliberately **not** a list of editable
  records, confirmed a pure read-only summary: a `StatStrip` (gateway vs. recorded
  count/total) plus a Matched/Mismatch `StatusDot`, and a DataTable of
  `ReconciliationException` rows below for whatever didn't auto-match. This is the first
  page in the project that reuses `StatStrip` outside the main Overview dashboard — worth
  reaching for again anywhere a page needs "here are today's figures, side by side" framing
  before a detail table.

**New mock data**: `payments.ts`, `refunds.ts`, `cash-closing.ts`, `payment-gateways.ts`,
`reconciliation.ts`. All permissions CONFIRMED against `product/api`'s routes.ts, including
the notable cross-module one: resolving/rejecting a Reconciliation Exception is gated by
`payment.reverse` — the same permission that decides a payment reversal, not a
`reconciliation.*` string of its own (no separate permission namespace exists for it).

**Finance module now fully built across both sub-batches.** Remaining Phase B work per the
Section 6 inventory: Operations & Governance (Leaves, Complaints, Reports, Audit Log, Roles
& Permissions, License Status), then Portals (Teacher/Parent/Student simplified surfaces).

## 2026-09-14 — Finance batch 1: Billing & Setup complete (Phase B, batch 6a)

Finance is the biggest remaining module (12 concepts) — split into two sub-batches on
purpose rather than one giant one, so review happens at a sane granularity. This first
sub-batch covers the **billing/setup side**: Fee Categories, Fee Structures, Student Fees,
Invoices, Discounts, Waivers. The **money-in side** (Payments, Refunds, Cash Closing,
Payment Gateways, Reconciliation) is sub-batch 6b, not started yet. Online Payment has no
old-frontend page and no admin-facing management surface of its own in the real backend
(it's a parent-portal checkout flow) — Payment Gateway config + Reconciliation already cover
everything an admin actually manages about it, so it does not get its own dashboard page.

**The dependency chain this batch is built around** (confirmed against the real schema):
`FeeCategory` (a charge type — Tuition, Transport) → `FeeStructure` (a template: category +
class + optional-campus + amount + frequency, bundled) → `StudentFee` (that template
assigned to one specific student, with an optional override amount) → `Invoice` (a billing
document whose line items reference `FeeCategory` **directly**, confirmed NOT linked back to
StudentFee/FeeStructure — invoices are still manually itemized in the real backend today,
not auto-generated). `Discount` reduces at the FeeStructure/student level, before an invoice
exists; `Waiver` reduces at the Invoice level, after one already exists — genuinely
different targets, not two names for the same idea.

- **Fee Categories** — confirmed no dedicated page or permission namespace in the real
  backend at all; managed from a small dialog opened off the Fee Structures page
  (`categories-dialog.tsx`), gated by the same `fee_structure.*` permissions.
- **Fee Structures** (`/dashboard/fee-structures`) — list + create Sheet + archive/restore.
  Campus scoping matters: `null` campusId means institute-wide (Office/Super Admin), a real
  campus id scopes it to that Campus Head's own territory — carried through as a "Select
  campus / All campuses" Combobox choice.
- **Student Fees** (`/dashboard/student-fees`) — the assignment step. Uses the established
  explicit search-button student picker (not Combobox) since Students is the large/paginated
  dataset this pattern exists for.
- **Invoices** (`/dashboard/invoices` + `/dashboard/[invoiceId]`) — create dialog has
  **dynamic add/remove line-item rows** (category + description + amount per row, live
  total), the first genuinely repeating-rows form pattern built in this project. Void is
  terminal (confirmed no un-void) and requires a reason via a dedicated dialog, not a plain
  `ConfirmDialog`, since a note is mandatory here. The detail page shows line items + any
  approved waiver reduction, explicitly labeled "Balance after waivers" rather than a true
  remaining balance — it doesn't yet subtract payments, since Payments is sub-batch 6b, and
  the page says so rather than showing a number that looks more final than it is.
- **Discounts** (`/dashboard/discounts`) — request dialog has a percentage-vs-fixed-amount
  mode toggle (confirmed mutually exclusive in the real backend, validated service-side not
  by the DB) that swaps which input is live. Maker-checker: request → Approve/Reject.
- **Waivers** (`/dashboard/waivers`) — same maker-checker shape as Discounts, but the
  request dialog picks an existing Invoice via Combobox (small, fully-loaded list — only a
  handful of invoices exist, unlike Students) rather than a search button.

**New mock data**: `fee-categories.ts`, `fee-structures.ts`, `student-fees.ts`,
`discounts.ts`, `invoices.ts`, `waivers.ts` — all roster-dependent seeds target `sec_2`
(real students), continuing the standing rule from the Academic Operations/Assessment
batches. All permissions CONFIRMED against `product/api`'s routes.ts.

## 2026-09-14 — Results: converted to list+detail, matching every other module (correction round)

User feedback right after the Assessment & Results batch: Results was the one list in that
batch that didn't follow the project's own list/detail convention — it rendered as a flat
expandable list with inline marks-entry and an inline advance button on every row, instead
of a plain `DataTable` (student, total, status) with a separate `/dashboard/results/[id]`
detail page for the actual editing — exactly the shape Assessments and Exams already use.
Rebuilt to match:

- **`results/page.tsx`** is now a standard filtered `DataTable` (Exam + Section pickers,
  same as before) — columns are Student (links to the detail page), Admission No., Total,
  Status. "Generate results" is now a page-level header action shown only when the filtered
  view is empty, not baked into a custom empty state.
- **`results/[resultId]/page.tsx`** (new, async server component + `ResultDetail` client
  component, same split as every other dynamic detail route in this project) is where
  marks are actually entered and the status pipeline is advanced — per-subject number
  inputs while DRAFT, a "Save marks" button, and the stage-appropriate advance button
  (Submit/Mark reviewed/Finalize/Publish) behind a `ConfirmDialog`, identical in spirit to
  Assessment's detail page.
- Deleted `result-row.tsx` and `marks-dialog.tsx` (the old inline-row and dialog
  components) — no longer needed now that the detail page owns marks entry directly.

Verified all 5 pipeline stages render correctly on their own detail route (Draft shows
editable inputs + Submit; Submitted/Reviewed/Finalized show read-only marks with their own
next-stage action; Published shows no action, terminal) via live curl checks against the
same 5 seeded students used in the original batch.

## 2026-09-14 — Assessment & Results batch complete (Phase B, batch 5) — the first real status pipeline

All 6 concepts built on mock data, typecheck/lint clean, every route (including 6 dynamic
detail routes) verified 200 with expected content. This batch's headline: **Results is a
genuine multi-stage pipeline** (Draft → Submitted → Reviewed → Finalized → Published, one
row per student, confirmed strictly sequential and race-safe in the real backend) — the
first module in this project where a record's status isn't just a binary draft/published
flip, and the UI (a per-row "advance to next stage" button whose label changes with the
current stage) is built around that specifically.

- **Assessments** (`/dashboard/assessments` + `/dashboard/[assessmentId]`) — an internal,
  teacher-run check (quiz/class test), confirmed as a **separate, independently-locked
  system from Exams/Results** (Result references Exam directly, never Assessment). List +
  create Sheet; the detail page is where marks actually get entered — a roster of number+
  remarks inputs while DRAFT, submitting (`assessment.submit`) locks it, after which a mark
  is only corrected via an Incharge-approved request (`assessment.correct`) — same shape as
  Attendance's correction workflow from the prior batch, rebuilt fresh here since the
  underlying record type differs.
- **Exams** (`/dashboard/exams` + `/dashboard/[examId]`) — a named series per academic year
  (Midterm, Final Term). Exam Schedules ("papers") are confirmed to be their **own module
  and permission set** in the real backend (`exam_schedule.*`, distinct from `exam.*`) even
  though this UI nests "Add paper" inside the exam detail page rather than a standalone
  list route — one-to-many with Exam, not 1:1. The add-paper dialog replicates the real
  backend's overlap rule client-side: a section can't have two papers overlapping in time on
  the same date, checked across every exam's schedules for that section, not just the
  current one.
- **Results** (`/dashboard/results`) — the pipeline described above. Filtered by Exam +
  Section; if none exist yet, a "Generate results" button bulk-seeds one empty DRAFT result
  per enrolled student for that exam+section (mirrors Attendance's bulk-mark-a-section
  pattern) with one `ResultItem` per subject that actually has a scheduled paper for that
  section in that exam — Results' subjects come from Exam Schedule, not a separate mapping.
  Marks are editable only in DRAFT (`MarksDialog`); every later stage is reached by the
  per-row advance button, gated in spirit by `result.review`/`result.finalize`/
  `result.publish` (all granted to this demo viewer). Seeded with one student at each of the
  five stages simultaneously so every stage's UI is visible on first load, not just the
  common case.
- **Report Cards** (`/dashboard/report-cards` + `/dashboard/[reportCardId]`) — confirmed as
  a **snapshot taken at generation time**, not live-computed from Results (regenerating
  overwrites the same row, no version history). Generate/Regenerate is only enabled once
  the student's Result is Finalized or Published (`RESULT_NOT_LOCKED` is a real backend
  error otherwise) — this batch's UI just disables the button rather than letting the click
  happen and fail. The detail page is a plain read-only snapshot table.
- **Promotions** (`/dashboard/promotions`) — confirmed **not a wizard** despite this batch's
  own initial assumption going in (Admissions/Convert-Inquiry's multi-step pattern doesn't
  apply here) — it's a filtered roster with a per-student decision dialog. Promote/Repeat
  execute immediately; Class Jump requires Campus Head approval first (a reason is
  required) and only takes effect once approved; Pending marks a student as awaiting a
  re-exam and never auto-executes. Confirmed: **no algorithmic promote/retain suggestion**
  in the real backend — this is deliberately a manual decision per student, not something to
  "improve" with a computed recommendation.

**New mock data**: `assessments.ts`, `exams.ts` (Exam + ExamSchedule together, since the
real backend's own 1:many relationship makes them awkward to split), `results.ts`,
`report-cards.ts`, `promotions.ts`. Every permission string in this batch was CONFIRMED
against `product/api`'s routes.ts during research, continuing the standard the previous
batch set.

**Applied the previous batch's lesson before it bit twice**: every roster-dependent mock
seed in this batch (Assessments' marks, Results, Promotions) deliberately targets `sec_2`
(5 real students by the seeded generator) rather than `sec_1` (0 students by that seed's
luck) — the exact gotcha caught live in the Academic Operations batch. No repeat of that
bug this time.

**Known Phase-B-only limitation, not a bug**: Report Cards generated live in the browser
(via the "Generate" button for a newly-eligible student) exist only in that page's local
React state — the dynamic `/dashboard/report-cards/[reportCardId]` route reads from the
static `mockReportCards` array, so a freshly-generated card's "View" link won't resolve
until Phase C wires this to a real, shared backend. The two pre-seeded report cards (for the
Finalized and Published demo students) resolve correctly and were what route verification
checked. This is the same category of limitation as every other page's local-only mock
state in this project — consistent, not a regression.

## 2026-09-14 — Academic Operations batch complete (Phase B, batch 4) — grid/matrix patterns, not DataTable

All 8 concepts built on mock data, typecheck/lint clean, all 8 routes verified 200 with the
expected content rendering. This batch's headline: several of these screens are genuinely
**not list pages** — the research pass into `product/web` and `product/api` called out
specific non-CRUD interaction shapes by name, and this batch built each one as its own
component rather than forcing everything through `DataTable`.

- **Timetable** (`/dashboard/timetable`) — a period×day grid (`TimetableGrid`), not a table:
  rows are periods 1-8, columns Mon-Sat, each cell either shows a subject+teacher chip or an
  empty "+" affordance that opens `EntryDialog`. Draft → Published is one-way
  (`timetable.publish`); publishing doesn't lock further edits. Section picker + "create
  timetable" empty state for sections that don't have one yet.
- **Attendance** (`/dashboard/attendance`) — the bulk mark-then-lock pattern from the
  research: if no records exist yet for a section+date, renders the **whole roster as one
  form** (`AttendanceRosterForm`, default Present per student, one "Submit attendance"
  button) rather than N per-row saves. Once submitted, flips to a read-only table where a
  row is corrected only via an approval-request dialog (`attendance.mark` requests,
  `attendance.correct` decides) — never edited directly. A "Pending corrections" panel with
  Approve/Reject sits below when there's anything awaiting a decision.
- **Teacher Attendance** (`/dashboard/teacher-attendance`) — deliberately simpler: no
  section concept, one row per teacher per day, and — confirmed distinct from student
  attendance in the real backend — correction here is a **direct edit** via the same inline
  Select, no approval workflow (`teacher_attendance.correct` gates it, not a request).
- **Staff Attendance** (`/dashboard/staff-attendance`) — genuinely new page, no old-frontend
  equivalent to reference. Confirmed as a distinct entity from Teacher Attendance in the real
  schema (a WHEN/HOW check-in-verification record covering every staff type via User, not a
  present/absent/leave mark) — modeled that way here, not merged. Ships a "Show QR code"
  dialog (`staff_attendance.qr_manage`, deliberately separate from `.view` since it's what
  gets displayed/printed at reception) and a "Mark manually" fallback.
- **Substitutions** (`/dashboard/substitutions`) — a plain list + "Assign substitute"
  dialog, closest to a normal CRUD screen in this batch. The class/period picker resolves
  straight from `TimetableEntry` records so the original teacher is filled in automatically.
  Cancel keeps the row (no hard delete), same convention as every other terminal-status
  action in this project.
- **Curriculum** (`/dashboard/curriculum`) — topic cards with a **row of per-section toggle
  chips** underneath each, not a table — completion is tracked per [topic, section] pair and
  toggling a chip is the whole interaction. `curriculum.create` (add a topic) is confirmed
  separate from `curriculum.edit` (toggle progress, update, archive) in the real backend.
- **Homework** (`/dashboard/homework`) — the one module that kept the familiar
  list+Sheet+Publish shape, since it genuinely is that shape (a formal per-section
  assignment with its own Draft→Published lifecycle, `homework.publish` separate from
  create/edit). Attachments use a real `<input type="file" multiple>` in the create Sheet.
- **Class Diary** (`/dashboard/class-diary`) — the other genuinely new page. Deliberately
  lighter than Homework: no attachments, no draft/publish step, just a one-line note per
  section+date. `class_diary.create` is confirmed to cover create, update, *and* archive in
  the real backend — there's no separate `.edit` permission the way every other module here
  has one, so this Sheet does double duty as both the create and edit form.

**New mock data**: `timetable.ts`, `attendance.ts`, `teacher-attendance.ts`,
`staff-attendance.ts`, `substitutions.ts`, `curriculum.ts`, `homework.ts`, `class-diary.ts`.
Added `getSectionRoster(sectionId)` to `sections.ts` — the Student model carries flat
display fields (`className`/`section`/`campusId`) rather than a `sectionId` FK, so this
bridges the two for any page that needs an actual section roster (Attendance here;
Curriculum doesn't need it since progress rows aren't derived from live roster counts).
All permission strings for this batch were CONFIRMED against `product/api`'s routes.ts
during research, not inferred — a first for a Phase B batch.

**Two new shared-component patterns**: a keyed inner-form subcomponent
(`EntryForm`/`DiaryForm`, keyed by the record's own identity) replaces a `useEffect` that
would otherwise just be syncing form state to whichever row/slot was opened — avoids the
`react-hooks/set-state-in-effect` lint error and is the pattern to reach for whenever a
dialog/sheet needs to open pre-filled for different rows (used here in both Timetable's
`EntryDialog` and Class Diary's `DiarySheet`; the older `useEffect`-based prefill pattern in
earlier batches' edit sheets still works but this is the cleaner one going forward).

**Bug caught during route verification, not by typecheck/lint**: `getSectionRoster("sec_1")`
returned zero students, so the Attendance page's default section rendered a false "No
students found" empty state that grep confirmed but code review wouldn't have caught. Root
cause: `students.ts`'s seeded generator produces campus/class/section combinations by chance
(1-in-96 per student, ~2 expected matches per section over 214 students), and `sec_1`'s
specific combination (Main Campus/Grade 3/A) happened to get zero by that seed's luck — not
a logic bug in `getSectionRoster` itself. Fixed by pointing the batch's "already submitted"
demo section at `sec_2` (5 real students) instead. **Takeaway for future batches: any new
page that filters `mockStudents` down to one specific section/class/campus combination
should verify the resulting count is non-zero before wiring a default selection to it** —
the generator's randomness means a specific combo can legitimately be empty.

## 2026-09-14 — Admissions & Enrollment batch complete (Phase B, batch 3) — first real multi-step flows

All 3 concepts built on mock data, typecheck/lint clean, all 5 routes verified 200. This
batch's headline: **the first two genuinely multi-step flows in this build**, exactly the
case the interaction-pattern rules call out by name (a dedicated route with a real step
indicator, not a form crammed into a modal) — the old frontend never built this pattern
anywhere (its own Admission create was a single 4-field dialog), so this is a genuine
upgrade, not a re-skin.

- **`StepIndicator`** (`src/components/step-indicator.tsx`) — new shared component: numbered
  circles connected by a progress line, done/active/upcoming states. Both wizards below use
  it, same way every list page shares `DataTable`.
- **Admissions** (`/dashboard/admissions` + `/dashboard/admissions/new`) — list (student,
  campus, class, academic year, status, applied date) with Approve/Reject/Withdraw
  (`ConfirmDialog`, all three terminal from `PENDING` — a rejected applicant reapplies as a
  new row, this one never flips back) only enabled while `PENDING`. "New admission" is a
  3-step flow at its own route: Applicant (search-then-results, same pattern as Parents'
  Link Child) → Placement (campus/class/year) → Review & Submit. The UI states outright,
  in both the page description and the Approve dialog, that **approving does not create an
  enrollment** — a deliberate rule the real backend enforces, not a gap.
- **Admission Inquiries** (`/dashboard/admission-inquiries` + `.../[inquiryId]/convert`) —
  genuinely new UI; the real backend has had this entity since Phase 11 but the old frontend
  never shipped a page for it at all. List + Create (Sheet, a lead-intake form) + a status
  quick-edit (`Popover`: New/Contacted/Closed — `Converted` is deliberately not a plain
  status option, it's reached only through Convert, since it carries a real
  `convertedStudentId`). **Convert is a 4-step flow**: Student (search existing / create new
  toggle) → Parent (same two-lane choice) → Placement (campus/class prefilled from the
  inquiry) → Review. This models the real backend's heaviest action here — resolve-or-create
  both Student and Parent, link them, create a Pending Admission, mark the inquiry
  Converted — as an actual UI decision (which lane: search vs. new) rather than hiding it.
- **Enrollments** (`/dashboard/enrollments`) — genuinely new page too (old frontend only had
  Enroll/Transfer dialogs bolted onto the Student detail page, no list at all). Kept as a
  Sheet, not a wizard — placing a student into one section is a 2-field job (section + roll
  number) once the student is picked, not a genuinely multi-step decision. Transfer creates
  a **new** Enrollment row and marks the old one `Transferred` rather than editing in
  place, preserving history (the real backend's own rule: only one `ACTIVE` enrollment per
  academic year, enforced at the service layer since a student legitimately accumulates
  multiple historical rows across transfers).

**New mock data**: `admissions.ts`, `admission-inquiries.ts`, `enrollments.ts`. Permissions
mostly confirmed against the real backend during research (`admission.*`,
`admission_inquiry.*`); `enrollment.view/create/transfer` are a reasonable inferred naming —
Enrollment has no dedicated old-frontend page or documented permission string to check
against, called out in `session.ts` the same way `feature_config.manage` was.

**A structural note for future multi-step pages**: both wizards keep all steps in one
route/URL with client-side step state, rather than giving each step its own URL segment
(`?step=2` or similar). This already satisfies "a dedicated route, not a modal," but
per-step bookmarking would be a reasonable further refinement if a specific flow (exam
scheduling, promotion runs — still pending) turns out to need it.

## 2026-09-14 — Parents: table + a real detail page (correction round)

Follow-up feedback on the just-shipped Parents table, three parts:

1. **"Link child" moved into the row-actions dropdown**, out of the always-visible table
   cell. This required converting it from a `Popover` to a `Dialog`
   (`link-child-dialog.tsx`, replacing `link-child-popover.tsx`) — a Popover needs a
   persistent trigger element to anchor to, which a closed dropdown menu item no longer
   provides once clicked. Same two fields (student Combobox + relationship input) either way.
2. **The Children table cell is now a count** ("2 children"), not inline chips — a parent
   with many children would otherwise blow out the row's height unpredictably. The count
   links to...
3. **...a new Parent detail page** (`/dashboard/parents/[parentId]`), same rail + main shape
   as Student Detail: identity/contact facts framed in a sticky left rail (no tabs — there's
   only one content type here, so a tab bar would be structure for its own sake), each
   linked child shown as its own card with avatar, a link through to their full Student
   Detail page, class/section/campus, and **today's known attendance percentage + fee
   status** as `StatusDot`s. Deliberately **not** a fabricated attendance trend line — a
   real day-by-day trend needs the Attendance module's own data (a later batch); showing
   only the current known percentage keeps this honest, same principle as Student Detail's
   own Attendance tab already showing an `Empty` state rather than invented history.

## 2026-09-14 — People batch complete (Phase B, batch 2)

All 5 concepts built on mock data, typecheck/lint clean, all routes verified 200:

- **Users** (`/dashboard/users`) — the most structurally involved page in this batch. A User
  is a login identity with zero fields for role/campus — access comes entirely from
  `UserRole` grants (a user can hold several, each optionally scoped to one campus).
  Create (Sheet: fullName/email/temp-password, no role picked here — matches the real
  backend, `user.create` and role-assignment are separate permissions). Role management
  lives in one dedicated `ManageRolesSheet` per user (current roles listed with a Remove
  button each, plus a grant-a-role form below it) rather than scattered per-badge popovers
  — assigning and removing are two sides of one task. Removing a role or deactivating the
  whole account both use `ConfirmDialog`, called out explicitly in the copy as killing
  active sessions immediately.
- **Parents** (`/dashboard/parents`) — deliberately **not** a `DataTable`. Each parent has a
  variable-length list of linked children, which doesn't flatten into a table row without
  duplicating the parent's info per child — a card grid keeps the nesting visible instead
  (matches the old frontend's own structural choice here, confirmed during this batch's
  research, and it's the right call independent of that). Linking a child is a `Popover`
  (Combobox + a relationship text field — two fields tied to one card); unlinking uses
  `ConfirmDialog` since it's a real relationship removal, even though "the student's own
  record is unaffected."
- **Teachers** (`/dashboard/teachers`) — profiles 1:1 with a User that already holds the
  Teacher role. The create picker is deliberately narrowed to Teacher-role users with no
  profile yet (computed from `mockAppUsers` × `mockTeachers`), so a duplicate profile for
  the same user structurally can't be created from this Sheet. Edit only touches
  employeeCode/qualification/phone — the linked user is immutable, shown read-only.
- **Subjects** (`/dashboard/subjects`) — same shape as Classes: institute-wide catalog, no
  campus scoping, Create/Edit (Sheet) + Archive (blocked-if-active-assignments messaging).
- **Teacher Assignments** (`/dashboard/teacher-assignments`) — the many-to-many linking
  point (Teacher × Subject × Section). Picking a Section in the create Sheet fixes class,
  campus, and academic year all at once — no separate class/campus/year pickers that could
  let those mismatch the section's actual values. No edit action exists (matches the real
  backend) — only create new or "End assignment" (`ConfirmDialog`, archives rather than
  deletes, preserving history).

**New mock data**: `roles.ts` (7 system roles + `requiresCampus` flag), `app-users.ts` (the
richer multi-role `AppUser` shape for the Users page — kept separate from the existing
`mock/users.ts`'s simpler single-role `StaffUser` list, which stays as the lighter-weight
picker source Institute & Structure's Incharge Scopes/Delegations Sheets already depend on;
not worth breaking those to unify the two shapes this pass), `teachers.ts`, `subjects.ts`,
`teacher-assignments.ts`, `parents.ts`.

**Sidebar**: full People group now listed (Students, Parents, Teachers, Teacher Assignments,
Subjects, Users), permission keys added to the mock viewer matching names confirmed against
the real backend/docs during this batch's research pass — no guessed permission names this
time (unlike Feature Config's `feature_config.manage` from the previous batch).

**Next**: stop here for review, then continue with **Admissions & Enrollment** (Admissions,
Admission Inquiries, Enrollments) or whichever batch the user prioritizes next.

## 2026-09-14 — Institute & Structure batch complete (Phase B, batch 1 of many)

All 9 concepts in this batch are built on mock data, typecheck/lint clean, all routes
verified 200:

- **Institute** (`/dashboard/institute`) — true singleton, two independent forms (Profile /
  Settings) directly on the page, not a Sheet — there's no "row" to tie a Sheet to. Gated by
  two separate permissions on the real backend (`institute.edit` / `institute.configure`).
- **Campuses** (`/dashboard/campuses` + `/dashboard/campuses/[campusId]`) — list with
  Create/Edit (Sheet) + Archive (Alert Dialog). The `[campusId]` hub is genuinely new
  architecture: a tabbed page combining 4 independently-permissioned resources
  (Sections/Incharge Scopes/Staff/Fee Structures) on one screen, each tab reusing the exact
  same columns as its own top-level page (`sectionColumns`, `scopeColumns`), pre-filtered by
  `campusId` — not a second table shape invented for the hub. Staff and Fee Structures show
  honest `Empty` states pointing at the People/Finance batches, since those modules don't
  exist yet. The dashboard overview's campus table and the Needs Attention panel both now
  link here for real (they were static placeholders through the design-review rounds).
- **Academic Years** (`/dashboard/academic-years`) — list + Create/Edit (Sheet, edit
  disabled once `CLOSED`) + Close (Alert Dialog, irreversible). Sessions can overlap by
  design — surfaced directly in the page copy so it doesn't read as a bug later.
- **Classes** (`/dashboard/classes`) — list + Create/Edit (Sheet) + Archive (Alert Dialog).
  Institute-wide catalog, campus-agnostic.
- **Sections** (`/dashboard/sections`) — list + compound filters (Class/Campus/Academic
  Year Combobox, defaults to the active year) + Create (Sheet with 3 required Combobox
  pickers, disabled until all three are set) + Edit (Sheet, class/campus/year shown
  read-only — immutable after creation per the real backend) + Archive.
- **Incharge Scopes** (`/dashboard/incharge-scopes`) — the most structurally complex page in
  this batch: Create (Sheet: Incharge Combobox filtered to `role === "INCHARGE"`,
  campus/year Combobox, multi-select Class checkboxes, multi-select Section checkboxes
  narrowed live by the selected classes+campus) + Edit (classes/sections only,
  user/campus/year read-only) + Revoke (Alert Dialog). The "empty sectionIds means *all*
  sections, not *no* sections" convention is called out directly in the Sheet's copy, not
  left as a silent trap.
- **Delegations** (`/dashboard/delegations`) — genuinely new UI with no old-frontend page to
  reference (built from the backend contract only, see the research notes this batch
  started from). Create (Sheet: delegate Combobox excluding Super Admin, role Combobox,
  campus Combobox, date range, reason) + Revoke (Alert Dialog).
- **Terminology** (`/dashboard/terminology`) — new page (the old frontend only had 4
  hardcoded label inputs; the real backend has since moved to a generic
  `TerminologyOverride[]` keyed by `canonicalKey`). A small fixed table, each row editable
  via a 2-field Popover (singular/plural label) — matches the quick-edit rule for anything
  this small. The canonical key itself stays visible in mono type deliberately: it's the
  actual join key back to permissions/API fields, the one case where showing a raw-looking
  identifier is operationally correct rather than a violation of the "never show a database
  ID" rule.
- **Feature Config** (`/dashboard/feature-config`) — new page, built around the one feature
  actually wired end-to-end on the real backend (`ATTENDANCE_CHECKIN_METHODS`) rather than a
  fake generic-editor-for-every-key, since each feature key's value shape genuinely differs.
  Shows the institute-level policy mode + default, and — only when `CAMPUS_CONTROLLED` — a
  per-campus override table (Sheet to edit each campus's allowed check-in methods).

**New shared components from this batch**: `ConfirmDialog`
(`src/components/confirm-dialog.tsx`) — one Alert Dialog wrapper reused for every
archive/close/revoke action in this batch instead of a near-identical file per module.
`Checkbox` (shadcn) — installed for the first time, needed for Incharge Scopes'
class/section multi-select and Feature Config's method multi-select.

**Sidebar** now lists the full Institute & Structure group (`src/components/app-sidebar.tsx`)
gated by real-shaped permission keys added to the mock viewer's permission set
(`src/lib/mock/session.ts`) — `feature_config.manage` is a guessed name (Feature Config has
no old frontend or documented permission string to check against); everything else matches
names confirmed against the real backend/docs during this batch's research pass.

**Not done in this batch, on purpose**: Assign Principal/Campus Head on the Campus
Create/Edit sheet (mentioned in `docs/PRODUCT_SPEC.md`'s screen list but not implemented in
the old frontend either — needs the Users module to exist first, which lands in the People
batch). No mock-data mutation persists across a page reload anywhere in this batch (same
convention as Phase A's Student edit/status flows) — every save/archive/revoke shows a real
toast but doesn't rewrite the underlying mock array; this is a Phase B convention throughout,
not a bug, since Phase C replaces all of it with real API calls anyway.

**Next**: stop here for review (per the brief's own process rule), then continue with the
**People** batch (Users, Parents, Teachers, Subjects, Teacher Assignments — Students is
already done from Phase A).

## Current phase: B (all pages, mock data) — Institute & Structure batch done, awaiting review

**Phase A reviewed and approved 2026-09-14.** All required Phase A deliverables exist:
sidebar/nav shell, dashboard/overview, list+table (Students), create/edit flow (Edit Student
Sheet), detail/drill-down (Student detail, rail+tabs). All required interaction patterns
demonstrated: Popover quick-edit, Sheet medium-form, Alert Dialog destructive-confirm,
Dropdown Menu row actions, Combobox filters, Data Table pattern, Empty states, Skeleton
loading. Two design systems exist side by side via the top-right switcher
(`src/lib/themes.ts`) — new Phase B pages must use semantic tokens (`bg-card`,
`text-foreground`, `rounded-[var(--card-radius)]`, etc.), never hardcoded colors, so they
render correctly under both without extra work, and under any theme added after.

Starting Phase B with the **Institute & Structure** batch (per the Section 6 inventory):
Institute settings, Campuses (+ drill-down), Academic years, Classes, Sections, Incharge
scopes, Delegations, Terminology overrides, Feature config. Building on mock data, batched,
stopping for review at the end of this batch per the brief's own process rule.

## 2026-09-13 — Second design system added: "Ventriloc"

Second pasted design system (exact tokens from a scrape of ventriloc.ca) added as a second
entry in the switcher — editorial/warm-paper register, distinctly different from
vercel-geist: Ash-gray (`#efefef`) page canvas with white cards that float via color
contrast alone (their own spec: no shadows, no borders — "surface color does the lifting"),
sharp `0px` buttons, large `20px` card corners, a fully pill-shaped (`200px`) nav radius,
Space Grotesk substituting for their PolySans (not a licensable web font) at headings, Inter
for body, and exactly one true accent color (Ember Orange `#ff682c`) — their spec explicitly
bans blue/green, so unlike vercel-geist's blue focus ring, this theme's interactive
emphasis (focus ring included) runs through Ember Orange instead. Brass (`#816729`) and one
small added muted red cover this product's "success"/"danger" dot-indicator needs, which a
marketing-site source has no equivalent concept for (documented in `globals.css` as an
honest extension, same pattern as vercel-geist's added Signal/Danger).

**Structural change needed to support this**: card radius, button radius, nav radius, and
the font stack were previously *not* theme-switchable — `--radius-sm/md/lg/xl/2xl` were
hardcoded pixel literals in `@theme inline`, and fonts were hardcoded to the Geist
variables. Introduced dedicated `--card-radius` / `--button-radius` / `--nav-radius` /
`--theme-font-sans` / `--theme-font-mono` / `--theme-font-heading` custom properties,
defined per `[data-theme]` block, and pointed `Card`, `Button`, the sidebar nav item,
`StatStrip`, and the `DataTable` container at them (`rounded-[var(--card-radius)]` etc.)
instead of the shared `rounded-lg`/`rounded-md` Tailwind scale — that shared scale stays
untouched across themes deliberately, since `rounded-lg`/`rounded-md` are also used by many
other components (Input, Popover, Select, Dropdown, Tabs, ...) where remapping them
per-theme would have caused unrelated collateral sizing changes. **Any future design
system's radius/font signature should hook into these same dedicated variables, not by
touching the shared radius scale.**

## 2026-09-13 — Design-system switcher (top-right) for comparing multiple pasted designs

The user is pasting in more than one design system to compare live before picking a
winner. Rather than rebuild the token set each time, added a switcher:

- **`src/lib/themes.ts`**: a small registry, `[{ id, label }]`. Currently one entry:
  `{ id: "vercel-geist", label: "Vercel Geist" }` — the design system built so far.
- **`src/components/theme-provider.tsx`**: wraps the app in `next-themes`' `ThemeProvider`
  (already a dependency), repurposed for `attribute="data-theme"` with the registry's ids as
  `themes` — this is a *design-system* switch, independent of this project's own light/dark
  (`.dark` class) handling.
- **`src/components/theme-switcher.tsx`**: a `Select` in the top-right of the header
  (`site-header.tsx`), next to the account menu, backed by `useTheme()`.
- **`src/app/globals.css`**: `:root` is documented as the `"vercel-geist"` theme's token
  block. Room left for more: a future pasted design gets its own
  `[data-theme="<id>"] { ... }` block placed *after* `:root` in source order (same
  specificity as `:root`, so later-in-file wins) plus one new entry in `themes.ts` — nothing
  else changes.

**When the next design system arrives**: add its tokens as a new `[data-theme="..."]` block
in `globals.css`, add `{ id, label }` to `THEMES` in `themes.ts`. The switcher UI needs no
changes. Once a final design is chosen, this whole switcher can be deleted and its winning
theme's tokens promoted to be the only `:root` block again — it's scoped to the review
period, not meant to ship.

## 2026-09-13 — Chart matched exactly to shadcn's reference; Select label bug fixed

The user pasted shadcn's actual "Area Chart - Interactive" source and asked for it applied
exactly (not re-approximated). Two real fixes came out of the diff against what was built:

- **Areas weren't stacked** (`stackId="a"` was missing) — four independent, overlapping
  semi-transparent fills read as a muddy dark blob wherever campus lines were close
  together. Stacked, per the reference, they read cleanly. Header restructured to match the
  reference exactly too: a bordered `CardHeader` row with filters pinned right via
  `sm:ml-auto`, cursor-less dot tooltip.
- **`SelectValue` was showing the raw stored value ("all", "6", "PAID") instead of the
  matching option's label**, on every `Select` in the app. Root cause: this codebase's
  shadcn style is `base-nova` (`@base-ui/react`), and base-ui's `Select.Value` does not
  auto-resolve a value to its item's rendered label the way Radix's does — it needs an
  explicit `children` render function (`<SelectValue>{(value) => label}</SelectValue>`).
  Fixed on both chart filters and the Students list's Fee status/Status selects. **Any new
  `<Select>` added in Phase B must pass this render-function children — the plain
  `<SelectValue placeholder="..." />` form silently shows raw values once something is
  selected**, and is easy to miss since it looks correct before any value is picked.

## 2026-09-13 — Chart rebuilt as gradient area chart + filters; tables left-aligned

Fifth round of same-day feedback, with a reference screenshot of shadcn's own "Area Chart -
Interactive" example (gradient fill, smooth curve, a range-select control in the header).

- **`CampusEnrollmentChart` rebuilt**: back to an `AreaChart` (not the plain `LineChart` from
  an earlier round — that was based on a misreading of "seedhi lines," corrected once the
  actual reference image showed a smooth gradient area chart), `type="natural"` for a smooth
  curve instead of jagged linear segments between only 6 points, and per-series
  `linearGradient` fills. Added two header filters (`CardAction` slot): a Campus select
  (All campuses / one specific — toggles which Area series render) and a Range select (Last
  3 / 6 months — slices the mock data). **Chart series deliberately skip `--chart-2` (the
  geist focus-blue)** — this system's own rule is that saturated blue has exactly one job
  (the focus ring), so the chart uses the other three chart tokens (obsidian/green/gray/
  amber) instead, never blue.
- **All tables reverted to left-aligned columns, including numeric ones.** A previous round
  right-aligned numeric columns for cross-table consistency; explicit correction: consistency
  should go the other way — every column, in every table, stays left-aligned. Reverted in
  both `CampusesOverviewTable` (Students/Teachers/Pending admissions/Fee collected/
  Attendance today) and the Students `DataTable` (Attendance).

## 2026-09-13 — Data-correctness and filter fixes on the Students list (still Phase A)

Fourth round of same-day feedback:

- **Needs Attention panel reverted to the single-Card list** (the prior "gallery of mini
  cards" redesign was a misread of the feedback) — the actual ask was just that its height
  didn't match the enrollment chart card beside it. Added `h-full`; grid's default
  `align-items: stretch` now equalizes both cards' height in their 2:1 row.
- **Graduated students no longer appear in the Students list by default.** They're
  operationally irrelevant to daily work (attendance, fees, homework don't apply to them)
  and were just noise mixed into the roster. Added a Status filter
  (`src/app/dashboard/students/student-filters.tsx`) — "Active & inactive" (default,
  excludes graduated), "Active only," "Inactive only," "Graduated" — so graduated students
  are one explicit choice away (an alumni report, a transcript request) instead of always
  visible.
- **Added a Campus filter** (Combobox) — the list spans 4 campuses and had no way to
  scope by one, a real gap for a Super Admin viewing across campuses.
- **Class and Section split into two separate table columns** — they were combined into
  one `"Grade 3 - B"` string column, which also blocked sorting/filtering on either
  independently.
- **Numeric-column alignment made consistent**: Attendance (Students table) is now
  right-aligned with Geist Mono figures, matching the convention `CampusesOverviewTable`
  already used — previously only one of the two tables right-aligned its numbers.

## 2026-09-13 — Exact Vercel tokens + per-page architecture (still Phase A)

Third round of feedback the same day: the color-token pivot alone still read as "the same
architecture and positioning, just one color changed." Two things landed in response:

**1. Exact tokens, not an approximation.** The user supplied Vercel's own extracted design
tokens (literal hex values, in `@theme`/`:root`/DTCG-JSON form, from a scrape of
vercel.com). `src/app/globals.css` now defines `--raw-paper-white: #fafafa`,
`--raw-obsidian: #171717`, `--raw-hairline: #ebebeb`, `--raw-stone: #666666`,
`--raw-terminal-green: #297a3a` etc. verbatim and maps them into the shadcn semantic slots.
Also adopted from the source spec exactly: role-based radius (`2px` nav items via
`rounded-sm` on `SidebarMenuButton`, `6px` cards/buttons, full pill for status), the
"hairline card" two-ring `box-shadow` technique (`.surface-ring` utility in globals.css,
applied to Card/StatStrip/DataTable container instead of a plain border), heading weight
450 instead of 600 (`PageHeader`'s `<h1>`), and the source's own "Eyebrow Label" component
(Geist Mono, uppercase, 11px, 0.071em tracking) — scoped deliberately to sidebar group
labels only via a new `.label-eyebrow` utility, not stamped above page content (that would
be exactly the generic-AI eyebrow tell this project's own docs warn against).

**2. Per-page architecture, not one shell reused everywhere.** This was the substantive
half of the feedback: every page had the same generic "stack of cards" content shape
regardless of what the page actually needed. Three pages now have three different
structures:
- **Dashboard** (`src/app/dashboard/page.tsx`): tiered layout — `StatStrip`, then a 2:1
  split of the trend chart beside a new `NeedsAttentionPanel`
  (`src/app/dashboard/needs-attention-panel.tsx`, ranks campuses by fee shortfall +
  pending admissions — "who needs me right now," separate from "how does everyone
  compare"), then the full comparison table.
- **Student detail** (`src/app/dashboard/students/[studentId]/page.tsx`): rewritten from
  header-then-stacked-tabs into a sticky 280px identity rail (avatar, status, admission/
  campus/class facts, guardian contact) beside tabbed content (Overview/Attendance/Fees).
  The old separate "Guardians" tab folded into the rail — guardian contact is an always-
  relevant fact, not tab-worthy content that should disappear when another tab is open.
- **Students list**: unchanged in shape (full-width table + toolbar was already the right
  answer for "show me the rows").

`DESIGN_SYSTEM.md` and `DESIGN.md` both rewritten again to document the exact sourced
tokens (with an honest accounting of what's literal vs. what's an added extension — Focus
Blue, Signal, Danger aren't in Vercel's marketing-page palette, which has no form/status
concepts to extract) and the "one shape per job" layout principle, so future pages get
built by asking which of the three existing shapes fits (or a genuinely new fourth one),
not by copying whichever page is closest.

## 2026-09-13 — Vercel/Geist system pivot (still Phase A)

User feedback on the first design-rigor pass: it still "tasted the same" — a color/font swap
isn't a real system, and the component layout/positioning read as a reskin of `product/web`,
not a distinct architecture. Explicit direction: follow **Vercel's actual Geist design
system**, specifically, not an invented palette. This is a genuine token-level rewrite, not
another retouch:

- **True monochrome palette**: every neutral token (background, surface, border, muted text)
  is now zero-chroma oklch — no blue-slate "ink," no warm paper tint. Primary is near-black.
- **One saturated color, one job**: `--ring` is now a vivid geist blue used only for the
  keyboard-focus ring — Vercel's own signature move against an otherwise grayscale UI.
- **Status Dot replaces colored badges**: `src/components/status-dot.tsx` — a small colored
  dot + plain text, matching Vercel's deployment-status convention. Applied to student
  status, fee status (table + filter), and campus fee-collection health. Colored badge
  pill fills are gone from the demo entirely.
- **Stat Strip lost its icons**: label + figure only, no icon column — matches how Vercel's
  own usage/summary rows are built (plain, not icon-decorated).
- **New `PageHeader` component** (`src/components/page-header.tsx`): every page now opens
  with the identical slot (title, description, right-aligned actions, hairline bottom
  border) instead of each page hand-rolling its own `<h1>`/`<p>` block — this is the
  concrete fix for "positioning/consistency isn't there across pages."
- `DESIGN_SYSTEM.md`, `PRODUCT.md`, `DESIGN.md` all rewritten to describe this system as the
  actual target (Vercel's Geist system specifically), not as one of several loose
  inspirations. Read `DESIGN.md`'s Overview section for the full named-rules version.

Sidebar's active-nav-item style needed no change — it already used a light neutral fill
(`sidebar-accent`) rather than a solid color block, which turned out to already match
Vercel's own settings-sidebar convention once the underlying tokens went monochrome.

## 2026-09-13 — Design-rigor revision pass (still Phase A)

Ran the `impeccable` skill against the Phase A demo per user feedback. Wrote
`PRODUCT.md` and `DESIGN.md` (the skill's own project-context files — read these first;
`DESIGN_SYSTEM.md` is this project's own prose reference, `DESIGN.md` is the
impeccable-tooling-readable version of the same system, keep both in sync on future
changes). Concrete changes from that pass:

- **Typography swapped Geist Sans / Geist Mono** for IBM Plex Sans/Mono, per explicit user
  request (also matches `docs/PRODUCT_SPEC.md` Section 9's named references — Stripe,
  Linear, Vercel, shadcn/ui all converge on this pairing).
- **Fixed an actual anti-pattern violation**: the original `StatTile` used a 3px colored
  `border-left` as the accent device — this is an explicit banned pattern (side-stripe
  borders). Replaced with `StatStrip` (`src/components/stat-tile.tsx`): one bordered panel
  divided by hairlines, tone carried by the number/icon color only.
- **`muted-foreground` darkened** (oklch L 0.5 → 0.46) for safer body-text contrast against
  `--background`.
- **Students list filters are now genuinely compound**: Class + Section (both Combobox) +
  Fee status (Select) + search, all AND-composed in one toolbar row, with a "Clear filters"
  action and a live "N of 214" count — answers "this class, this section, unpaid fees" in
  one pass instead of three separate trial-and-error steps.
- **Added a campus-scope picker** to the header (`src/components/campus-scope-picker.tsx`)
  — a concrete instance of the Section 7 multi-campus-scoping requirement, defaults to "All
  campuses" for the mocked Super Admin viewer.

Not done in this pass: `.impeccable/design.json` sidecar (only matters for impeccable's
live in-browser variant panel, which isn't in use this session — regenerate it if `live`
mode gets used later). No new pages were added — this pass only revised the existing 4
demo screens + shell, staying inside Phase A's scope.


Self-documenting log so a different session/agent can resume without this conversation's
context. Update this file as work continues — current phase, what's done, what's pending.

## Current phase: A (design demo) — awaiting review

Per the rebuild brief: build a small representative set of screens on mock data, lock the
visual language and interaction patterns, then stop for review before Phase B (all pages)
and Phase C (real backend wiring). **Do not proceed to Phase B until the user has reviewed
this demo and said to continue.**

## What exists right now

- **Stack scaffolded**: Next.js 16.3.4, React 19.2.8, Tailwind v4, TypeScript ^5, shadcn
  `base-nova` style (`@base-ui/react`, not Radix — every trigger-style component takes a
  `render` prop, not `asChild`; see any file under `src/components/ui`). Versions matched
  to `product/web/package.json` exactly. Runs on **port 3200** (`npm run dev`, from repo
  root or this folder — it's an npm workspace, so `node_modules` hoists to the repo root).
  Port 3100 is already used by `provider/web`'s dev server on this machine — don't reuse it.
- **`DESIGN_SYSTEM.md`**: the token system, typography, radius/elevation rules, layout
  principles. Read this before adding any new screen — it's the contract for whether a new
  page's styling is "on system" or not.
- **Sidebar/nav shell**: `src/components/app-sidebar.tsx` (shadcn `Sidebar`, permission-
  driven via a `permissions: string[]` check — same principle as `product/web`'s
  `dashboard-sidebar.tsx`, new implementation) + `src/components/site-header.tsx` +
  `src/app/dashboard/layout.tsx`. Only 3 nav items exist so far (Overview, Students,
  Campuses-placeholder) — Phase B adds the rest of the Section 6 inventory group by group.
- **Dashboard/overview screen** (`src/app/dashboard/page.tsx`): Super Admin's read-only,
  cross-campus monitoring view — stat tiles, an enrollment trend chart
  (`campus-enrollment-chart.tsx`, shadcn `Chart`/Recharts), a campus comparison table
  (`campuses-overview-table.tsx`). Deliberately not data-entry-shaped, per the brief's
  Super Admin philosophy. Campus drill-down (`/dashboard/campuses/[id]`) is **not** built
  yet — the chevron in the table is a visual affordance only; wire it in the Phase B
  Institute & Structure batch.
- **List+table screen** (`src/app/dashboard/students/`): `DataTable` (generic, reusable,
  `src/components/data-table.tsx`, built on `@tanstack/react-table` v8 — sorting, pagination,
  column visibility, Empty-state fallback) + `columns.tsx` + a search input + a `Combobox`
  class filter (`student-filters.tsx`) + `loading.tsx` skeleton shaped like the table.
  214 mock students (`src/lib/mock/students.ts`).
- **Interaction patterns demonstrated on the Students list** (this is the point of Phase A):
  - Single-field quick edit → `student-status-popover.tsx` (Popover, not a dialog).
  - Medium form tied to a row → `edit-student-sheet.tsx` (side Sheet, list stays visible).
  - Destructive/hard-to-reverse action → `deactivate-student-dialog.tsx` (Alert Dialog).
  - Row actions menu → `student-row-actions.tsx` (Dropdown Menu), never a bare button pile.
- **Detail/drill-down screen** (`src/app/dashboard/students/[studentId]/page.tsx`):
  breadcrumb, header, `Tabs` (Overview / Attendance / Fees / Guardians). Attendance and Fees
  tabs intentionally show `Empty` state with an explanation, not fake data — those modules
  don't exist yet.
- **Mock session** (`src/lib/mock/session.ts`): shaped exactly like the real
  `GET /api/v1/auth/me` response so Phase C is a data-source swap, not a restructure.
  Currently a single fixed Super Admin viewer with the full permission set — Phase B should
  add a role-switcher fixture once more pages exist, so scoped-role behavior (Incharge/
  Teacher campus pickers) can be reviewed screen-by-screen too.

## Verified

- `npx tsc --noEmit` — clean.
- `npx eslint .` — clean except one expected warning (`@tanstack/react-table`'s
  `useReactTable` can't be safely memoized by the React Compiler — known/accepted upstream,
  not a bug).
- `npm run dev` — `/dashboard`, `/dashboard/students`, `/dashboard/students/[id]` all render
  server-side with the expected content, no console/runtime errors in the dev log.
- Not yet checked in a real browser (no browser automation available this session) — the
  user should open `http://localhost:3200` and confirm the visual design before Phase B.

## Explicitly not done yet (by design, not oversight)

- No real API calls anywhere — Phase C only.
- No shared API-error-to-toast handler yet (Section 7 of the brief) — nothing to handle
  until Phase C wires real requests.
- No role switcher — only Super Admin is mocked.
- Only 2 of the ~60+ Section 6 pages exist (Students list+detail, dashboard overview) plus
  the nav shell. This is intentional for Phase A ("small set of representative screens").
- Campus drill-down page, Users page, and every other sidebar-adjacent module: not built.

## Next steps (after Phase A is approved)

1. Batch Phase B by module per the brief (don't build all 60+ at once): start with
   **Institute & Structure** (Institute settings, Campuses incl. the drill-down, Academic
   years, Classes, Sections, Incharge scopes, Delegations, Terminology overrides, Feature
   config), then **People**, then the rest of Section 6's grouping.
2. Each batch: build on mock data, using `DESIGN_SYSTEM.md` + the 4 patterns already
   proven here (Popover/Sheet/Alert Dialog/Dropdown) plus the Section 5 patterns not yet
   demonstrated (multi-step route+step-indicator for admissions/exam-scheduling/promotions).
3. Stop after each batch for review, per the brief — do not run ahead.
