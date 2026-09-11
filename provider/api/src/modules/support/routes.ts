import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const supportRouter = Router();

supportRouter.get("/", authenticate, asyncHandler(controller.listTicketsHandler));
supportRouter.post("/", authenticate, csrfProtection, writeRateLimiter, asyncHandler(controller.createTicketHandler));
supportRouter.post("/:ticketId/assign", authenticate, csrfProtection, writeRateLimiter, asyncHandler(controller.assignTicketHandler));
supportRouter.post("/:ticketId/resolve", authenticate, csrfProtection, writeRateLimiter, asyncHandler(controller.resolveTicketHandler));
supportRouter.post("/:ticketId/close", authenticate, csrfProtection, writeRateLimiter, asyncHandler(controller.closeTicketHandler));
