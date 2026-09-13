import type { Request } from "express";
import { prisma } from "./prisma.js";
import { getContextActiveDelegations } from "./requestContext.js";

export interface AuditEntry {
  actorId?: string | null;
  action: string; // e.g. "CREATE" | "UPDATE" | "APPROVE" | "REVERSE" | "VOID" | "LOGIN" | "LOGOUT"
  resource: string; // e.g. "User", "Session", "Result"
  recordId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  approvedBy?: string | null;
  ipAddress?: string | null;
  req?: Request;
}

// Secret fields that must never end up in oldValue/newValue, per
// PRODUCT_SPEC.md §8: "Audit log NEVER stores passwords, tokens, API keys."
const SECRET_KEYS = new Set([
  "password",
  "passwordHash",
  "refreshToken",
  "refreshTokenHash",
  "accessToken",
  "mfaSecret",
  "csrfToken",
]);

function redactSecrets(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SECRET_KEYS.has(key) ? "[REDACTED]" : redactSecrets(val);
    }
    return out;
  }
  return value;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  // Phase 11 Phase A2 — "non-negotiable for accountability": every action
  // taken while a delegation is active gets tagged, automatically, at this
  // single chokepoint (137 call sites across the codebase never need to
  // know about delegation at all). Sourced from request-scoped context, not
  // a fresh query — this function is called on effectively every write in
  // the app and must not add a per-call DB round trip for what's normally
  // an empty result.
  const [activeDelegation] = getContextActiveDelegations();

  await prisma.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      action: entry.action,
      resource: entry.resource,
      recordId: entry.recordId ?? null,
      oldValue: entry.oldValue !== undefined ? (redactSecrets(entry.oldValue) as object) : undefined,
      newValue: entry.newValue !== undefined ? (redactSecrets(entry.newValue) as object) : undefined,
      reason: entry.reason ?? null,
      approvedBy: entry.approvedBy ?? null,
      ipAddress: entry.ipAddress ?? entry.req?.ip ?? null,
      userAgent: entry.req?.get("user-agent") ?? null,
      viaDelegationId: activeDelegation?.id ?? null,
    },
  });
}
