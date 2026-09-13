# Phase 11+ Design: Multi-Campus Governance & Workflow Routing

**Status:** Design/discussion doc — NOT approved for implementation yet. No code written against this. This
captures a long requirements conversation with the user (2026-09-12), decoded from heavily informal
Roman Urdu, organized into phases with an explicit Problem → Solution per edge case, per the user's own
request: *"tum 1 document banao jahan har condition/weak point/edge case ka masla aur uska solution likha ho."*

Ordering confirmed by the user: **Phase A first**, then B → C → D → E, Announcements/premium polish later.
This order can still change — nothing here is locked until the user re-confirms after reading this doc.

**2026-09-12 update:** the user provided a much fuller, formal requirements document covering (1) a
complete role/permission matrix for all 7 roles and (2) a "Dynamic Institution Architecture" mandate — the
product must not be school-specific, and must support configurable terminology/roles/campus-structure for
other institution types (academies, coaching centers, training institutes). That fuller spec is now the
authoritative role/permission reference — see [`ROLE_PERMISSION_MATRIX.md`](ROLE_PERMISSION_MATRIX.md) for
the full breakdown cross-referenced against what's actually built, and
[`DYNAMIC_INSTITUTION_ARCHITECTURE.md`](DYNAMIC_INSTITUTION_ARCHITECTURE.md) for the generalization design
(a new phase, not yet started). This doc's own role/scoping design (Phase A below) still stands and is
folded into that fuller picture — "Principal" throughout this doc is the same role now called **Campus
Head** everywhere else, per the newer terminology. Standing engineering rules that apply to every phase
(edge-case checklist, never-trust-the-frontend, no-hardcoding) are captured once in
[`ENGINEERING_PRINCIPLES.md`](ENGINEERING_PRINCIPLES.md) rather than repeated per phase doc.

**2026-09-12, later the same day:** Phase A's campus-scoping turned out to touch ~20 modules across 3
different campus-derivation patterns, plus 2 real schema gaps found while planning it (`FeeStructure` is
institute-wide with no `campusId`; `Complaint` has no campus anchor when `studentId` is null). Full
module-by-module plan, sequencing, and the 4 open decisions needed before coding:
[`PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md`](PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md).

---

## Phase A — Campus Hierarchy, Delegation, Attendance Verification

### A1. Roles & campus scoping

**Current state (confirmed by reading the code, not assumed):**

| Role | Today | Problem |
|---|---|---|
| SUPER_ADMIN | Institute-wide, unrestricted | None — this is correct, stays as-is |
| CAMPUS_HEAD (formerly modeled as `CAMPUS_HEAD`) | `UNRESTRICTED_ROLES` in `scope.ts` — sees/manages the **whole institute** | Wrong. User wants one Campus Head per campus, strictly scoped |
| OFFICE | Also `UNRESTRICTED_ROLES` — sees the **whole institute** | Same problem — the user's own words: *"har campus apne teachers/users honge... teacher/receptionist/student/parents ye apne honge"* means Office/Receptionist must be campus-scoped too, not just Campus Head. **This is a gap the user didn't explicitly name but their own requirement implies it.** |
| INCHARGE | Already scoped via `InchargeScope` (campus + specific classes/sections) | Correct, no change |
| TEACHER/PARENT/STUDENT | Scoped implicitly via their own Teacher/Parent/Student record's campus/enrollment | Correct, no change |

**Proposed model:**
- `UserRole.campusId` already exists on the schema (nullable). For CAMPUS_HEAD and OFFICE, make it **required** going forward (a Campus Head/Office UserRole with no campus is a data-entry mistake, not a valid "unscoped" state).
- Remove `CAMPUS_HEAD` and `OFFICE` from `UNRESTRICTED_ROLES` in `scope.ts`. Every query/list that currently returns institute-wide data for these roles gets filtered by their `UserRole.campusId` instead — same mechanism `InchargeScope` already proves works.
- Institute-wide shared catalogs (Subject master list, Academic Year) **stay shared across campuses**, not duplicated per campus — this matches how the schema already models them (no `campusId` on `Subject`). Only campus-specific data (Class/Section/Student/Enrollment/Teacher/Staff-attendance/Finance-for-that-campus) is scoped.
- Super Admin gets a new **cross-campus monitoring dashboard** — aggregate KPIs + a per-campus breakdown, read-only. This is Super Admin's actual day-to-day home screen once campuses have real Campus Heads (it stops needing to double as an operational tool).

