import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { computeLicenseState, verifyLicenseJwt } from "../../src/lib/license.js";

const DAY = 24 * 60 * 60 * 1000;

describe("computeLicenseState (PRODUCT_SPEC.md §2 day-threshold table)", () => {
  const now = new Date("2026-06-01T00:00:00Z");

  it("VALID when more than 30 days from expiry", () => {
    expect(computeLicenseState(new Date(now.getTime() + 40 * DAY), now)).toBe("VALID");
  });

  it("EXPIRING_SOON when 7-30 days from expiry", () => {
    expect(computeLicenseState(new Date(now.getTime() + 20 * DAY), now)).toBe("EXPIRING_SOON");
    expect(computeLicenseState(new Date(now.getTime() + 8 * DAY), now)).toBe("EXPIRING_SOON");
  });

  it("EXPIRING_CRITICAL when under 7 days from expiry (but not yet expired)", () => {
    expect(computeLicenseState(new Date(now.getTime() + 3 * DAY), now)).toBe("EXPIRING_CRITICAL");
    expect(computeLicenseState(now, now)).toBe("EXPIRING_CRITICAL");
  });

  it("EXPIRED_GRACE when expired less than 30 days ago", () => {
    expect(computeLicenseState(new Date(now.getTime() - 1 * DAY), now)).toBe("EXPIRED_GRACE");
    expect(computeLicenseState(new Date(now.getTime() - 29 * DAY), now)).toBe("EXPIRED_GRACE");
  });

  it("EXPIRED_FINAL when expired more than 30 days ago", () => {
    expect(computeLicenseState(new Date(now.getTime() - 31 * DAY), now)).toBe("EXPIRED_FINAL");
    expect(computeLicenseState(new Date(now.getTime() - 400 * DAY), now)).toBe("EXPIRED_FINAL");
  });
});

describe("verifyLicenseJwt", () => {
  function generateKeyPairB64() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    return { privateKey, publicKeyB64: Buffer.from(publicKey).toString("base64") };
  }

  it("verifies a JWT signed with the matching private key", () => {
    const { privateKey, publicKeyB64 } = generateKeyPairB64();
    const token = jwt.sign({ sub: "customer_1", deploymentId: "deploy_1" }, privateKey, { algorithm: "RS256" });

    const claims = verifyLicenseJwt(token, publicKeyB64);
    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe("customer_1");
  });

  it("rejects a JWT signed with a different private key (wrong keypair)", () => {
    const { privateKey: signingKey } = generateKeyPairB64();
    const { publicKeyB64: wrongPublicKey } = generateKeyPairB64();
    const token = jwt.sign({ sub: "customer_1" }, signingKey, { algorithm: "RS256" });

    expect(verifyLicenseJwt(token, wrongPublicKey)).toBeNull();
  });

  it("rejects a tampered token", () => {
    const { privateKey, publicKeyB64 } = generateKeyPairB64();
    const token = jwt.sign({ sub: "customer_1" }, privateKey, { algorithm: "RS256" });

    expect(verifyLicenseJwt(`${token}tampered`, publicKeyB64)).toBeNull();
  });

  it("rejects malformed input", () => {
    const { publicKeyB64 } = generateKeyPairB64();
    expect(verifyLicenseJwt("not-a-jwt", publicKeyB64)).toBeNull();
  });
});
