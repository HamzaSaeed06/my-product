import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const featureConfigRouter = Router();

featureConfigRouter.get("/:featureKey/resolve", authenticate, asyncHandler(controller.resolveFeatureConfigHandler));

// Institute-level policy setting stays Super-Admin-only, same authority as
// every other institute-wide setting — deliberately not delegated to
// Campus Head even for CAMPUS_CONTROLLED features this pass; see the
// comment on this route's controller for the reasoning.
featureConfigRouter.put(
  "/:featureKey",
  ...requirePermission("institute.configure"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.setInstituteFeatureConfigHandler)
);

featureConfigRouter.put(
  "/:featureKey/campus/:campusId",
  ...requirePermission("institute.configure"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.setCampusFeatureConfigHandler)
);
