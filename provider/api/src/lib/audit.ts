import type { Request } from "express";
import { prisma } from "./prisma.js";

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  resource: string;
  recordId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  ipAddress?: string | null;
  req?: Request;
}

const SECRET_KEYS = new Set(["password", "passwordHash", "refreshToken", "refreshTokenHash", "accessToken", "csrfToken", "signedJwt", "heartbeatToken"]);

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
  await prisma.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      action: entry.action,
      resource: entry.resource,
      recordId: entry.recordId ?? null,
      oldValue: entry.oldValue !== undefined ? (redactSecrets(entry.oldValue) as object) : undefined,
      newValue: entry.newValue !== undefined ? (redactSecrets(entry.newValue) as object) : undefined,
      reason: entry.reason ?? null,
      ipAddress: entry.ipAddress ?? entry.req?.ip ?? null,
      userAgent: entry.req?.get("user-agent") ?? null,
    },
  });
}
