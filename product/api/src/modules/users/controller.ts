import type { Request, Response } from "express";
import { z } from "zod";
import * as usersService from "./service.js";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(200),
});

const updateUserSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
});

const setActiveSchema = z.object({ isActive: z.boolean() });

const assignRoleSchema = z.object({ roleId: z.string().uuid(), campusId: z.string().uuid().nullable().optional() });

export async function listUsersHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await usersService.listUsers());
}

export async function createUserHandler(req: Request, res: Response): Promise<void> {
  const body = createUserSchema.parse(req.body);
  const user = await usersService.createUser(body, req.user!.id);
  res.status(201).json(user);
}

export async function updateUserHandler(req: Request, res: Response): Promise<void> {
  const body = updateUserSchema.parse(req.body);
  const user = await usersService.updateUser(req.params.userId!, body, req.user!.id);
  res.status(200).json(user);
}

export async function setUserActiveHandler(req: Request, res: Response): Promise<void> {
  const body = setActiveSchema.parse(req.body);
  const user = await usersService.setUserActive(req.params.userId!, body.isActive, req.user!.id);
  res.status(200).json(user);
}

export async function assignRoleHandler(req: Request, res: Response): Promise<void> {
  const body = assignRoleSchema.parse(req.body);
  const userRole = await usersService.assignRole(
    req.params.userId!,
    body.roleId,
    body.campusId ?? null,
    req.user!.id
  );
  res.status(201).json(userRole);
}

export async function removeRoleHandler(req: Request, res: Response): Promise<void> {
  await usersService.removeRole(req.params.userId!, req.params.userRoleId!, req.user!.id);
  res.status(204).send();
}
