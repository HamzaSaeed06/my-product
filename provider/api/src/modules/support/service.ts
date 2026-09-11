import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { generateTicketNumber } from "../../lib/providerCodes.js";

function include() {
  return { customer: { select: { id: true, name: true, customerCode: true } }, assignedTo: { select: { id: true, fullName: true } } };
}

export async function listTickets(filter: { status?: string; customerId?: string }) {
  return prisma.supportTicket.findMany({
    where: { status: filter.status as never, customerId: filter.customerId },
    include: include(),
    orderBy: { createdAt: "desc" },
  });
}

export async function createTicket(
  input: { customerId: string; subject: string; description: string; priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" },
  actorId: string
) {
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) throw new HttpError(400, "CUSTOMER_NOT_FOUND", "Customer not found");

  const ticketNumber = await generateTicketNumber();
  const ticket = await prisma.supportTicket.create({
    data: { ticketNumber, customerId: input.customerId, subject: input.subject, description: input.description, priority: input.priority },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "CREATE", resource: "SupportTicket", recordId: ticket.id, newValue: { ticketNumber, subject: ticket.subject } });

  return ticket;
}

export async function assignTicket(id: string, assignedToId: string | null, actorId: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw new HttpError(404, "TICKET_NOT_FOUND", "Support ticket not found");

  if (assignedToId) {
    const assignee = await prisma.providerUser.findUnique({ where: { id: assignedToId } });
    if (!assignee) throw new HttpError(400, "ASSIGNEE_NOT_FOUND", "Assignee not found");
  }

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: { assignedToId, status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "UPDATE", resource: "SupportTicket", recordId: id, newValue: { assignedToId } });

  return updated;
}

export async function resolveTicket(id: string, actorId: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw new HttpError(404, "TICKET_NOT_FOUND", "Support ticket not found");
  if (ticket.status === "CLOSED") throw new HttpError(409, "TICKET_CLOSED", "Cannot resolve a closed ticket");

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date() },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "RESOLVE", resource: "SupportTicket", recordId: id });

  return updated;
}

export async function closeTicket(id: string, actorId: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw new HttpError(404, "TICKET_NOT_FOUND", "Support ticket not found");

  const updated = await prisma.supportTicket.update({ where: { id }, data: { status: "CLOSED" }, include: include() });
  await writeAuditLog({ actorId, action: "CLOSE", resource: "SupportTicket", recordId: id });
  return updated;
}
