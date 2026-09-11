import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const paymentsRouter = Router();

paymentsRouter.get("/", ...requirePermission("payment.view"), asyncHandler(controller.listPaymentsHandler));

paymentsRouter.post(
  "/",
  ...requirePermission("payment.record"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.recordPaymentHandler)
);

paymentsRouter.post(
  "/:paymentId/request-reversal",
  ...requirePermission("payment.reverse"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.requestPaymentReversalHandler)
);

paymentsRouter.post(
  "/reversals/:approvalId/decide",
  ...requirePermission("payment.reverse"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.decidePaymentReversalHandler)
);

paymentsRouter.get("/credits", ...requirePermission("payment.view"), asyncHandler(controller.listCreditTransactionsHandler));

paymentsRouter.post(
  "/attempts",
  ...requirePermission("payment.record"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.initiatePaymentAttemptHandler)
);

paymentsRouter.post(
  "/attempts/:attemptId/callback",
  ...requirePermission("payment.record"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.handleGatewayCallbackHandler)
);

paymentsRouter.post(
  "/reconciliation-exceptions",
  ...requirePermission("payment.record"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.recordUnmatchedGatewayTransactionHandler)
);

paymentsRouter.get(
  "/reconciliation-exceptions",
  ...requirePermission("payment.view"),
  asyncHandler(controller.listReconciliationExceptionsHandler)
);

paymentsRouter.post(
  "/reconciliation-exceptions/:exceptionId/resolve",
  ...requirePermission("payment.reverse"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.resolveReconciliationExceptionHandler)
);
