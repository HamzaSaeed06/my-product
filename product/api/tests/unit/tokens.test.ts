import { describe, expect, it } from "vitest";
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  generateCsrfToken,
} from "../../src/lib/tokens.js";

describe("access tokens", () => {
  it("round-trips payload through sign/verify", () => {
    const token = signAccessToken({ sub: "user_1", sid: "session_1" });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("user_1");
    expect(payload.sid).toBe("session_1");
  });

  it("throws on a tampered token", () => {
    const token = signAccessToken({ sub: "user_1", sid: "session_1" });
    expect(() => verifyAccessToken(token + "tampered")).toThrow();
  });
});

describe("refresh tokens", () => {
  it("generates unique tokens", () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
  });

  it("hashes deterministically (same input -> same hash)", () => {
    const token = generateRefreshToken();
    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
  });

  it("never stores the raw token as its own hash", () => {
    const token = generateRefreshToken();
    expect(hashRefreshToken(token)).not.toBe(token);
  });
});

describe("csrf tokens", () => {
  it("generates unique tokens", () => {
    expect(generateCsrfToken()).not.toBe(generateCsrfToken());
  });
});
