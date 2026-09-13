import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

function include() {
  return {
    grantedBy: true,
    delegateTo: true,
    revokedBy: true,
    role: true,
    campus: true,
  } as const;
}

export async function createDelegation(
  input: { delegateToUserId: string; roleId: string; campusId: string; validFrom: Date; validUntil: Date; reason: string },
  actorId: string
) {
  if (input.validUntil <= input.validFrom) {
    throw new HttpError(400, "INVALID_DATE_RANGE", "validUntil must be after validFrom");
  }
  if (input.validUntil <= new Date()) {
    throw new HttpError(400, "INVALID_DATE_RANGE", "validUntil must be in the future");
  }
  if (input.delegateToUserId === actorId) {
    throw new HttpError(400, "CANNOT_DELEGATE_TO_SELF", "You cannot delegate a role to yourself");
  }

  const [delegateTo, role, campus] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.delegateToUserId } }),
    prisma.role.findUnique({ where: { id: input.roleId } }),
    prisma.campus.findUnique({ where: { id: input.campusId } }),
  ]);
  if (!delegateTo || !delegateTo.isActive) throw new HttpError(400, "USER_NOT_FOUND", "delegateToUserId not found or inactive");
  if (!role || role.archivedAt) throw new HttpError(400, "ROLE_NOT_FOUND", "Role not found or archived");
  // Delegation is a time-boxed grant of ONE campus-scoped role's
  // permissions — SUPER_ADMIN is institute-wide and unscoped by design, so
  // granting it this way would both be meaningless (no campusId concept
  // applies to it) and a privilege-escalation vector for whoever can create
  // delegations for their own campus.
  if ((role.systemKey ?? role.name) === "SUPER_ADMIN") throw new HttpError(400, "CANNOT_DELEGATE_SUPER_ADMIN", "The SUPER_ADMIN role cannot be delegated");
  if (!campus || campus.archivedAt) throw new HttpError(400, "CAMPUS_NOT_FOUND", "Campus not found or archived");

  const delegation = await prisma.delegation.create({
    data: { ...input, grantedByUserId: actorId },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Delegation", recordId: delegation.id, newValue: input });

  return delegation;
}

export async function listDelegations(filter: { campusId?: string; campusIdIn?: string[]; delegateToUserId?: string; activeOnly?: boolean }) {
  const now = new Date();
  return prisma.delegation.findMany({
    where: {
      campusId: filter.campusId ?? (filter.campusIdIn ? { in: filter.campusIdIn } : undefined),
      delegateToUserId: filter.delegateToUserId,
      ...(filter.activeOnly ? { revokedAt: null, validFrom: { lte: now }, validUntil: { gte: now } } : {}),
    },
    include: include(),
    orderBy: { createdAt: "desc" },
  });
}

export async function getDelegationCampusId(id: string): Promise<string> {
  const delegation = await prisma.delegation.findUnique({ where: { id }, select: { campusId: true } });
  if (!delegation) throw new HttpError(404, "DELEGATION_NOT_FOUND", "Delegation not found");
  return delegation.campusId;
}

export async function revokeDelegation(id: string, actorId: string) {
  const existing = await prisma.delegation.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "DELEGATION_NOT_FOUND", "Delegation not found");
  if (existing.revokedAt) throw new HttpError(409, "ALREADY_REVOKED", "Delegation already revoked");

  const updated = await prisma.delegation.update({
    where: { id },
    data: { revokedAt: new Date(), revokedById: actorId },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "REVOKE", resource: "Delegation", recordId: id, newValue: { revokedAt: updated.revokedAt } });

  return updated;
}
