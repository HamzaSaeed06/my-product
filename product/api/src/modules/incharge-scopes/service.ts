import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

function include() {
  return {
    classes: { include: { class: true } },
    sections: { include: { section: true } },
  } as const;
}

export async function listInchargeScopes(filter: { userId?: string; campusId?: string }) {
  return prisma.inchargeScope.findMany({
    where: { userId: filter.userId, campusId: filter.campusId, revokedAt: null },
    include: include(),
    orderBy: { createdAt: "desc" },
  });
}

// Overlap is allowed by design (spec: multiple Incharges can share a class
// for workload sharing) — this does NOT check for or reject overlap with an
// existing scope.
export async function createInchargeScope(
  input: {
    userId: string;
    campusId: string;
    academicYearId: string;
    classIds: string[];
    sectionIds?: string[];
    effectiveFrom?: Date;
    effectiveTo?: Date;
  },
  actorId: string
) {
  const [user, campus, academicYear] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.userId }, include: { userRoles: { include: { role: true } } } }),
    prisma.campus.findUnique({ where: { id: input.campusId } }),
    prisma.academicYear.findUnique({ where: { id: input.academicYearId } }),
  ]);

  if (!user || !user.isActive) throw new HttpError(400, "USER_NOT_FOUND", "User not found or inactive");
  if (!user.userRoles.some((ur) => ur.role.name === "INCHARGE")) {
    throw new HttpError(400, "USER_NOT_INCHARGE", "User does not have the INCHARGE role");
  }
  if (!campus || campus.archivedAt) throw new HttpError(400, "CAMPUS_NOT_FOUND", "Campus not found or archived");
  if (!academicYear) throw new HttpError(400, "ACADEMIC_YEAR_NOT_FOUND", "Academic year not found");

  const classIds = [...new Set(input.classIds)];
  if (classIds.length === 0) {
    throw new HttpError(400, "NO_CLASSES", "At least one classId is required");
  }
  const classes = await prisma.class.findMany({ where: { id: { in: classIds } } });
  if (classes.length !== classIds.length) {
    throw new HttpError(400, "CLASS_NOT_FOUND", "One or more classIds do not exist");
  }

  const sectionIds = [...new Set(input.sectionIds ?? [])];
  if (sectionIds.length > 0) {
    const sections = await prisma.section.findMany({ where: { id: { in: sectionIds } } });
    if (sections.length !== sectionIds.length) {
      throw new HttpError(400, "SECTION_NOT_FOUND", "One or more sectionIds do not exist");
    }
    // A section only makes sense as a narrowing of a class/campus/year this
    // scope actually covers — without this check, a scope could reference a
    // section from an unrelated campus or a class not in classIds.
    const mismatched = sections.find(
      (s) => s.campusId !== input.campusId || s.academicYearId !== input.academicYearId || !classIds.includes(s.classId)
    );
    if (mismatched) {
      throw new HttpError(
        400,
        "SECTION_SCOPE_MISMATCH",
        "sectionIds must belong to the scope's campus, academic year, and one of the assigned classIds"
      );
    }
  }

  const scope = await prisma.$transaction(async (tx) => {
    const created = await tx.inchargeScope.create({
      data: {
        userId: input.userId,
        campusId: input.campusId,
        academicYearId: input.academicYearId,
        effectiveFrom: input.effectiveFrom ?? new Date(),
        effectiveTo: input.effectiveTo,
        createdBy: actorId,
      },
    });

    await tx.inchargeScopeClass.createMany({
      data: classIds.map((classId) => ({ inchargeScopeId: created.id, classId })),
    });
    if (sectionIds.length > 0) {
      await tx.inchargeScopeSection.createMany({
        data: sectionIds.map((sectionId) => ({ inchargeScopeId: created.id, sectionId })),
      });
    }

    return tx.inchargeScope.findUniqueOrThrow({ where: { id: created.id }, include: include() });
  });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "InchargeScope",
    recordId: scope.id,
    newValue: { userId: input.userId, campusId: input.campusId, classIds, sectionIds },
  });

  return scope;
}

