import type { Request, Response } from "express";
import { z } from "zod";
import * as rolesService from "./service.js";

const createRoleSchema = z.object({
  name: z.string().min(2).max(64).regex(/^[A-Z0-9_]+$/, "Use UPPER_SNAKE_CASE"),
  description: z.string().max(500).optional(),
});

const updateRoleSchema = z.object({ description: z.string().max(500).optional() });

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
  const role = await rolesService.updateRoleDescription(req.params.roleId!, body.description, req.user!.id);
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
