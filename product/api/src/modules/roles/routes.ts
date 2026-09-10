import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const rolesRouter = Router();

rolesRouter.get("/", ...requirePermission("role.view"), asyncHandler(controller.listRolesHandler));
rolesRouter.post(
  "/",
  ...requirePermission("role.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createRoleHandler)
);
rolesRouter.patch(
  "/:roleId",
  ...requirePermission("role.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateRoleHandler)
);
rolesRouter.post(
  "/:roleId/archive",
  ...requirePermission("role.archive"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.archiveRoleHandler)
);
rolesRouter.put(
  "/:roleId/permissions",
  ...requirePermission("role.assign_permissions"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.setRolePermissionsHandler)
);

export const permissionsRouter = Router();
permissionsRouter.get(
  "/",
  ...requirePermission("role.view"),
  asyncHandler(controller.listPermissionsHandler)
);
