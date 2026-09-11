import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// RS256 signing lives ONLY on the provider platform — the private key is
// never shipped to a customer deployment, per PRODUCT_SPEC.md §2 "License
// Signing & Key Management". product/api independently verifies with just
// the public key half (LICENSE_PUBLIC_KEY_B64, copied once into its own
// .env) — no cross-import between the two apps, matching spec's "customer
// does NOT receive source code" separation. computeLicenseState below is
// therefore a small, deliberately duplicated pure function on both sides
// rather than a shared package, for the same reason.
function decodeKey(b64: string): string {
  return Buffer.from(b64, "base64").toString("utf-8");
}

const PRIVATE_KEY = decodeKey(env.LICENSE_PRIVATE_KEY_B64);
export const LICENSE_PUBLIC_KEY_PEM = decodeKey(env.LICENSE_PUBLIC_KEY_B64);

// Exact claim shape from PRODUCT_SPEC.md §2 "License Format".
export interface LicenseClaims {
  iss: string;
  sub: string; // customerId
  lic: string; // our License.id
  jti: string;
  iat: number;
  exp: number;
  nbf: number;
  plan: string; // Plan.tier
  features: string[];
  limits: { maxStudents: number; maxCampuses: number; maxStaff: number; maxStorage: number };
  deploymentId: string;
  deploymentUrl: string;
}

export function signLicense(input: {
  customerId: string;
  licenseId: string;
  plan: string;
  features: string[];
  limits: LicenseClaims["limits"];
  deploymentId: string;
  deploymentUrl: string;
  expiresAt: Date;
}): { signedJwt: string; jti: string } {
  const jti = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const payload: LicenseClaims = {
    iss: "provider.myproduct.local",
    sub: input.customerId,
    lic: input.licenseId,
    jti,
    iat: now,
    nbf: now,
    exp: Math.floor(input.expiresAt.getTime() / 1000),
    plan: input.plan,
    features: input.features,
    limits: input.limits,
    deploymentId: input.deploymentId,
    deploymentUrl: input.deploymentUrl,
  };
  const signedJwt = jwt.sign(payload, PRIVATE_KEY, { algorithm: "RS256" });
  return { signedJwt, jti };
}

export type LicenseState =
  | "VALID"
  | "EXPIRING_SOON"
  | "EXPIRING_CRITICAL"
  | "EXPIRED_GRACE"
  | "EXPIRED_FINAL"
  | "SUSPENDED"
  | "REVOKED";

// Day-threshold table from PRODUCT_SPEC.md §2 "License Expiry & Grace
// Period Behavior" — SUSPENDED/REVOKED are this platform's own admin
// actions (License.status) and always override the date-based state.
export function computeLicenseState(
  status: "ACTIVE" | "SUSPENDED" | "REVOKED",
  expiresAt: Date,
  now: Date = new Date()
): LicenseState {
  if (status === "REVOKED") return "REVOKED";
  if (status === "SUSPENDED") return "SUSPENDED";

  const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  if (daysUntilExpiry > 30) return "VALID";
  if (daysUntilExpiry > 7) return "EXPIRING_SOON";
  if (daysUntilExpiry >= 0) return "EXPIRING_CRITICAL";
  const daysSinceExpiry = -daysUntilExpiry;
  return daysSinceExpiry <= 30 ? "EXPIRED_GRACE" : "EXPIRED_FINAL";
}
