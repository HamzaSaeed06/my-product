import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const plansRouter = Router();

plansRouter.get("/", authenticate, asyncHandler(controller.listPlansHandler));
plansRouter.post("/", authenticate, csrfProtection, writeRateLimiter, asyncHandler(controller.createPlanHandler));
plansRouter.post("/:planId/active", authenticate, csrfProtection, writeRateLimiter, asyncHandler(controller.setPlanActiveHandler));
