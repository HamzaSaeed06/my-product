import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const instituteRouter = Router();

instituteRouter.get("/", ...requirePermission("institute.view"), asyncHandler(controller.getInstituteHandler));

instituteRouter.post(
  "/",
  ...requirePermission("institute.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createInstituteHandler)
);

instituteRouter.patch(
  "/",
  ...requirePermission("institute.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateInstituteHandler)
);

instituteRouter.patch(
  "/settings",
  ...requirePermission("institute.configure"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateSettingsHandler)
);
