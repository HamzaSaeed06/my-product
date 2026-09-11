import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

export async function listPlans() {
  return prisma.plan.findMany({ orderBy: { createdAt: "asc" } });
}

export async function createPlan(
  input: {
    name: string;
    tier: string;
    features: string[];
    maxStudents: number;
    maxCampuses: number;
    maxStaff: number;
    maxStorageMb: number;
  },
  actorId: string
) {
  const plan = await prisma.plan.create({ data: input });
  await writeAuditLog({ actorId, action: "CREATE", resource: "Plan", recordId: plan.id, newValue: { name: plan.name, tier: plan.tier } });
  return plan;
}

export async function setPlanActive(id: string, isActive: boolean, actorId: string) {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw new HttpError(404, "PLAN_NOT_FOUND", "Plan not found");

  const updated = await prisma.plan.update({ where: { id }, data: { isActive } });
  await writeAuditLog({ actorId, action: "UPDATE", resource: "Plan", recordId: id, newValue: { isActive } });
  return updated;
}
