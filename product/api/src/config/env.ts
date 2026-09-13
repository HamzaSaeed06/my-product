import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET must be at least 32 characters"),
  // Phase 11 Phase A3 — HMACs the per-campus daily QR check-in token (see
  // lib/staffAttendanceQr.ts). Optional, falling back to JWT_ACCESS_SECRET,
  // for the same reason LICENSE_JWT is optional above: adding a new
  // *required* env var would break every existing deployment's .env at
  // boot. Production should set its own distinct value for proper key
  // separation between unrelated concerns (auth tokens vs. QR tokens).
  QR_ATTENDANCE_SECRET: z.string().min(32, "QR_ATTENDANCE_SECRET must be at least 32 characters").optional(),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(20),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  WEB_APP_ORIGIN: z.string().url().default("http://localhost:3000"),
  DOCUMENT_STORAGE_DIR: z.string().default("storage/documents"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(10),
  
  // Phase 10 (Provider Platform) license validation — both optional. A
  // deployment with neither set is treated as "not yet licensed" (a local/
  // dev instance that hasn't been issued one) and runs fully unrestricted,
  // per this session's own reasoning: it must never be the case that adding
  // license enforcement retroactively locks out every existing dev/test
  // environment that predates it. A LICENSE_JWT that IS present but fails
  // to verify (wrong key, tampered) is treated as invalid and fails closed
  // — see src/lib/license.ts.
  LICENSE_JWT: z.string().optional(),
  LICENSE_PUBLIC_KEY_B64: z.string().optional(),
  // Where this deployment sends its daily heartbeat — see
  // src/lib/heartbeatSender.ts. Optional for the same reason as above.
  PROVIDER_API_URL: z.string().url().default("http://localhost:4100"),
  DEPLOYMENT_HEARTBEAT_TOKEN: z.string().optional(),
  // PRODUCT_SPEC.md §2's own allowed cadence: "Daily (configurable: 6h,
  // 12h, 24h, 48h)". Enforced as an enum, not just "any positive number",
  // so a typo'd .env value fails loudly at boot instead of silently
  // spamming the provider every minute.
  HEARTBEAT_INTERVAL_HOURS: z.coerce
    .number()
    .int()
    .default(24)
    .refine((v) => [6, 12, 24, 48].includes(v), {
      message: "HEARTBEAT_INTERVAL_HOURS must be one of 6, 12, 24, 48",
    }),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed — check .env against .env.example");
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
