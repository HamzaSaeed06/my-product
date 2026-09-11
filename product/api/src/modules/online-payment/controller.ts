import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { prisma } from "../../lib/prisma.js";
import { getActorProfile, assertStudentInScope } from "../../lib/scope.js";
import { HttpError } from "../../middleware/errorHandler.js";

const amountSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, "amount must be a decimal number with up to 2 places");

const initiateSchema = z.object({ invoiceId: z.string().uuid(), amount: amountSchema });

async function assertOwnsCheckout(actorId: string, gatewayTransactionId: string): Promise<void> {
  const txn = await prisma.gatewayTransaction.findUnique({
    where: { id: gatewayTransactionId },
    include: { attempt: { include: { invoice: true } } },
  });
  if (!txn) throw new HttpError(404, "GATEWAY_TRANSACTION_NOT_FOUND", "Checkout session not found");
  const profile = await getActorProfile(actorId);
  await assertStudentInScope(profile, txn.attempt.invoice.studentId);
}

export async function initiateOnlinePaymentHandler(req: Request, res: Response): Promise<void> {
  const body = initiateSchema.parse(req.body);
  const invoice = await prisma.invoice.findUnique({ where: { id: body.invoiceId } });
  if (!invoice) throw new HttpError(400, "INVOICE_NOT_FOUND", "Invoice not found");
  const profile = await getActorProfile(req.user!.id);
  await assertStudentInScope(profile, invoice.studentId);

  const result = await service.initiateOnlinePayment(body, req.user!.id);
  res.status(201).json(result);
}

export async function getCheckoutHandler(req: Request, res: Response): Promise<void> {
  await assertOwnsCheckout(req.user!.id, req.params.gatewayTransactionId!);
  res.status(200).json(await service.getCheckoutDetails(req.params.gatewayTransactionId!));
}

export async function confirmCheckoutHandler(req: Request, res: Response): Promise<void> {
  await assertOwnsCheckout(req.user!.id, req.params.gatewayTransactionId!);
  res.status(200).json(await service.simulateGatewayConfirm(req.params.gatewayTransactionId!, "SUCCESS"));
}

export async function cancelCheckoutHandler(req: Request, res: Response): Promise<void> {
  await assertOwnsCheckout(req.user!.id, req.params.gatewayTransactionId!);
  res.status(200).json(await service.simulateGatewayConfirm(req.params.gatewayTransactionId!, "FAILED"));
}

// Public webhook — no session, no CSRF (an external gateway has neither).
// Authenticity comes entirely from the HMAC signature, verified against
// the exact raw bytes captured by app.ts's express.json() verify hook.
export async function paymentCallbackHandler(req: Request, res: Response): Promise<void> {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  const bodyString = rawBody ? rawBody.toString("utf-8") : JSON.stringify(req.body);
  const signature = req.get("X-Gateway-Signature");

  const result = await service.processGatewayCallback(bodyString, signature);
  res.status(200).json(result);
}

const reconciliationQuerySchema = z.object({ dateFrom: z.coerce.date(), dateTo: z.coerce.date() });

export async function getReconciliationSummaryHandler(req: Request, res: Response): Promise<void> {
  const query = reconciliationQuerySchema.parse(req.query);
  res.status(200).json(await service.getReconciliationSummary(query));
}
