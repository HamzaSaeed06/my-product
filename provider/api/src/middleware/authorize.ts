import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./errorHandler.js";
import type { ProviderRole } from "../generated/prisma/index.js";

// Mirrors product/api/src/middleware/authorize.ts's shape (a middleware
// factory returning 401 if unauthenticated, 403 if the check fails) — but
// not its granularity. This platform has two flat roles (ADMIN,
// SUPPORT_READ_ONLY), not product/api's per-permission-key model, so this
// checks role membership directly instead of looking up a permission set.
export function authorize(...allowedRoles: ProviderRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.providerUser) {
      next(new HttpError(401, "UNAUTHENTICATED", "Authentication required"));
      return;
    }

    if (!allowedRoles.includes(req.providerUser.role)) {
      next(new HttpError(403, "FORBIDDEN", `Requires one of: ${allowedRoles.join(", ")}`));
      return;
    }

    next();
  };
}
