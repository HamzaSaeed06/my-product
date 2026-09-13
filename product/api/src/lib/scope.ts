import { prisma } from "./prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import { checkInchargeScope, getInchargeScopedSectionIds } from "../modules/incharge-scopes/service.js";
import { getContextActiveDelegations } from "./requestContext.js";

// Phase 7's data-scoping layer. A permission grant (seed.ts's
// ROLE_PERMISSIONS) answers "may this role call this endpoint at all" —
// this file answers the second half of spec §5's authorization formula
// (ROLE + PERMISSION + SCOPE + CONTEXT): "which records may this specific
// actor see/touch". Only SUPER_ADMIN is unrestricted here; TEACHER/PARENT/
// STUDENT/INCHARGE/CAMPUS_HEAD/OFFICE are all narrowed below.
//
// 2026-09-12: CAMPUS_HEAD/OFFICE moved OUT of UNRESTRICTED_ROLES per
// docs/PHASE_11_MULTI_CAMPUS_AND_WORKFLOWS.md Phase A — a campus's
// Principal/Office must not see another campus's data. This is the
// foundation piece from docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md
// (campusIds on ActorProfile, the new campus-aware branches below, and
// resolveCampusScopeFilter/assertCampusInScope). Per that plan's own
// sequencing warning: this file alone does not make every module
// campus-safe — most list endpoints (students, teachers, invoices, ...)
// don't call any function in this file at all today and need their own
// filter added (the plan's Group 1-6 rollout) before they're actually
// isolated. This change makes CAMPUS_HEAD/OFFICE newly SUBJECT to scope
// checks wherever this file's functions ARE already called (student/
// section scope checks) — it does not yet add scoping to modules that
// bypass this file entirely.

const UNRESTRICTED_ROLES = new Set(["SUPER_ADMIN"]);

// Roles whose UserRole.campusId is how their own campus is determined
// (as opposed to Teacher/Parent/Student, whose scope is derived from their
// own Teacher/Parent/Student profile relations instead).
const CAMPUS_ASSIGNED_ROLES = new Set(["CAMPUS_HEAD", "OFFICE"]);

export interface ActorProfile {
  userId: string;
  roles: string[];
  // Campus ids from this actor's CAMPUS_HEAD/OFFICE UserRole assignments.
  // Empty for every other role (their scope is derived differently — see
  // teacherId/parentId/studentId below) and for SUPER_ADMIN (irrelevant,
  // already unrestricted).
  campusIds: string[];
  teacherId: string | null;
  parentId: string | null;
  studentId: string | null;
}

export async function getActorProfile(userId: string): Promise<ActorProfile> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      userRoles: { include: { role: true } },
      teacherProfile: true,
      parentProfile: true,
      studentProfile: true,
    },
  });

  // Phase 12 Gap 2 — identity checks key off Role.systemKey (a stable,
  // never-renamed identifier), not Role.name (now a freely editable display
  // label — see docs/DYNAMIC_INSTITUTION_ARCHITECTURE.md). Falls back to
  // `name` only for a custom, institute-defined role (systemKey: null by
  // design), which never matches any of these hardcoded checks anyway.
  const campusIds = [
    ...new Set(
      user.userRoles
        .filter((ur) => CAMPUS_ASSIGNED_ROLES.has(ur.role.systemKey ?? ur.role.name) && ur.campusId)
        .map((ur) => ur.campusId as string)
    ),
  ];
  const roles = user.userRoles.map((ur) => ur.role.systemKey ?? ur.role.name);

  // Phase 11 Phase A2 — a currently-active Delegation widens this actor's
  // roles/campusIds exactly as if they held an extra UserRole row for its
  // duration. Sourced from request-scoped context (set once in
  // authenticate.ts), not a fresh query here.
  for (const delegation of getContextActiveDelegations()) {
    if (!roles.includes(delegation.roleKey)) roles.push(delegation.roleKey);
    if (CAMPUS_ASSIGNED_ROLES.has(delegation.roleKey) && !campusIds.includes(delegation.campusId)) {
      campusIds.push(delegation.campusId);
    }
  }

  return {
    userId,
    roles,
    campusIds,
    teacherId: user.teacherProfile?.id ?? null,
    parentId: user.parentProfile?.id ?? null,
    studentId: user.studentProfile?.id ?? null,
  };
}

