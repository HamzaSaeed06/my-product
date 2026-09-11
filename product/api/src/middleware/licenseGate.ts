import type { NextFunction, Request, Response } from "express";
import { getLicenseInfo } from "../lib/license.js";
import { HttpError } from "./errorHandler.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Paths exempt from the write gate even in EXPIRED_GRACE/EXPIRED_FINAL —
// session management (login/refresh/logout) and the license-status read
// itself must keep working, per spec's explicit "Login allowed" (grace) /
// "Super Admin can login" (final) rules. Everything else (student/fee/
// attendance/etc. mutations) is a "business data" write and gets blocked.
const EXEMPT_PREFIXES = ["/api/v1/auth", "/api/v1/license", "/health"];

// PRODUCT_SPEC.md §2 "License Expiry & Grace Period Behavior":
// EXPIRED_GRACE -> read-only (Create/Edit/Delete blocked); EXPIRED_FINAL ->
// same, plus login itself is restricted to Super Admin (enforced in
// auth/service.ts, not here, since that check needs the user's role which
// isn't known until after password verification). INVALID (a LICENSE_JWT
// that failed to verify) is treated the same as EXPIRED_FINAL — fail
// closed on a tampered/corrupt license rather than silently allowing it.
// NOT_CONFIGURED (no LICENSE_JWT at all — a local/dev instance) is
// unrestricted, see license.ts's module comment.
export function licenseWriteGate(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method) || EXEMPT_PREFIXES.some((p) => req.path.startsWith(p))) {
    next();
    return;
  }

  const { state } = getLicenseInfo();
  if (state === "EXPIRED_GRACE" || state === "EXPIRED_FINAL" || state === "INVALID") {
    next(
      new HttpError(
        423,
        "LICENSE_EXPIRED",
        "This license has expired. Data remains readable, but creating, editing, or deleting is blocked until it's renewed."
      )
    );
    return;
  }

  next();
}
