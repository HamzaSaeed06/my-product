import rateLimit from "express-rate-limit";

// PRODUCT_SPEC.md §8 correction #15: per-IP rate limiting instead of a naive
// per-account lockout, so an attacker can't lock out a legitimate user by
// deliberately failing their login (account-lockout DoS).
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "TOO_MANY_ATTEMPTS", message: "Too many login attempts — try again shortly" },
});

export const readRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