**Edge cases:**

| Scenario | Problem | Solution |
|---|---|---|
| A brand-new campus has no Campus Head assigned yet | Nobody can manage it day-to-day | Super Admin retains full operational control over any campus with zero active Campus Head — falls back automatically, not a special mode to toggle |
| One person legitimately oversees 2 small campuses | Model assumes one Campus Head per campus | `UserRole` already allows multiple rows per user — allow a second CAMPUS_HEAD UserRole with a different `campusId` for this case, but the Users page UI shows an explicit warning ("this grants oversight of 2 campuses") so it's a deliberate act, not an accidental double-assignment |
| Campus Head wants institute-wide comparison data (e.g. "how do I compare to the other campus") | Strictly scoped per the user's confirmed answer (*"sirf apna campus, dusre bilkul nahi"*) | Not built for Campus Head at all — only Super Admin's monitoring dashboard has cross-campus comparison. If the user changes their mind on this later, it's an explicit separate ask |
| Financial reports: does Campus Head see institute-wide revenue? | Ambiguous | Campus Head sees **only their own campus's** financial data (fees, invoices, payments for students enrolled at that campus). Super Admin sees both the aggregate and the per-campus breakdown |

---

### A2. Temporary Delegation (general capability, not a Receptionist-specific hack)

Per the user's explicit correction: *"condition based dynamically ka hai, hardcoded nahi"* — this must be a
general mechanism usable for **any** staff-absence scenario, not a special-cased rule for Receptionists.

**Proposed model — new `Delegation` entity:**
- Fields: `grantedByUserId`, `delegateToUserId`, `roleId`, `campusId`, `validFrom`, `validUntil`, `reason`, `revokedAt`.
- Only `SUPER_ADMIN` (any campus) or `CAMPUS_HEAD` (their own campus only) can create/revoke a delegation.
- A delegation grants the delegate the **same permission set as the delegated role**, scoped to that campus, only within the validity window — computed live at request time (same pattern already proven for License state — no cron job needed, just a time comparison).
- Every action taken *while* a delegation is active gets tagged in the audit log as "acting via delegation granted by X" — this is non-negotiable for accountability.
- Revocation takes effect immediately (same `revokeAllSessions`-style immediate-invalidation pattern already used for role changes).

**Edge cases:**

| Scenario | Problem | Solution |
|---|---|---|
| Delegate is given a role outside their normal job (e.g. a Teacher temporarily covering Office) | Might look like a mistake | This is the intended use — but the delegate's portal shows a persistent banner: *"You have temporary Office access until [date], granted by [Campus Head name]"* so it's never a silent, invisible privilege escalation |
| User already has their own separate role, plus a delegated one | Could double-count permissions | No issue — permissions are a set/union; having the same permission twice changes nothing |
| Campus Head themselves is unavailable (on leave) and a delegation is urgently needed | Only Campus Head can delegate for their campus | Super Admin can **always** delegate for any campus too, as a standing override — never exclusively Campus Head's power |
| A delegation is granted but never actually used | Not really a problem | No cleanup needed — it just expires naturally at `validUntil` |

---

### A3. Staff attendance with anti-spoofing verification

Covers Campus Head, Incharge, Teacher, Office/Receptionist. Explicit user concern: self-marked attendance
must not be trivially fakeable from home, but also must not require buying dedicated scanner hardware.

**Proposed model — new `StaffAttendance` entity:**
- Fields: `userId`, `date`, `checkInAt`, `checkInMethod` (`QR` | `MANUAL` | `REMOTE_APPROVED`), `ipAddress`, `geoLat`/`geoLng` (optional, only if the browser grants location), `verifiedStatus` (`VERIFIED` | `UNVERIFIED` | `MANUAL_OVERRIDE`), `markedById` (for manual entries).
- **QR self check-in, no dedicated hardware:** each campus has one regenerable QR code (printed at reception, or shown on any existing screen/tablet). Staff scan it using their **own phone's camera through the portal** — any smartphone works, nothing to buy. A successful scan proves "this device was physically at that QR code" at that moment.
- **Manual fallback, always available:** if a phone/camera isn't usable, Campus Head or Incharge marks the person present/absent directly — same shape as the existing student-attendance `mark`/`correct` permissions, just extended to staff.
- **Financial-action gate, not a network/IP lock:** before letting an OFFICE-role user record a payment or fee action, check "has this user checked in today (VERIFIED or MANUAL_OVERRIDE)?" — block with a clear message if not. This is deliberately **not** an IP/device lock (those break on wifi issues, mobile data, legitimate remote work, and give a false sense of security since IPs are trivially spoofable with a VPN) — tying it to the attendance system itself is more robust and fully enforceable in software.

