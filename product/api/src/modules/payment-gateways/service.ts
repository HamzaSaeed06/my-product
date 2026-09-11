import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { generateWebhookSecret } from "../../lib/gatewaySignature.js";

// The webhook secret is write-only from the API's perspective — returned
// once, at creation, exactly like an API key would be in a real product.
// Every other read omits it, so it's never exposed again over HTTP even
// to an admin who forgot to copy it (they'd rotate instead).
function publicInclude() {
  return { id: true, provider: true, name: true, isActive: true, createdAt: true, updatedAt: true } as const;
}

export async function listPaymentGateways() {
  return prisma.paymentGateway.findMany({ select: publicInclude(), orderBy: { createdAt: "desc" } });
}

export async function createPaymentGateway(input: { provider: "EASYPAISA" | "JAZZCASH" | "SIMULATED"; name: string }, actorId: string) {
  const webhookSecret = generateWebhookSecret();
  const gateway = await prisma.paymentGateway.create({
    data: { provider: input.provider, name: input.name, webhookSecret },
  });

  await writeAuditLog({ actorId, action: "CREATE", resource: "PaymentGateway", recordId: gateway.id, newValue: { provider: input.provider, name: input.name } });

  // The one and only time the secret is returned — the caller (an admin
  // setting this up) must record it now.
  return { id: gateway.id, provider: gateway.provider, name: gateway.name, isActive: gateway.isActive, webhookSecret };
}

export async function setPaymentGatewayActive(id: string, isActive: boolean, actorId: string) {
  const gateway = await prisma.paymentGateway.findUnique({ where: { id } });
  if (!gateway) throw new HttpError(404, "GATEWAY_NOT_FOUND", "Payment gateway not found");

  const updated = await prisma.paymentGateway.update({ where: { id }, data: { isActive }, select: publicInclude() });

  await writeAuditLog({ actorId, action: "UPDATE", resource: "PaymentGateway", recordId: id, newValue: { isActive } });

  return updated;
}

export async function getActiveGateway() {
  const gateway = await prisma.paymentGateway.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  if (!gateway) throw new HttpError(409, "NO_ACTIVE_GATEWAY", "No online payment gateway is currently active");
  return gateway;
}
