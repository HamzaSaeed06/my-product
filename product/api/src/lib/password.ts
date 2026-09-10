import * as argon2 from "argon2";

// Argon2id per docs/PRODUCT_SPEC.md §8 Security Implementation Checklist
// ("Password hashing with Argon2id (preferred)").
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB, OWASP-recommended minimum for argon2id
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

export function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function isPasswordPolicyCompliant(plain: string): boolean {
  // Spec §8: min 8 chars, upper+lower+number+special.
  return PASSWORD_POLICY.test(plain);
}