**Edge cases:**

| Scenario | Problem | Solution |
|---|---|---|
| No smartphone, or camera broken | Can't scan QR | Manual fallback always exists — Campus Head/Incharge marks it, recorded as `MANUAL_OVERRIDE` (not silently treated as self-verified) |
| Staff genuinely working from home that day (sick but doing admin work) | Financial-gate would block them, but this is legitimate | New explicit status `REMOTE_APPROVED` — Campus Head grants it **per day, on the record** — this is a deliberate decision the system logs, never a silent bypass |
| Someone spoofs a QR photo (screenshots someone else's scan) | Theoretical replay risk | QR token regenerates periodically (e.g. daily), so a stale screenshot stops working automatically — no need for anything fancier at this scale |
| Check-in near midnight (11:58pm) | Which day does it count for? | Use the institute's already-configured timezone consistently — same convention the rest of the system uses, no special handling needed |
| Check-in attempt on a declared holiday/weekend | Unexpected | Flagged as an anomaly on the Campus Head's dashboard, not silently accepted or silently blocked |

---

## Phase B — Leave & Complaint Routing (Office → Incharge → Class Teacher)

**Current state (confirmed by reading the code):**
- Leave: single-step only. Only `CAMPUS_HEAD` and `OFFICE` have `leave.approve`/`leave.reject` — **`INCHARGE` and `TEACHER` currently cannot approve leave at all.** No routing/forwarding concept exists.
- Complaint: has an `assignedToId` field (manual assignment is possible), but **nothing auto-routes a new complaint** to the right Incharge based on the student's class/section — it just sits unassigned until someone manually picks it up.
- Good news already working: an approved Leave **already auto-flips the matching Attendance row from ABSENT to LEAVE** (built in Phase 6) — no work needed here.
- Good news already modeled: `Section.classTeacherId` already exists — the "Class Teacher" concept the user described is already in the schema, just unused by these workflows.

**Proposed workflow:**
1. Office/Parent/Teacher creates a Leave or Complaint for a student.
2. System auto-resolves the student's **current Enrollment → Section → Incharge** (via `InchargeScope`) and auto-assigns it there — no more sitting unassigned.
3. Incharge can either decide it directly, or **forward it to that section's Class Teacher** (`Section.classTeacherId`) — a new explicit "Forward" action, not a permission change alone.
4. Whoever finally decides (Incharge or the forwarded Class Teacher) approves/rejects — same as today, just reachable by more roles.
5. Approved Leave still auto-updates Attendance exactly as it does today — unchanged.

**Permission changes needed:** grant `leave.approve`/`leave.reject` to `INCHARGE` and to `TEACHER` (currently entirely missing for both).

**Edge cases:**

| Scenario | Problem | Solution |
|---|---|---|
| Student has no active Enrollment yet (mid-admission, not yet placed in a section) | Nothing to route by | Falls back to Office/Campus Head instead of Incharge |
| Complaint is *about* the very Incharge or Teacher it would normally route to | Conflict of interest | Complainant (or the system, if it detects this) can flag "escalate to Campus Head", bypassing the normal assignee |
| Nobody acts on a Leave/Complaint for several days | Silently stuck | Auto-escalation reminder to the next level up (Incharge → Campus Head) via the existing Notifications module — no new infrastructure needed |
| Leave request spans a period that crosses an enrollment/section change (rare) | Which section's rules apply? | Use the Enrollment that was active on the leave's **start date** |

---

## Phase C — Admission Inquiry (pre-enrollment stage)

**Current state:** creating an `Admission` record requires a full `Student` row to already exist. A parent
who inquires but never enrolls leaves a permanent, real Student row behind with no actual enrollment —
confirmed by reading the schema, this has no lighter-weight alternative today.

**Proposed model — new `AdmissionInquiry` entity** (separate from `Student`):
- Fields: `campusId`, `classId` (optional — parent might not know yet), `childName`, `parentName`,
  `parentPhone`, `parentEmail`, `source`, `status` (`NEW` | `CONTACTED` | `CONVERTED` | `CLOSED`), `notes`, `createdBy`.
- A "Convert to Admission" action creates the real `Student` + `Admission` records from the inquiry's data,
  and marks the inquiry `CONVERTED` with a link to the new `studentId`. Nothing heavier is created until
  someone deliberately converts.
- Both **Office and Incharge** get permission to create/convert inquiries — this also folds in the separate
  gap the user raised about section assignment: **Incharge currently cannot create an Enrollment (assign a
  section) at all** — only Office can today. Fix: grant `enrollment.create` to `INCHARGE` too.

**Edge cases:**

| Scenario | Problem | Solution |
|---|---|---|
| Same parent inquires twice (calls again next week, forgets) | Duplicate inquiry records | Reuse the existing student-duplicate-search pattern (already built for real Students) — search by name/phone before creating a new inquiry |
| Inquiry never followed up, goes stale | Clutter, missed opportunity | No auto-delete (never destroy real data) — instead a "stale inquiries" report/reminder surfaced to Office |
| Converting an inquiry finds a similarly-named Student already in the system | Risk of creating an accidental duplicate Student | Surface the existing-Student search results first during conversion, same as the duplicate-prevention check that already exists for direct Student creation |

---

### C-addendum. CNIC/B-Form capture, duplicate detection, and login without email

Raised separately, but belongs here — it's the same admission/enrollment moment.

**Current state (confirmed by reading the schema):** neither `Student` nor `Parent` has any national-ID
field at all. Duplicate detection today (`searchStudents()`) only matches on name/phone/studentCode — two
different children genuinely named "Ali Khan" are indistinguishable by name alone. Separately, `User.email`
is a **required, unique** field — login is strictly by email today, so a Student/Parent with no real email
needs a made-up one just to get a login, which is exactly the gap the user is pointing at.

**Proposed changes:**
- Add an optional `nationalId` field to both `Student` and `Parent` — the parent's CNIC, or the child's own
  CNIC/B-Form number if they have one (many young children in Pakistan don't get a B-Form until later, so
  this **must stay optional at the database level**, never a hard-required field that blocks enrollment).
- Duplicate detection gets a third, stronger check: an exact `nationalId` match is treated as "almost
  certainly the same person" (much stronger signal than name/phone), while a name/phone match with no
  `nationalId` on either side stays today's softer "possible match — office user decides" behavior.
- Login stops being email-only: `login()` accepts an `identifier` that can resolve to a User via **email OR
  the linked Student's `nationalId`/`studentCode` OR the linked Parent's `nationalId`** — whichever one
  actually has a value for that person. A family with no email at all can still log in with the parent's
  CNIC; a student with neither email nor CNIC yet can still log in with their own `studentCode` (which
  every student already has, unconditionally, per the existing `generateStudentCode()`).
- **Which fields get collected is a hybrid, not fully global or fully per-campus:** a small fixed **core
  set** (name, DOB, phone, address, `nationalId`) is collected everywhere, unconfigurable — this is what
  duplicate-detection and reporting depend on, and letting one campus skip it would break both. Beyond that
  core set, Super Admin can define **additional custom fields** — but at the **institute level, not
  per-campus**. Two campuses of the same institute asking different questions of the same family (a sibling
  applying to both) would be confusing and inconsistent; institute-wide keeps it coherent while still
  letting different customers (schools) ask for what's relevant to them (e.g. a madrassa's "Hifz year" vs a
  regular school not needing it).

