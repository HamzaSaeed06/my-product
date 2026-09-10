import { prisma } from "../../lib/prisma.js";

export interface AuditFilter {
  actorId?: string;
  resource?: string;
  recordId?: string;
  limit?: number;
  cursor?: string;
}

export async function listAuditLogs(filter: AuditFilter) {
  const limit = Math.min(filter.limit ?? 50, 200);

  return prisma.auditLog.findMany({
    where: {
      actorId: filter.actorId,
      resource: filter.resource,
      recordId: filter.recordId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(filter.cursor ? { skip: 1, cursor: { id: filter.cursor } } : {}),
  });
}
