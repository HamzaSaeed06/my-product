import { prisma } from "./prisma.js";

export interface ActiveDelegation {
  id: string;
  roleId: string;
  // Role.systemKey when the delegated role is one of the 7 system roles
  // (the stable identifier scope.ts's checks key off), falling back to
  // Role.name only for a custom, institute-defined role.
  roleKey: string;
  campusId: string;
}

// Live-computed, same pattern already proven for License state — no cron
// job marks a Delegation "expired"; every read just compares against `now`.
export async function getActiveDelegationsForUser(userId: string): Promise<ActiveDelegation[]> {
  const now = new Date();
  const rows = await prisma.delegation.findMany({
    where: { delegateToUserId: userId, revokedAt: null, validFrom: { lte: now }, validUntil: { gte: now } },
    include: { role: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((d) => ({ id: d.id, roleId: d.roleId, roleKey: d.role.systemKey ?? d.role.name, campusId: d.campusId }));
}
