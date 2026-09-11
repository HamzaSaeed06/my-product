import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, resolveStudentScopeFilter } from "../../lib/scope.js";

const amountSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, "amount must be a decimal number with up to 2 places");

const recordSchema = z.object({
  studentId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: amountSchema,
  applyCreditId: z.string().uuid().optional(),
});

const listQuerySchema = z.object({ studentId: z.string().uuid().optional() });

const reversalRequestSchema = z.object({ reason: z.string().min(1) });
const decideSchema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]), decisionNote: z.string().optional() });

const initiateAttemptSchema = z.object({ invoiceId: z.string().uuid(), amount: amountSchema });
const callbackSchema = z.object({ status: z.enum(["SUCCESS", "FAILED"]), gatewayTxnId: z.string().min(1) });

const unmatchedTxnSchema = z.object({ gatewayTxnId: z.string().min(1), amount: amountSchema, rawData: z.unknown() });
const resolveExceptionSchema = z.object({ decision: z.enum(["RESOLVED", "REJECTED"]), note: z.string().optional() });

export async function recordPaymentHandler(req: Request, res: Response): Promise<void> {
  const body = recordSchema.parse(req.body);
  res.status(201).json(await service.recordPayment(body, req.user!.id));
}

export async function listPaymentsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  const studentScope = await resolveStudentScopeFilter(profile, query.studentId);
  res.status(200).json(await service.listPayments(studentScope));
}

export async function requestPaymentReversalHandler(req: Request, res: Response): Promise<void> {
  const body = reversalRequestSchema.parse(req.body);
  const request = await service.requestPaymentReversal(req.params.paymentId!, body.reason, req.user!.id);
  res.status(201).json(request);
}

export async function decidePaymentReversalHandler(req: Request, res: Response): Promise<void> {
  const body = decideSchema.parse(req.body);
  res.status(200).json(await service.decidePaymentReversal(req.params.approvalId!, body.decision, body.decisionNote, req.user!.id));
}

export async function listCreditTransactionsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listCreditTransactions(query));
}

export async function initiatePaymentAttemptHandler(req: Request, res: Response): Promise<void> {
  const body = initiateAttemptSchema.parse(req.body);
  res.status(201).json(await service.initiatePaymentAttempt(body.invoiceId, body.amount, req.user!.id));
}

export async function handleGatewayCallbackHandler(req: Request, res: Response): Promise<void> {
  const body = callbackSchema.parse(req.body);
  res.status(200).json(await service.handleGatewayCallback(req.params.attemptId!, body, req.user!.id));
}

export async function recordUnmatchedGatewayTransactionHandler(req: Request, res: Response): Promise<void> {
  const body = unmatchedTxnSchema.parse(req.body);
  res.status(201).json(await service.recordUnmatchedGatewayTransaction(body));
}

export async function listReconciliationExceptionsHandler(req: Request, res: Response): Promise<void> {
  const query = z.object({ status: z.enum(["PENDING", "RESOLVED", "REJECTED"]).optional() }).parse(req.query);
  res.status(200).json(await service.listReconciliationExceptions(query));
}

export async function resolveReconciliationExceptionHandler(req: Request, res: Response): Promise<void> {
  const body = resolveExceptionSchema.parse(req.body);
  res.status(200).json(await service.resolveReconciliationException(req.params.exceptionId!, body.decision, body.note, req.user!.id));
}
