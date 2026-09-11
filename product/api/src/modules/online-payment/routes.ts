import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

// Three routers for spec's three separate API path prefixes — mounted at
// different paths in app.ts, backed by the same module's controller.

export const onlinePaymentRouter = Router();

onlinePaymentRouter.post(
  "/initiate",
  ...requirePermission("payment.pay_online"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.initiateOnlinePaymentHandler)
);

onlinePaymentRouter.get("/:gatewayTransactionId", ...requirePermission("payment.pay_online"), asyncHandler(controller.getCheckoutHandler));

onlinePaymentRouter.post(
  "/:gatewayTransactionId/confirm",
  ...requirePermission("payment.pay_online"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.confirmCheckoutHandler)
);

onlinePaymentRouter.post(
  "/:gatewayTransactionId/cancel",
  ...requirePermission("payment.pay_online"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.cancelCheckoutHandler)
);

// Public — a real gateway calls this with no session and no CSRF token.
// Authenticated by HMAC signature instead (see controller.ts).
export const paymentCallbackRouter = Router();
paymentCallbackRouter.post("/", asyncHandler(controller.paymentCallbackHandler));

export const paymentReconciliationRouter = Router();
paymentReconciliationRouter.get("/", ...requirePermission("payment.view"), asyncHandler(controller.getReconciliationSummaryHandler));
