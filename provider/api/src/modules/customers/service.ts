import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { generateCustomerCode } from "../../lib/providerCodes.js";

function include() {
  return {
    deployments: { orderBy: { createdAt: "desc" as const } },
    licenses: { orderBy: { createdAt: "desc" as const }, include: { plan: true, deployment: true } },
    tickets: { orderBy: { createdAt: "desc" as const } },
  };
}

export async function listCustomers(filter: { status?: string }) {
  return prisma.customer.findMany({
    where: { status: filter.status as never },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id }, include: include() });
  if (!customer) throw new HttpError(404, "CUSTOMER_NOT_FOUND", "Customer not found");
  return customer;
}

export async function createCustomer(
  input: { name: string; contactName: string; contactEmail: string; contactPhone?: string; notes?: string },
  actorId: string
) {
  const customerCode = await generateCustomerCode();
  const customer = await prisma.customer.create({ data: { customerCode, ...input } });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "Customer",
    recordId: customer.id,
    newValue: { customerCode, name: customer.name },
  });

  return customer;
}

export async function updateCustomer(
  id: string,
  input: Partial<{ name: string; contactName: string; contactEmail: string; contactPhone: string; notes: string }>,
  actorId: string
) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "CUSTOMER_NOT_FOUND", "Customer not found");

  const updated = await prisma.customer.update({ where: { id }, data: input });

  await writeAuditLog({ actorId, action: "UPDATE", resource: "Customer", recordId: id, oldValue: existing, newValue: updated });

  return updated;
}

export async function setCustomerStatus(id: string, status: "ACTIVE" | "INACTIVE", actorId: string) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "CUSTOMER_NOT_FOUND", "Customer not found");

  const updated = await prisma.customer.update({ where: { id }, data: { status } });

  await writeAuditLog({ actorId, action: "UPDATE", resource: "Customer", recordId: id, newValue: { status } });

  return updated;
}
