import { AsyncLocalStorage } from "node:async_hooks";
import type { ActiveDelegation } from "./delegation.js";

interface RequestContext {
  activeDelegations: ActiveDelegation[];
}

const storage = new AsyncLocalStorage<RequestContext>();

// Set once per request, in authenticate.ts, right after req.user is known —
// makes an actor's currently-active delegations available to every
// downstream function that needs them (authorize.ts's permission union,
// scope.ts's getActorProfile role/campus widening, audit.ts's "acting via
// delegation" tagging) without threading `req` through call chains that
// today only carry a userId (most service functions, several layers below
// the controller). Empty outside a real request (a script or test calling
// a function directly) — callers must treat that as "no delegation known",
// never as an error.
export function runWithDelegationContext<T>(activeDelegations: ActiveDelegation[], fn: () => T): T {
  return storage.run({ activeDelegations }, fn);
}

export function getContextActiveDelegations(): ActiveDelegation[] {
  return storage.getStore()?.activeDelegations ?? [];
}
