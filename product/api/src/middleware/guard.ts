import { authenticate } from "./authenticate.js";
import { authorize } from "./authorize.js";

// Convenience: authenticate() then authorize(permission), in order — every
// protected route needs both, and authorize() assumes req.user is already set.
export function requirePermission(permissionKey: string) {
  return [authenticate, authorize(permissionKey)] as const;
}
