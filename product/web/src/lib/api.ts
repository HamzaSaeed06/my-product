// Server-only. This app never talks to the Express API directly from the
// browser — Server Actions and Server Components proxy the call and re-issue
// cookies on this app's own origin. See PROJECT_STATUS.md for why (avoids
// cross-origin cookie complexity now, and matches how this will actually be
// deployed: web + api behind the same reverse-proxied origin).
export const API_URL = process.env.API_URL ?? "http://localhost:4000";

// Mirrors product/api's ACCESS_TOKEN_TTL_MINUTES / REFRESH_TOKEN_TTL_DAYS
// defaults. A mismatch here isn't a security issue — worst case the
// browser-held cookie outlives the JWT (next request 401s, user is
// redirected to log in again) or expires slightly early (same outcome).
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 20 * 60;
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * The Express API returns session tokens only as Set-Cookie headers, never
 * in the JSON body (by design — see product/api's cookies.ts). To re-issue
 * them as this app's own cookies we only need the raw "name=value" pair;
 * we set our own httpOnly/sameSite/secure attributes on the Next.js side
 * rather than parsing Express's.
 */
export function parseCookiePairs(setCookieHeaders: string[]): Record<string, string> {
  const pairs: Record<string, string> = {};
  for (const header of setCookieHeaders) {
    const firstSegment = header.split(";", 1)[0];
    if (!firstSegment) continue;
    const eq = firstSegment.indexOf("=");
    if (eq === -1) continue;
    const name = firstSegment.slice(0, eq).trim();
    const value = firstSegment.slice(eq + 1).trim();
    if (name) pairs[name] = value;
  }
  return pairs;
}

// Mirrors product/api's PublicUser (auth/service.ts) — roles/teacherId/
// parentId/studentId drive Phase 7's role-based sidebar and portal
// routing.
export interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  teacherId: string | null;
  parentId: string | null;
  studentId: string | null;
}
