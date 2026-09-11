import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const discountsRouter = Router();

discountsRouter.get("/", ...requirePermission("discount.view"), asyncHandler(controller.listDiscountsHandler));

discountsRouter.post(
  "/",
  ...requirePermission("discount.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createDiscountHandler)
);

discountsRouter.post(
  "/:discountId/decide",
  ...requirePermission("discount.approve"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.decideDiscountHandler)
);