**Edge cases:**

| Scenario | Problem | Solution |
|---|---|---|
| Neither parent nor student has a CNIC/B-Form on file | No unique ID at all for that family | Falls back to the student's own `studentCode` as the login identifier — always exists, never optional |
| Two real siblings share the same address/phone (legitimately, not a duplicate) | Could false-positive as a duplicate | `nationalId` is the deciding signal precisely because it's per-person, not per-household — two siblings never share one |
| A `nationalId` is mistyped during entry (transposed digits) | Could either miss a real duplicate or false-flag someone else's record | Not solvable perfectly by validation alone — surfaced as a "possible match, please verify" prompt either way (same UX as today's softer duplicate check), never a silent auto-merge |
| A family later gets a CNIC/B-Form they didn't have at enrollment time | Record is now incomplete vs. reality | `nationalId` stays editable after creation (like any other identity-correction field, already an audited action per existing `updateStudent`) |

---

## Phase D — Homework & Syllabus flexibility

**Current state:** `Curriculum` (syllabus) already supports per-topic tracking with per-section completion
("tick") via `CurriculumProgress` — this already matches what the user described. `INCHARGE` and `TEACHER`
can edit curriculum; **`CAMPUS_HEAD` currently can only view it, not create/edit.** `Homework` currently only
allows **one** attached document per post (`documentId` is a single nullable field, not a list), and only
`TEACHER` can create homework — `INCHARGE`/`CAMPUS_HEAD` cannot.