export function isUnrestricted(profile: ActorProfile): boolean {
  return profile.roles.some((r) => UNRESTRICTED_ROLES.has(r));
}

// Throws OUT_OF_SCOPE unless campusId is one of this actor's assigned
// campuses (or the actor is unrestricted) — the direct-campusId analogue
// of assertSectionInScope/assertStudentInScope below, for modules whose
// record already carries a plain campusId (Campuses, Admissions, Cash
// Closings, ...).
export function assertCampusInScope(profile: ActorProfile, campusId: string): void {
  if (isUnrestricted(profile)) return;
  if (profile.campusIds.includes(campusId)) return;
  throw new HttpError(403, "OUT_OF_SCOPE", "You do not have access to this campus");
}

// The Prisma `where` fragment for a direct-campusId model's list endpoint —
// spread this into the query's where clause. Unrestricted actors get no
// filter (`{}`); a campus-assigned actor is narrowed to their own
// campus(es); every other role currently gets `{ campusId: "__none__" }`
// (matches nothing) rather than silently returning unfiltered data — call
// resolveCampusScopeFilter only from a route a campus-assigned or
// unrestricted role can actually reach.
export function resolveCampusScopeFilter(profile: ActorProfile): { campusId?: string | { in: string[] } } {
  if (isUnrestricted(profile)) return {};
  if (profile.campusIds.length > 0) return { campusId: { in: profile.campusIds } };
  return { campusId: "__none__" };
}

export async function getOwnChildStudentIds(profile: ActorProfile): Promise<string[]> {
  if (!profile.parentId) return [];
  const links = await prisma.studentParent.findMany({
    where: { parentId: profile.parentId },
    select: { studentId: true },
  });
  return links.map((l) => l.studentId);
}

async function isTeacherAssignedToSection(teacherId: string, sectionId: string): Promise<boolean> {
  const assignment = await prisma.teacherAssignment.findFirst({
    where: { teacherId, sectionId, archivedAt: null },
  });
  return !!assignment;
}

async function hasActiveEnrollmentInSection(studentId: string, sectionId: string): Promise<boolean> {
  const enrollment = await prisma.enrollment.findFirst({ where: { studentId, sectionId, status: "ACTIVE" } });
  return !!enrollment;
}

// Verifies (not filters) that the actor may see this specific section — use
// when a request names one section explicitly (?sectionId=...). Covers
// Teacher (assigned), Incharge (scoped), Student (own current enrollment),
// and Parent (a child's current enrollment) — homework/assessments/results
// are section-scoped, not student-scoped, so Student/Parent Portal screens
// for "my/my child's homework" go through this, not
// resolveStudentScopeFilter. Throws 403 OUT_OF_SCOPE rather than silently
// returning nothing, so the caller gets a clear reason instead of a
// confusing empty result.
export async function assertSectionInScope(profile: ActorProfile, sectionId: string): Promise<void> {
  if (isUnrestricted(profile)) return;

  if (profile.roles.includes("TEACHER") && profile.teacherId) {
    if (await isTeacherAssignedToSection(profile.teacherId, sectionId)) return;
  }

  if (profile.roles.includes("STUDENT") && profile.studentId) {
    if (await hasActiveEnrollmentInSection(profile.studentId, sectionId)) return;
  }

  if (profile.roles.includes("PARENT")) {
    const childIds = await getOwnChildStudentIds(profile);
    for (const childId of childIds) {
      if (await hasActiveEnrollmentInSection(childId, sectionId)) return;
    }
  }

  if (profile.roles.includes("INCHARGE")) {
    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (
      section &&
      (await checkInchargeScope({
        userId: profile.userId,
        campusId: section.campusId,
        academicYearId: section.academicYearId,
        classId: section.classId,
        sectionId: section.id,
      }))
    ) {
      return;
    }
  }

  if (profile.campusIds.length > 0) {
    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (section && profile.campusIds.includes(section.campusId)) return;
  }

  throw new HttpError(403, "OUT_OF_SCOPE", "You do not have access to this section");
}

