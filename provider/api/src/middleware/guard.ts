import { authenticate } from "./authenticate.js";
import { authorize } from "./authorize.js";
import type { ProviderRole } from "../generated/prisma/index.js";

// Mirrors product/api/src/middleware/guard.ts's requirePermission()
// composition exactly (authenticate() then authorize(...), in order —
// authorize() assumes req.providerUser is already set), adapted to this
// platform's flat role model instead of per-permission-key checks.
export function requireRole(...allowedRoles: ProviderRole[]) {
  return [authenticate, authorize(...allowedRoles)] as const;
}
