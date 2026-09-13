import type { Request, Response } from "express";
import { z } from "zod";
import * as rolesService from "./service.js";

// Phase 12 Gap 2: name is now a free-editable DISPLAY LABEL (an institute
// may want "Front Desk", "Counselor", "Director"), not a machine
// identifier — the old UPPER_SNAKE_CASE-only pattern was a leftover from
// when name doubled as both label and authorization identity. A human
// label just needs sane bounds: non-empty after trimming, no control
// characters, a reasonable length.
const roleNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[^\x00-\x1f\x7f]+$/, "Role name cannot contain control characters");

const createRoleSchema = z.object({
  name: roleNameSchema,
  description: z.string().max(500).optional(),
});

const updateRoleSchema = z.object({
  name: roleNameSchema.optional(),
  description: z.string().max(500).optional(),
});

const setPermissionsSchema = z.object({ permissionKeys: z.array(z.string()).max(200) });

export async function listRolesHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await rolesService.listRoles());
}

export async function createRoleHandler(req: Request, res: Response): Promise<void> {
  const body = createRoleSchema.parse(req.body);
  const role = await rolesService.createRole(body, req.user!.id);
  res.status(201).json(role);
}

export async function updateRoleHandler(req: Request, res: Response): Promise<void> {
  const body = updateRoleSchema.parse(req.body);
  const role = await rolesService.updateRole(req.params.roleId!, body, req.user!.id);
  res.status(200).json(role);
}

export async function archiveRoleHandler(req: Request, res: Response): Promise<void> {
  const role = await rolesService.archiveRole(req.params.roleId!, req.user!.id);
  res.status(200).json(role);
}

export async function setRolePermissionsHandler(req: Request, res: Response): Promise<void> {
  const body = setPermissionsSchema.parse(req.body);
  const keys = await rolesService.setRolePermissions(req.params.roleId!, body.permissionKeys, req.user!.id);
  res.status(200).json({ permissionKeys: keys });
}

export async function listPermissionsHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await rolesService.listPermissions());
}
