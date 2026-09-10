import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { loginRateLimiter } from "../../middleware/rateLimiter.js";

export const authRouter = Router();

authRouter.post("/login", loginRateLimiter, asyncHandler(controller.loginHandler));
authRouter.post("/refresh", asyncHandler(controller.refreshHandler));
authRouter.post("/logout", authenticate, csrfProtection, asyncHandler(controller.logoutHandler));
authRouter.get("/me", authenticate, asyncHandler(controller.meHandler));

authRouter.post(
  "/mfa/setup",
  authenticate,
  csrfProtection,
  asyncHandler(controller.setupMfaHandler)
);
authRouter.post(
  "/mfa/confirm",
  authenticate,
  csrfProtection,
  asyncHandler(controller.confirmMfaHandler)
);
