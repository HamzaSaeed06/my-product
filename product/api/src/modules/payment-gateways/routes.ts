import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const paymentGatewaysRouter = Router();

// Gateway config (including generating/rotating webhook secrets) is a
// sensitive, setup-time admin action — a separate, narrower permission
// than the day-to-day payment.view/payment.record OFFICE already has,
// per spec's "Authorization First" principle of scoping permissions to
// what they actually guard.
paymentGatewaysRouter.get("/", ...requirePermission("payment_gateway.manage"), asyncHandler(controller.listPaymentGatewaysHandler));

paymentGatewaysRouter.post(
  "/",
  ...requirePermission("payment_gateway.manage"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createPaymentGatewayHandler)
);

paymentGatewaysRouter.post(
  "/:gatewayId/active",
  ...requirePermission("payment_gateway.manage"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.setPaymentGatewayActiveHandler)
);
