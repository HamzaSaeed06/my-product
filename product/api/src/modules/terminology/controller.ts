import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { resolveTerminology, setTerminologyOverride, TERMINOLOGY_CANONICAL_KEYS } from "../../lib/terminology.js";
import { writeAuditLog } from "../../lib/audit.js";

const canonicalKeySchema = z.enum(TERMINOLOGY_CANONICAL_KEYS);

const setLabelSchema = z.object({
  singularLabel: z.string().trim().min(1).max(50),
  pluralLabel: z.string().trim().min(1).max(50),
});

// Not permission-gated beyond being logged in — every role's UI needs
// these labels to render correctly, not just roles that can view/edit
// institute settings (institute.view is narrowly granted, e.g. Teacher/
// Parent/Student don't hold it, but they absolutely need to know what
// this institute calls "Class").
export async function getTerminologyHandler(_req: Request, res: Response): Promise<void> {
  const institute = await prisma.institute.findFirst();
  if (!institute) throw new HttpError(404, "INSTITUTE_NOT_CONFIGURED", "No institute has been configured yet");
  res.status(200).json(await resolveTerminology(institute.id));
}

export async function setTerminologyHandler(req: Request, res: Response): Promise<void> {
  const canonicalKey = canonicalKeySchema.parse(req.params.canonicalKey);
  const body = setLabelSchema.parse(req.body);
  const institute = await prisma.institute.findFirst();
  if (!institute) throw new HttpError(404, "INSTITUTE_NOT_CONFIGURED", "No institute has been configured yet");

  const updated = await setTerminologyOverride(institute.id, canonicalKey, { singular: body.singularLabel, plural: body.pluralLabel });

  await writeAuditLog({
    actorId: req.user!.id,
    action: "UPDATE",
    resource: "TerminologyOverride",
    recordId: updated.id,
    newValue: { canonicalKey, singularLabel: body.singularLabel, pluralLabel: body.pluralLabel },
  });

  res.status(200).json(updated);
}
