import type { NextFunction, Request, Response } from "express";
import { COOKIE_NAMES } from "../lib/cookies.js";
import { HttpError } from "./errorHandler.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Double-submit cookie CSRF check, per PRODUCT_SPEC.md §8 Authentication
// Architecture. The csrfToken cookie is non-httpOnly so the frontend can read
// it and echo it in the X-CSRF-Token header; an attacker's cross-site form
// can send the cookie automatically but cannot read it to set the header.
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
