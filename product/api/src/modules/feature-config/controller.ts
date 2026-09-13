import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { resolveFeatureConfig, setInstituteFeatureConfig, setCampusFeatureConfig } from "../../lib/featureConfig.js";
import { writeAuditLog } from "../../lib/audit.js";

const setInstituteSchema = z.object({
  policyMode: z.enum(["MANDATORY", "INSTITUTE_DEFAULT", "CAMPUS_CONTROLLED"]),
  value: z.unknown(),
});

const setCampusSchema = z.object({ value: z.unknown() });

async function getInstituteOrThrow() {
  const institute = await prisma.institute.findFirst();
  if (!institute) throw new HttpError(404, "INSTITUTE_NOT_CONFIGURED", "No institute has been configured yet");
  return institute;
}

// Read-only, authenticate-only — same reasoning as terminology: any role's
// UI may legitimately need to know a feature's effective policy for the
// campus it's operating in, not just roles that can configure it.
export async function resolveFeatureConfigHandler(req: Request, res: Response): Promise<void> {
  const featureKey = z.string().min(1).parse(req.params.featureKey);
  const campusId = req.query.campusId ? z.string().uuid().parse(req.query.campusId) : null;
  const institute = await getInstituteOrThrow();
  res.status(200).json(await resolveFeatureConfig(institute.id, campusId, featureKey));
}

export async function setInstituteFeatureConfigHandler(req: Request, res: Response): Promise<void> {
  const featureKey = z.string().min(1).parse(req.params.featureKey);
  const body = setInstituteSchema.parse(req.body);
  const institute = await getInstituteOrThrow();

  const updated = await setInstituteFeatureConfig(institute.id, featureKey, body.policyMode, body.value);

  await writeAuditLog({
    actorId: req.user!.id,
    action: "UPDATE",
    resource: "FeatureConfig",
    recordId: updated.id,
    newValue: { featureKey, policyMode: body.policyMode, value: body.value },
  });

  res.status(200).json(updated);
}

export async function setCampusFeatureConfigHandler(req: Request, res: Response): Promise<void> {
  const featureKey = z.string().min(1).parse(req.params.featureKey);
  const campusId = z.string().uuid().parse(req.params.campusId);
  const body = setCampusSchema.parse(req.body);
  const institute = await getInstituteOrThrow();

  const updated = await setCampusFeatureConfig(institute.id, campusId, featureKey, body.value);

  await writeAuditLog({
    actorId: req.user!.id,
    action: "UPDATE",
    resource: "FeatureConfig",
    recordId: updated.id,
    newValue: { featureKey, campusId, value: body.value },
  });

  res.status(200).json(updated);
}
