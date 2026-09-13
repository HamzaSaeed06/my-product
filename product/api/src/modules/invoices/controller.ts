import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, resolveStudentScopeFilter, assertStudentInScope } from "../../lib/scope.js";

const amountSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, "amount must be a decimal number with up to 2 places");

const listQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  status: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID", "VOID"]).optional(),
});

const createSchema = z.object({
  studentId: z.string().uuid(),
  dueDate: z.coerce.date(),
  // Deliberately no .min(1) here — an empty array is a shape Zod accepts,
  // so the service's NO_ITEMS check (a more specific, named error than a
  // generic VALIDATION_ERROR) is what actually fires for this case.
  items: z.array(z.object({ feeCategoryId: z.string().uuid(), description: z.string().min(1), amount: amountSchema })),
});

const voidSchema = z.object({ reason: z.string().min(1) });

export async function listInvoicesHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  const studentScope = await resolveStudentScopeFilter(profile, query.studentId);
  res.status(200).json(await service.listInvoices({ status: query.status, ...studentScope }));
}

export async function getInvoiceHandler(req: Request, res: Response): Promise<void> {
  const invoice = await service.getInvoice(req.params.invoiceId!);
  const profile = await getActorProfile(req.user!.id);
  await assertStudentInScope(profile, invoice.studentId);
  res.status(200).json(invoice);
}

export async function createInvoiceHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  await assertStudentInScope(profile, body.studentId);
  res.status(201).json(await service.createInvoice(body, req.user!.id));
}

export async function voidInvoiceHandler(req: Request, res: Response): Promise<void> {
  const body = voidSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  const invoice = await service.getInvoice(req.params.invoiceId!);
  await assertStudentInScope(profile, invoice.studentId);
  res.status(200).json(await service.voidInvoice(req.params.invoiceId!, body.reason, req.user!.id));
}
