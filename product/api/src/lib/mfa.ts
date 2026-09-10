import { authenticator } from "otplib";

// TOTP-based MFA, required for Super Admin / Provider Admin per
// PRODUCT_SPEC.md §8 Security Implementation Checklist.
export function generateMfaSecret(): string {
  return authenticator.generateSecret();
}

export function buildMfaOtpAuthUrl(email: string, secret: string, issuer = "EducationPlatform"): string {
  return authenticator.keyuri(email, issuer, secret);
}

export function verifyMfaToken(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}
