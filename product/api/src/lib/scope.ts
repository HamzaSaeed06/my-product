import { prisma } from "./prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import { checkInchargeScope } from "../modules/incharge-scopes/service.js";

// Phase 7's data-scoping layer. A permission grant (seed.ts's
// ROLE_PERMISSIONS) answers "may this role call this endpoint at all" —
// this file answers the second half of spec §5's authorization formula
// (ROLE + PERMISSION + SCOPE + CONTEXT): "which records may this specific
// actor see/touch". SUPER_ADMIN/PRINCIPAL/OFFICE are treated as
// unrestricted here (their permission grant is already the real gate);
// TEACHER/PARENT/STUDENT/INCHARGE are the roles whose visibility is
// actually narrowed below.

const UNRESTRICTED_ROLES = new Set(["SUPER_ADMIN", "PRINCIPAL", "OFFICE"]);

export interface ActorProfile {
  userId: string;
  roles: string[];
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

  return {
    userId,
    roles: user.userRoles.map((ur) => ur.role.name),
    teacherId: user.teacherProfile?.id ?? null,
    parentId: user.parentProfile?.id ?? null,
    studentId: user.studentProfile?.id ?? null,
  };
}

function isUnrestricted(profile: ActorProfile): boolean {
  return profile.roles.some((r) => UNRESTRICTED_ROLES.has(r));
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
  }

  throw new HttpError(403, "OUT_OF_SCOPE", "You do not have access to this student");
}

// Convenience wrapper for section-scoped list endpoints (homework,
// assessments, timetable): a restricted-role actor MUST name a section
// (there's no well-defined "everything across my scope" query), while an
// unrestricted role may omit it to see everything, same as before Phase 7.
export async function assertSectionQueryInScope(profile: ActorProfile, sectionId?: string): Promise<void> {
  if (isUnrestricted(profile)) return;
  if (!sectionId) throw new HttpError(400, "SECTION_REQUIRED", "sectionId is required for your role");
  await assertSectionInScope(profile, sectionId);
}

// For list endpoints filtered by an optional studentId query param
// (invoices, payments, leaves, complaints, report cards, attendance): when
// the caller named a specific student, verify it's in scope. When they
// didn't and the actor is a restricted role, resolve the implicit set of
// students they're allowed to see — a single id for Student, a set of
// child ids for Parent (never "everyone", the way an unfiltered query
// would otherwise return for an unrestricted role).
export type StudentScopeFilter = { studentId?: string } | { studentIdIn: string[] };

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

  // TEACHER/INCHARGE with no studentId named: this helper doesn't widen to
  // "every student in my scope" (that set isn't well-defined without also
  // knowing which section) — callers for those roles should instead scope
  // by section via assertSectionInScope, or the caller passed a
  // studentId and hit the branch above.
  return { studentId: requestedStudentId };
}
