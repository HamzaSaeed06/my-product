import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "./errorHandler.js";

// Phase 0 implements only the Role + Permission part of the authorization
// formula (PRODUCT_SPEC.md §5: Role + Permission + Scope + Context + State).
// Scope (campus/academic-year/class/section) and Context/State checks
// (record ownership, editable state, finalized/published locks) are added
// per-resource starting Phase 1+, once Campus/Class/Section/InchargeScope
// exist. Every later authorize() call in those phases MUST layer scope and
// context on top of this — never treat "has permission" alone as sufficient.
export async function getUserPermissionKeys(userId: string): Promise<Set<string>> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  const keys = new Set<string>();
  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.rolePermissions) {
      keys.add(rolePermission.permission.key);
    }
  }
  return keys;
}

export function authorize(requiredPermission: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next(new HttpError(401, "UNAUTHENTICATED", "Authentication required"));
      return;
    }

    const permissionKeys = await getUserPermissionKeys(req.user.id);

    if (!permissionKeys.has(requiredPermission)) {
      next(
        new HttpError(
          403,
          "FORBIDDEN",
          `Missing required permission: ${requiredPermission}`
        )
      );
      return;
    }

    next();
  };
}
