import type { Request, Response } from "express";
import { getLicenseInfo } from "../../lib/license.js";

// Public — deliberately no `authenticate` here. Spec's EXPIRED_FINAL state
// blocks non-Super-Admin login entirely, so the login screen itself needs
// to be able to show "License expired. Contact provider to renew." to a
// user who by definition cannot get a session yet. Returns nothing
// sensitive: no raw JWT, no signature, no deploymentUrl/jti.
export function getLicenseStatusHandler(_req: Request, res: Response): void {
  const { state, claims } = getLicenseInfo();

  res.status(200).json({
    state,
    plan: claims?.plan ?? null,
    features: claims?.features ?? [],
    limits: claims?.limits ?? null,
    expiresAt: claims ? new Date(claims.exp * 1000).toISOString() : null,
  });
}
