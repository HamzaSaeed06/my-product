import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

// These limits are real anti-abuse controls (PRODUCT_SPEC.md §8 correction
// #15's per-IP login limit included) and stay fully enforced in
// development/production. In the integration test environment specifically,
// they're a pure artifact, not something under test: every rate limiter
// here is one shared in-memory store for the whole process (module-level
// singletons — a fresh `createApp()` per request, which the test helpers do
// use, does NOT get a fresh store), and the *only* reason these limits
// stayed clear of that shared bucket historically is that the real Neon
// database's own latency naturally spaced requests out past a minute. Once
// tests run against a fast local database (see docs/PROJECT_STATUS.md's
// entry on the local Postgres test setup), the exact same request pattern
// that always existed now arrives fast enough to legitimately trip these
// counters — an unrelated test's writes can 429 a completely different
// test's request. No test in this suite asserts a 429 from these three
// limiters (only login-identifier.test.ts avoids the login one
// defensively), so raising them in test mode changes no test's meaning —
// it just stops timing from being load-bearing for correctness.
const isTest = env.NODE_ENV === "test";

// PRODUCT_SPEC.md §8 correction #15: per-IP rate limiting instead of a naive
// per-account lockout, so an attacker can't lock out a legitimate user by
// deliberately failing their login (account-lockout DoS).
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isTest ? 10_000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "TOO_MANY_ATTEMPTS", message: "Too many login attempts — try again shortly" },
});

export const readRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isTest ? 10_000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isTest ? 10_000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
});
