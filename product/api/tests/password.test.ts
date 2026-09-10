import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, isPasswordPolicyCompliant } from "../src/lib/password.js";

describe("password hashing", () => {
  it("hashes and verifies a matching password", async () => {
    const hash = await hashPassword("Str0ng!Passw0rd");
    await expect(verifyPassword(hash, "Str0ng!Passw0rd")).resolves.toBe(true);
  });

  it("rejects a non-matching password", async () => {
    const hash = await hashPassword("Str0ng!Passw0rd");
    await expect(verifyPassword(hash, "wrong-password")).resolves.toBe(false);
  });

  it("produces different hashes for the same password (unique salt)", async () => {
    const [a, b] = await Promise.all([hashPassword("Str0ng!Passw0rd"), hashPassword("Str0ng!Passw0rd")]);
    expect(a).not.toBe(b);
  });
});

describe("password policy", () => {
  it.each([
    ["Str0ng!Pass", true],
    ["Sh1!", false], // too short (under 8 chars)
    ["nouppercase1!", false],
    ["NOLOWERCASE1!", false],
    ["NoNumber!!", false],
    ["NoSpecial123", false],
  ])("%s -> %s", (candidate, expected) => {
    expect(isPasswordPolicyCompliant(candidate)).toBe(expected);
  });
});
