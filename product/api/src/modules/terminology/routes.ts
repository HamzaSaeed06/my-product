import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const terminologyRouter = Router();

terminologyRouter.get("/", authenticate, asyncHandler(controller.getTerminologyHandler));

// Same authority as the legacy institute-settings label fields this
// replaces — institute.configure.
terminologyRouter.put(
  "/:canonicalKey",
  ...requirePermission("institute.configure"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.setTerminologyHandler)
);
