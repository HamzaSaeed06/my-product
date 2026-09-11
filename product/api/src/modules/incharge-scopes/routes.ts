import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const inchargeScopesRouter = Router();

inchargeScopesRouter.get(
  "/",
  ...requirePermission("incharge_scope.view"),
  asyncHandler(controller.listInchargeScopesHandler)
);

inchargeScopesRouter.post(
  "/",
  ...requirePermission("incharge_scope.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createInchargeScopeHandler)
);

inchargeScopesRouter.patch(
  "/:scopeId",
  ...requirePermission("incharge_scope.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateInchargeScopeHandler)
);

inchargeScopesRouter.post(
  "/:scopeId/revoke",
  ...requirePermission("incharge_scope.revoke"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.revokeInchargeScopeHandler)
);