// Verifies the actor may see this specific student's records — Parent
// (own child), Student (self), Teacher (student enrolled in one of their
// assigned sections), Incharge (student enrolled within their scope).
export async function assertStudentInScope(profile: ActorProfile, studentId: string): Promise<void> {
  if (isUnrestricted(profile)) return;

  if (profile.roles.includes("STUDENT")) {
    if (profile.studentId === studentId) return;
  }

  if (profile.roles.includes("PARENT")) {
    const childIds = await getOwnChildStudentIds(profile);
    if (childIds.includes(studentId)) return;
  }

  const activeEnrollment = await prisma.enrollment.findFirst({
    where: { studentId, status: "ACTIVE" },
    include: { section: true },
  });

  if (activeEnrollment) {
    if (profile.roles.includes("TEACHER") && profile.teacherId) {
      if (await isTeacherAssignedToSection(profile.teacherId, activeEnrollment.sectionId)) return;
    }

    if (profile.roles.includes("INCHARGE")) {
      const allowed = await checkInchargeScope({
        userId: profile.userId,
        campusId: activeEnrollment.section.campusId,
        academicYearId: activeEnrollment.academicYearId,
        classId: activeEnrollment.classId,
        sectionId: activeEnrollment.sectionId,
      });
      if (allowed) return;
    }

    if (profile.campusIds.includes(activeEnrollment.section.campusId)) return;
  } else if (profile.campusIds.length > 0) {
    // No active enrollment (withdrawn/transferred/mid-admission) — Office/
    // Principal still legitimately need to see their own campus's
    // historical students (spec: view archived records), so fall back to
    // the most recent enrollment of ANY status rather than only ACTIVE.
    // Teacher/Incharge deliberately don't get this fallback — their scope
    // is genuinely "currently teaching/overseeing," not historical.
    const lastEnrollment = await prisma.enrollment.findFirst({
      where: { studentId },
      include: { section: true },
      orderBy: { createdAt: "desc" },
    });
    if (lastEnrollment && profile.campusIds.includes(lastEnrollment.section.campusId)) return;
  }

  throw new HttpError(403, "OUT_OF_SCOPE", "You do not have access to this student");
}

// Convenience wrapper for section-scoped list endpoints (homework,
// assessments, timetable): a restricted-role actor MUST name a section
// (there's no well-defined "everything across my scope" query), while an
// unrestricted role may omit it to see everything, same as before Phase 7.
//
// CAMPUS_HEAD/OFFICE are the one exception (added 2026-09-12 alongside
// campus scoping): "everything across my campus" IS well-defined for
// them, unlike Teacher/Incharge — so they may omit sectionId too. Use
// resolveSectionScopeFilter (below), not this function, for any endpoint
// that needs to actually support that case rather than just permit it.
export async function assertSectionQueryInScope(profile: ActorProfile, sectionId?: string): Promise<void> {
  if (isUnrestricted(profile)) return;
  if (!sectionId) {
    if (profile.campusIds.length > 0) return;
    throw new HttpError(400, "SECTION_REQUIRED", "sectionId is required for your role");
  }
  await assertSectionInScope(profile, sectionId);
}

// The list-endpoint counterpart to assertSectionQueryInScope — actually
// produces a Prisma `where` fragment instead of just permitting the
// request, so a CAMPUS_HEAD/OFFICE actor who omits sectionId gets "every
// section in my campus(es)" rather than assertSectionQueryInScope's bare
// permission check silently falling through to an unfiltered query.
// Spread the result into the model's `where` alongside its other filters
// (the model must have a `section` relation for the campus-wide branch).
export type SectionScopeFilter =
  | { sectionId?: string }
  | { sectionId: { in: string[] } }
  | { section: { campusId: { in: string[] } } };

export async function resolveSectionScopeFilter(
  profile: ActorProfile,
  requestedSectionId?: string
): Promise<SectionScopeFilter> {
  if (isUnrestricted(profile)) return { sectionId: requestedSectionId };

  if (requestedSectionId) {
    await assertSectionInScope(profile, requestedSectionId);
    return { sectionId: requestedSectionId };
  }

  if (profile.campusIds.length > 0) {
    return { section: { campusId: { in: profile.campusIds } } };
  }

  // INCHARGE has no campusIds — "everything across my scope" IS well-defined
  // for them (unlike a bare Teacher): the union of the sections their active
  // InchargeScope covers. Previously this fell through to SECTION_REQUIRED,
  // which 500'd the Homework/Assessments pages for an Incharge who (rightly)
  // holds homework.view/assessment.view but has no single section to name.
  // An empty scope → `sectionId IN []` → nothing, never everything.
  if (profile.roles.includes("INCHARGE")) {
    return { sectionId: { in: await getInchargeScopedSectionIds(profile.userId) } };
  }

  throw new HttpError(400, "SECTION_REQUIRED", "sectionId is required for your role");
}

