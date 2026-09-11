import type { NextFunction, Request, Response } from "express";
import { COOKIE_NAMES } from "../lib/cookies.js";
import { HttpError } from "./errorHandler.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[COOKIE_NAMES.csrfToken];
  const headerToken = req.get("X-CSRF-Token");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new HttpError(403, "CSRF_VALIDATION_FAILED", "Missing or invalid CSRF token"));
    return;
  }

  next();
}
