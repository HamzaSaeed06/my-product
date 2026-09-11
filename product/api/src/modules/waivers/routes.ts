import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const waiversRouter = Router();

waiversRouter.get("/", ...requirePermission("waiver.view"), asyncHandler(controller.listWaiversHandler));

waiversRouter.post(
  "/",
  ...requirePermission("waiver.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createWaiverHandler)
);

waiversRouter.post(
  "/:waiverId/decide",
  ...requirePermission("waiver.approve"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.decideWaiverHandler)
);