// For list endpoints filtered by an optional studentId query param
// (invoices, payments, leaves, complaints, report cards, attendance): when
// the caller named a specific student, verify it's in scope. When they
// didn't and the actor is a restricted role, resolve the implicit set of
// students they're allowed to see — a single id for Student, a set of
// child ids for Parent (never "everyone", the way an unfiltered query
// would otherwise return for an unrestricted role).
//
// 2026-09-12: added the `studentCampusIn` shape for CAMPUS_HEAD/OFFICE with
// no requestedStudentId — "every student across my campus(es)" IS
// well-defined for them (unlike TEACHER/INCHARGE below), so this is no
// longer left unfiltered as it was when campus-scoping first landed. Every
// consumer of this filter's third shape must apply it as
// `student: { enrollments: { some: { status: "ACTIVE", section: { campusId: { in } } } } }`
// — see docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md Group 4/5.
export type StudentScopeFilter =
  | { studentId?: string }
  | { studentIdIn: string[] }
  | { studentCampusIn: string[] };

export async function resolveStudentScopeFilter(
  profile: ActorProfile,
  requestedStudentId?: string
): Promise<StudentScopeFilter> {
  if (isUnrestricted(profile)) return { studentId: requestedStudentId };

  if (requestedStudentId) {
    await assertStudentInScope(profile, requestedStudentId);
    return { studentId: requestedStudentId };
  }

  if (profile.roles.includes("STUDENT")) {
    // No linked Student profile yet (a STUDENT-role user before Office
    // links them) — scope to nothing rather than everything.
    return { studentIdIn: profile.studentId ? [profile.studentId] : [] };
  }

  if (profile.roles.includes("PARENT")) {
    return { studentIdIn: await getOwnChildStudentIds(profile) };
  }

  if (profile.campusIds.length > 0) {
    return { studentCampusIn: profile.campusIds };
  }

  // TEACHER/INCHARGE with no studentId named: this helper doesn't widen to
  // "every student in my scope" (that set isn't well-defined without also
  // knowing which section) — callers for those roles should instead scope
  // by section via assertSectionInScope, or the caller passed a
  // studentId and hit the branch above.
  return { studentId: requestedStudentId };
}

// Turns any StudentScopeFilter shape into a real Prisma `where` fragment,
// for a model with a direct `studentId` column (StudentFee, Invoice,
// Payment, Leave, Complaint) — spread the result into the query's `where`
// instead of the raw filter object, which was never valid Prisma syntax
// for the `studentIdIn`/`studentCampusIn` shapes on its own (every
// existing caller was hand-translating this per module; this replaces
// that with one shared implementation).
export function studentScopeWhereDirect(filter: StudentScopeFilter): Record<string, unknown> {
  if ("studentCampusIn" in filter) {
    return { student: { enrollments: { some: { status: "ACTIVE", section: { campusId: { in: filter.studentCampusIn } } } } } };
  }
  if ("studentIdIn" in filter) {
    return { studentId: { in: filter.studentIdIn } };
  }
  return { studentId: filter.studentId };
}

// Same, for a model reached one relation away from Student (Refund/
// Discount/Waiver, which carry invoiceId, not studentId — their Student is
// invoice.student). `relation` is that intermediate relation's name.
export function studentScopeWhereVia(filter: StudentScopeFilter, relation: string): Record<string, unknown> {
  if ("studentCampusIn" in filter) {
    return { [relation]: { student: { enrollments: { some: { status: "ACTIVE", section: { campusId: { in: filter.studentCampusIn } } } } } } };
  }
  if ("studentIdIn" in filter) {
    return { [relation]: { studentId: { in: filter.studentIdIn } } };
  }
  return filter.studentId ? { [relation]: { studentId: filter.studentId } } : {};
}
