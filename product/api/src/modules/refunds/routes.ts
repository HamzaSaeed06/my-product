import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const refundsRouter = Router();

refundsRouter.get("/", ...requirePermission("refund.view"), asyncHandler(controller.listRefundsHandler));

refundsRouter.post(
  "/",
  ...requirePermission("refund.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createRefundHandler)
);

refundsRouter.post(
  "/:refundId/decide",
  ...requirePermission("refund.approve"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.decideRefundHandler)
);

refundsRouter.post(
  "/:refundId/complete",
  ...requirePermission("refund.approve"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.completeRefundHandler)
);
