import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const promotionsRouter = Router();

promotionsRouter.get("/", ...requirePermission("promotion.view"), asyncHandler(controller.listPromotionsHandler));

promotionsRouter.post(
  "/",
  ...requirePermission("promotion.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createPromotionHandler)
);

promotionsRouter.post(
  "/class-jump/:approvalId/decide",
  ...requirePermission("promotion.approve"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.decidePromotionClassJumpHandler)
);
