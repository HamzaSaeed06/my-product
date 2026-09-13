import crypto from "node:crypto";
import { env } from "../config/env.js";

const SECRET = env.QR_ATTENDANCE_SECRET ?? env.JWT_ACCESS_SECRET;

// A per-campus token that rotates automatically once a day with no cron
// job or stored "current token" to regenerate — it's just an HMAC over the
// campus id and today's date, verified live the same way a JWT signature
// is. A stale screenshot of yesterday's QR code stops working on its own
// at midnight (server-local date, matching how the rest of this codebase
// already computes "today" — no institute-timezone-aware date math exists
// anywhere else in this app yet, so this doesn't invent a new convention
// just for itself).
function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getTodayQrToken(campusId: string): string {
  return crypto.createHmac("sha256", SECRET).update(`${campusId}|${todayDateString()}`).digest("hex").slice(0, 16);
}

export function verifyQrToken(campusId: string, token: string): boolean {
  const expected = getTodayQrToken(campusId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
