import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, assertCampusInScope } from "../../lib/scope.js";

const createSchema = z.object({
  delegateToUserId: z.string().uuid(),
  roleId: z.string().uuid(),
  campusId: z.string().uuid(),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  reason: z.string().min(1).max(1000),
});

const listQuerySchema = z.object({
  campusId: z.string().uuid().optional(),
});

export async function createDelegationHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  assertCampusInScope(profile, body.campusId);
  res.status(201).json(await service.createDelegation(body, req.user!.id));
}

export async function listDelegationsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  if (query.campusId) {
    assertCampusInScope(profile, query.campusId);
    res.status(200).json(await service.listDelegations({ campusId: query.campusId }));
    return;
  }
  // Only SUPER_ADMIN (campusIds always empty) and CAMPUS_HEAD (campusIds
  // populated) hold delegation.view — no other role reaches this handler,
  // so an empty campusIds here unambiguously means "unrestricted".
  const campusIdIn = profile.campusIds.length > 0 ? profile.campusIds : undefined;
  res.status(200).json(await service.listDelegations({ campusIdIn }));
}

export async function listMyDelegationsHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.listDelegations({ delegateToUserId: req.user!.id, activeOnly: true }));
}

export async function revokeDelegationHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  assertCampusInScope(profile, await service.getDelegationCampusId(req.params.delegationId!));
  res.status(200).json(await service.revokeDelegation(req.params.delegationId!, req.user!.id));
}