// Optimistic concurrency, per spec: reject on version mismatch, never
// silently last-write-wins. Caller must pass the version they last read;
// a mismatch means someone else changed this scope in the meantime.
export async function updateInchargeScope(
  id: string,
  input: { classIds?: string[]; sectionIds?: string[]; effectiveTo?: Date | null; expectedVersion: number },
  actorId: string
) {
  const scope = await prisma.inchargeScope.findUnique({ where: { id }, include: include() });
  if (!scope) throw new HttpError(404, "INCHARGE_SCOPE_NOT_FOUND", "Incharge scope not found");
  if (scope.revokedAt) throw new HttpError(409, "INCHARGE_SCOPE_REVOKED", "Cannot edit a revoked scope");

  const oldClassIds = scope.classes.map((c) => c.classId).sort();
  const oldSectionIds = scope.sections.map((s) => s.sectionId).sort();

  const nextClassIds = input.classIds ? [...new Set(input.classIds)] : oldClassIds;
  const nextSectionIds = input.sectionIds ? [...new Set(input.sectionIds)] : oldSectionIds;

  if (input.classIds) {
    const classes = await prisma.class.findMany({ where: { id: { in: nextClassIds } } });
    if (classes.length !== nextClassIds.length) {
      throw new HttpError(400, "CLASS_NOT_FOUND", "One or more classIds do not exist");
    }
  }
  if (input.sectionIds && nextSectionIds.length > 0) {
    const sections = await prisma.section.findMany({ where: { id: { in: nextSectionIds } } });
    if (sections.length !== nextSectionIds.length) {
      throw new HttpError(400, "SECTION_NOT_FOUND", "One or more sectionIds do not exist");
    }
    const mismatched = sections.find(
      (s) =>
        s.campusId !== scope.campusId ||
        s.academicYearId !== scope.academicYearId ||
        !nextClassIds.includes(s.classId)
    );
    if (mismatched) {
      throw new HttpError(
        400,
        "SECTION_SCOPE_MISMATCH",
        "sectionIds must belong to the scope's campus, academic year, and one of the assigned classIds"
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.inchargeScope.updateMany({
      where: { id, version: input.expectedVersion },
      data: {
        version: { increment: 1 },
        effectiveTo: input.effectiveTo === undefined ? undefined : input.effectiveTo,
      },
    });

    if (count === 0) {
      // Someone else modified this scope since the caller last read it.
      throw new HttpError(409, "VERSION_CONFLICT", "This scope was modified by someone else — refresh and retry");
    }

    if (input.classIds) {
      await tx.inchargeScopeClass.deleteMany({ where: { inchargeScopeId: id } });
      await tx.inchargeScopeClass.createMany({
        data: [...new Set(input.classIds)].map((classId) => ({ inchargeScopeId: id, classId })),
      });
    }
    if (input.sectionIds) {
      await tx.inchargeScopeSection.deleteMany({ where: { inchargeScopeId: id } });
      await tx.inchargeScopeSection.createMany({
        data: [...new Set(input.sectionIds)].map((sectionId) => ({ inchargeScopeId: id, sectionId })),
      });
    }

    return tx.inchargeScope.findUniqueOrThrow({ where: { id }, include: include() });
  });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "InchargeScope",
    recordId: id,
    oldValue: { classIds: oldClassIds, sectionIds: oldSectionIds },
    newValue: {
      classIds: updated.classes.map((c) => c.classId).sort(),
      sectionIds: updated.sections.map((s) => s.sectionId).sort(),
    },
  });

  return updated;
}

export async function revokeInchargeScope(id: string, actorId: string) {
  const scope = await prisma.inchargeScope.findUnique({ where: { id } });
  if (!scope) throw new HttpError(404, "INCHARGE_SCOPE_NOT_FOUND", "Incharge scope not found");
  if (scope.revokedAt) throw new HttpError(409, "INCHARGE_SCOPE_ALREADY_REVOKED", "Scope is already revoked");

  const updated = await prisma.inchargeScope.update({ where: { id }, data: { revokedAt: new Date() } });

  await writeAuditLog({
    actorId,
    action: "REVOKE",
    resource: "InchargeScope",
    recordId: id,
    newValue: { revokedAt: updated.revokedAt },
  });

  return updated;
}

// The core scope-check other phases' authorize() calls will layer on top of
// permission checks once resources exist (Timetable, Attendance, ...). Not
// yet wired into any route — Phase 1 has nothing for an Incharge to act on
// besides the scope assignment itself — but implemented and tested now per
// spec's explicit acceptance criteria ("scope check within/outside assigned
// classes").
export async function checkInchargeScope(params: {
  userId: string;
  campusId: string;
  academicYearId: string;
  classId?: string;
  sectionId?: string;
}): Promise<boolean> {
  const now = new Date();
  const scopes = await prisma.inchargeScope.findMany({
    where: {
      userId: params.userId,
      campusId: params.campusId,
      academicYearId: params.academicYearId,
      revokedAt: null,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    include: include(),
  });

  if (scopes.length === 0) return false;
  if (!params.classId && !params.sectionId) return true;

  return scopes.some((scope) => {
    const classMatch = params.classId ? scope.classes.some((c) => c.classId === params.classId) : true;
    // Per spec, section assignment is an OPTIONAL narrowing of a class
    // assignment: a scope with classIds but zero explicit sectionIds covers
    // every section of those classes, not none. Only when the scope lists
    // specific sections does it narrow to just those. (Assumes the caller
    // passes a coherent classId/sectionId pair — this doesn't independently
    // verify sectionId belongs to classId.)
    const sectionMatch =
      params.sectionId && scope.sections.length > 0
        ? scope.sections.some((s) => s.sectionId === params.sectionId)
        : true;
    return classMatch && sectionMatch;
  });
}