**Proposed changes:**
- Grant `CAMPUS_HEAD` `curriculum.create`/`curriculum.edit` (currently view-only) — Campus Head can build/adjust a syllabus too, per the user's ask.
- Replace `Homework.documentId` (single) with a proper one-to-many attachment relation, so a homework post can carry multiple files/links, not just one.
- Add a lighter, separate "daily class diary" concept distinct from formal graded/dated Homework — a quick running log ("today we covered X") a Teacher can post fast, visible to Parent/Student, without going through the heavier Homework creation flow. This matches the user's mention of a "diary."
- Whether a syllabus gets entered as one Incharge bulk-upload for the whole year, or built up day-by-day by each Teacher, stays a **choice per institute/teacher** — both paths write to the same `Curriculum`/`CurriculumProgress` tables, no separate data model needed for this flexibility.

**Edge cases:**

| Scenario | Problem | Solution |
|---|---|---|
| Incharge bulk-uploads a syllabus; a Teacher later wants to adjust one topic's date | Both can edit the same rows | Fine as-is — last-write-wins, and the existing audit log already records who changed what |
| A homework's attached link goes dead later (external site removed) | Broken link | Store and always display the link text as entered — never hard-validate reachability at save time |
| Many large attachments on one homework post | Storage growth | Already covered — every upload already goes through the license-limit `maxStorage` enforcement built earlier this session; no new work needed here |

---

## Phase E — Frontend UX overhaul (search / filter / sort everywhere)

**Current state (confirmed by checking the actual pages):** only the Students page has search, only
Promotions has filters. The other ~30+ list pages (Campuses, Teachers, Classes, Invoices, Payments, Exams,
etc.) are plain tables with nothing — matches the user's complaint exactly.

**Proposed approach:** build **one shared `<DataTable>` component** — debounced search box, per-column
filter dropdowns, sortable column headers, a loading-skeleton state, and an empty state — then roll it out
across the existing list pages incrementally (not a single giant rewrite, to keep risk low).

**Edge cases:**

| Scenario | Problem | Solution |
|---|---|---|
| A list with hundreds/thousands of rows (e.g. Students at a big campus) | Client-side filtering of a huge in-memory array gets slow | Server-side search/pagination — the same pattern the Students page's dedicated `/search` endpoint already proves works — extended to other modules rather than shipping every row to the browser |
| Small screens (phone/tablet admin use) | Wide tables overflow | Keep the existing `overflow-x-auto` wrapper pattern already used consistently across this codebase's tables |

---

## Non-functional bar (applies throughout, not a separate phase)

- `sonner` toasts are wired into `provider/web` already (this session) but **not yet into `product/web`** — needs the same `<Toaster />` mount in `product/web`'s root layout before any of the above phases lean on toast feedback.
- Client-side validation exists partially (HTML `required`, some hint text) but isn't mirrored consistently from the backend's zod schemas — worth tightening as each phase's forms get built/touched, not as a standalone sweep.
- Loading skeletons don't exist anywhere in this codebase yet — introduced for the first time as part of Phase E's `DataTable`, then reused wherever else a page has a slow initial load.

---

## Open items still needing the user's confirmation before coding starts

1. Does the Phase-A campus-scoping change for `OFFICE` (not just `CAMPUS_HEAD`) match what the user actually wants, given they only asked about Campus Head explicitly but their own description implies Office/Receptionist too?
2. Confirm the QR-based staff check-in idea (phone camera, no dedicated hardware) is acceptable, versus actually wanting to buy dedicated scanner hardware.
3. Confirm Phase ordering still stands: A → B → C → D → E → (Announcements/polish later).

---

## Appendix — one end-to-end scenario, tying every phase together

