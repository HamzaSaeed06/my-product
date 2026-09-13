import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { authenticate } from "../../middleware/authenticate.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const delegationsRouter = Router();

// Any authenticated user can see their own received delegations, regardless
// of role — this is what the eventual "You have temporary Office access
// until..." portal banner (per the design doc) will call.
delegationsRouter.get("/mine", authenticate, asyncHandler(controller.listMyDelegationsHandler));

delegationsRouter.get("/", ...requirePermission("delegation.view"), asyncHandler(controller.listDelegationsHandler));

delegationsRouter.post(
  "/",
  ...requirePermission("delegation.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createDelegationHandler)
);

delegationsRouter.post(
  "/:delegationId/revoke",
  ...requirePermission("delegation.revoke"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.revokeDelegationHandler)
);
