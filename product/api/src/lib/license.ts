import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Customer-side half of Phase 10's License & Entitlement Architecture
// (PRODUCT_SPEC.md §2). Deliberately has NO dependency on provider/api or
// its code — "customer does NOT receive source code" is the whole point of
// the split, so this is a from-scratch, independent implementation of the
// same verify-and-compute-state logic provider/api's own license.ts has on
// the signing side. Loaded and verified ONCE at module load ("Cache in
// memory... Application starts normally"); every check thereafter is pure
// in-memory computation — no provider API call, no blocking if the
// provider is unreachable, per spec's explicit validation rules.

export interface LicenseClaims {
  iss: string;
  sub: string;
  lic: string;
  jti: string;
  iat: number;
  exp: number;
  nbf: number;
  plan: string;
  features: string[];
  limits: { maxStudents: number; maxCampuses: number; maxStaff: number; maxStorage: number };
  deploymentId: string;
  deploymentUrl: string;
}

export type LicenseState =
  | "NOT_CONFIGURED" // no LICENSE_JWT at all — a local/dev instance, runs unrestricted
  | "INVALID" // a LICENSE_JWT was provided but doesn't verify — fails closed
  | "VALID"
  | "EXPIRING_SOON"
  | "EXPIRING_CRITICAL"
  | "EXPIRED_GRACE"
  | "EXPIRED_FINAL";

// Same day-threshold table as provider/api's computeLicenseState, minus the
// SUSPENDED/REVOKED branches — those are the provider's own admin action on
// the License row, invisible to a customer holding a JWT signed before that
// action happened. A revoked license only takes effect here once the
// customer is issued (and installs) a new one; this app never calls home to
// find out, by design.
export function computeLicenseState(expiresAt: Date, now: Date = new Date()): "VALID" | "EXPIRING_SOON" | "EXPIRING_CRITICAL" | "EXPIRED_GRACE" | "EXPIRED_FINAL" {
  const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  if (daysUntilExpiry > 30) return "VALID";
  if (daysUntilExpiry > 7) return "EXPIRING_SOON";
  if (daysUntilExpiry >= 0) return "EXPIRING_CRITICAL";
  const daysSinceExpiry = -daysUntilExpiry;
  return daysSinceExpiry <= 30 ? "EXPIRED_GRACE" : "EXPIRED_FINAL";
}

interface LicenseInfo {
  state: LicenseState;
  claims: LicenseClaims | null;
}

// Pulled out as a standalone, dependency-injected function (rather than
// reading `env` directly) so it's unit-testable with a throwaway keypair —
// see tests/unit/license.test.ts — without needing to fake process.env for
// a module-level singleton.
export function verifyLicenseJwt(rawJwt: string, publicKeyB64: string): LicenseClaims | null {
  try {
    const publicKey = Buffer.from(publicKeyB64, "base64").toString("utf-8");
    return jwt.verify(rawJwt, publicKey, { algorithms: ["RS256"] }) as LicenseClaims;
  } catch (err) {
    console.error("LICENSE_JWT failed signature verification:", err instanceof Error ? err.message : err);
    return null;
  }
}

function loadLicense(): { claims: LicenseClaims | null; verified: boolean } {
  if (!env.LICENSE_JWT) {
    return { claims: null, verified: false };
  }
  if (!env.LICENSE_PUBLIC_KEY_B64) {
    console.error("LICENSE_JWT is set but LICENSE_PUBLIC_KEY_B64 is missing — cannot verify, treating license as invalid.");
    return { claims: null, verified: false };
  }

  const claims = verifyLicenseJwt(env.LICENSE_JWT, env.LICENSE_PUBLIC_KEY_B64);
  return claims ? { claims, verified: true } : { claims: null, verified: false };
}

const loaded = loadLicense();

// getLicenseInfo() recomputes the date-based state on every call (state
// changes with the passage of time even though the claims themselves are
// static) but never re-verifies the signature or touches the network —
// exactly spec's "cache in memory, check in-memory only" rule.
export function getLicenseInfo(now: Date = new Date()): LicenseInfo {
  if (!loaded.verified || !loaded.claims) {
    return { state: env.LICENSE_JWT ? "INVALID" : "NOT_CONFIGURED", claims: null };
  }
  const expiresAt = new Date(loaded.claims.exp * 1000);
  return { state: computeLicenseState(expiresAt, now), claims: loaded.claims };
}

export function licenseHasFeature(feature: string): boolean {
  const { claims } = getLicenseInfo();
  return claims ? claims.features.includes(feature) : true; // NOT_CONFIGURED/no license → unrestricted, see module comment
}