Requested directly by the user: *"1 scenario bana kar samjhao"* — a customer, from first contact with the
provider, all the way down to a single family's admission. Every numbered step below names which phase
above it belongs to, so it's traceable back to a concrete design decision, not just a story.

1. **A school ("Green Valley Grammar") contacts the provider**, wanting to buy the product.
2. The **provider's own admin**, on `provider/web`, creates: a `Customer` record for Green Valley, a `Plan`
   (say "Professional" — 1000 students, 3 campuses, 100 staff, 10GB storage), a `Deployment` (Green Valley's
   hosting URL), and a `License` (a signed JWT carrying those limits). *(Already built, this session.)*
3. Green Valley's own server gets `product/api` deployed, with the `LICENSE_JWT` and
   `DEPLOYMENT_HEARTBEAT_TOKEN` from step 2 set in its `.env`, and `npm run onboard-customer` run once —
   creating Green Valley's `Institute` and its first Super Admin login. *(Already built.)*
4. **Green Valley's Super Admin** logs in, creates two `Campus` rows: "Main Campus" and "North Campus".
5. Super Admin creates a login for each campus's Campus Head and assigns the `CAMPUS_HEAD` role **scoped to
   that one campus** *(Phase A)* — Main Campus's Campus Head from here on sees and manages only Main Campus;
   North Campus's Campus Head only sees North Campus. Super Admin's own dashboard now shows both campuses
   side-by-side as a monitoring view, not an operational one *(Phase A)*.
6. **Main Campus's Campus Head** creates logins for their own Office/Receptionist, Incharge(s), and Teachers —
   every one of them scoped to Main Campus *(Phase A's Office-scoping extension)*. North Campus's Campus Head
   does the same independently, for North Campus's own staff — the two campuses' staff lists never overlap
   or leak into each other.
7. **A parent visits Main Campus's reception**, interested in admission but undecided. The Receptionist
   creates an `AdmissionInquiry` *(Phase C)* — just the child's name and the parent's phone — no `Student`
   row yet, since nothing is committed.
8. **A week later, the parent decides to enroll.** Office converts the Inquiry into a real Admission: a
   `Student` row is created, and this time the parent's **CNIC** is captured *(Phase C-addendum)*. The
   system checks for duplicates by CNIC first (a much stronger signal than name), then falls back to the
   existing name/phone search if no CNIC match exists. The child themselves is too young for a B-Form, so
   their own `nationalId` is left blank — allowed, since it's optional at the database level.
9. **Office (or, thanks to the Phase C permission fix, the Incharge too) assigns the child to a Class and
   Section**, creating the `Enrollment`. The parent has no email — the system creates their Parent Portal
   login using their **CNIC** as the identifier instead *(Phase C-addendum's login-without-email change)*.
10. **Every morning**, Main Campus's Campus Head, Incharge, Teachers, and Office/Receptionist each scan the
    campus's QR code with their own phone to check in *(Phase A3)*. The Receptionist's fee-collection screen
    stays blocked until she's checked in for the day — a financial-action gate, not a network lock.
11. **One week, the Receptionist goes on leave.** Main Campus's Campus Head grants a **temporary Delegation**
    *(Phase A2)* to another staff member — Office-role access, time-boxed to exactly those days, logged as
    "acting via delegation" on every action taken during that window, expiring automatically afterward.
12. **A parent requests leave for their child** through the Parent Portal. The system auto-resolves the
    child's current Section and routes the request to Main Campus's Incharge for that section *(Phase B)*.
    The Incharge forwards it to the child's actual **Class Teacher** (`Section.classTeacherId`, already
    modeled), who approves it — the matching Attendance row for those dates auto-flips from ABSENT to LEAVE
    *(already built, Phase 6 — unchanged by any of this)*.
13. **Meanwhile, back at the provider**, `product/api` keeps sending its scheduled heartbeat automatically
    *(already built, this session)* — the provider's dashboard shows Green Valley's deployment as `HEALTHY`,
    with aggregated counts only (student/staff/campus counts), never a single student's name, fee record, or
    CNIC — the provider genuinely cannot see any of Green Valley's actual operational data, by design.
14. If Green Valley later tries to enroll student #1001 on a 1000-student Plan, creation is blocked with a
    clear "upgrade your plan" message *(already built, this session's license-limit enforcement)* — this
    doesn't change with any of the above; it was already correct before this document existed.
