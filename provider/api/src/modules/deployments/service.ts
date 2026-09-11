import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

function publicInclude() {
  // heartbeatToken is write-once from the API's perspective, exactly like
  // PaymentGateway.webhookSecret in product/api's Phase 9 — a customer
  // deployment authenticates its heartbeat with this token, so it's never
  // re-exposed over a read after creation.
  return {
    id: true,
    customerId: true,
    version: true,
    url: true,
    status: true,
    healthStatus: true,
    lastCheckInAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}

export async function listDeployments(filter: { customerId?: string }) {
  return prisma.deployment.findMany({ where: { customerId: filter.customerId }, select: publicInclude(), orderBy: { createdAt: "desc" } });
}

export async function getDeployment(id: string) {
  const deployment = await prisma.deployment.findUnique({
    where: { id },
    select: { ...publicInclude(), healthChecks: { orderBy: { receivedAt: "desc" as const }, take: 20 } },
  });
  if (!deployment) throw new HttpError(404, "DEPLOYMENT_NOT_FOUND", "Deployment not found");
  return deployment;
}

export async function createDeployment(input: { customerId: string; version: string; url: string }, actorId: string) {
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) throw new HttpError(400, "CUSTOMER_NOT_FOUND", "Customer not found");

  const heartbeatToken = crypto.randomBytes(32).toString("hex");
  const deployment = await prisma.deployment.create({
    data: { customerId: input.customerId, version: input.version, url: input.url, heartbeatToken },
  });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Deployment", recordId: deployment.id, newValue: { customerId: input.customerId, url: input.url } });

  // The one and only time heartbeatToken is returned — the caller (an
  // admin setting up this customer's deployment) must record it now and
  // place it in that customer's product/api environment.
  return { id: deployment.id, customerId: deployment.customerId, version: deployment.version, url: deployment.url, status: deployment.status, heartbeatToken };
}

export async function setDeploymentStatus(id: string, status: "PROVISIONING" | "ACTIVE" | "SUSPENDED" | "DECOMMISSIONED", actorId: string) {
  const deployment = await prisma.deployment.findUnique({ where: { id } });
  if (!deployment) throw new HttpError(404, "DEPLOYMENT_NOT_FOUND", "Deployment not found");

  const updated = await prisma.deployment.update({ where: { id }, data: { status }, select: publicInclude() });
  await writeAuditLog({ actorId, action: "UPDATE", resource: "Deployment", recordId: id, newValue: { status } });
  return updated;
}
