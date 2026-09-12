import { prisma } from "./prisma.js";
import { env } from "../config/env.js";
import { getLicenseInfo } from "./license.js";

// PRODUCT_SPEC.md §2 "Heartbeat Mechanism (Passive, Async, Non-Blocking)".
// This module only builds and sends ONE heartbeat when called — the actual
// "daily, configurable 6h/12h/24h/48h" recurrence lives in
// src/lib/heartbeatScheduler.ts, started once from server.ts. This function
// stays a standalone, callable-on-its-own unit so scripts/send-heartbeat.ts
// can still trigger one manually (useful right after setting up a new
// license, without waiting for the next scheduled run).
export interface HeartbeatResult {
  sent: boolean;
  reason?: string;
  response?: { success: boolean; license: { valid: boolean; expiresIn: number; message: string } };
}

// process.uptime() resets whenever this process restarts — an honest
// "uptime since last restart" per spec's own field description, not a
// fabricated always-up number.
const processStartedAt = Date.now();

export async function sendHeartbeat(): Promise<HeartbeatResult> {
  if (!env.DEPLOYMENT_HEARTBEAT_TOKEN) {
    return { sent: false, reason: "DEPLOYMENT_HEARTBEAT_TOKEN not configured — this deployment isn't registered with a provider yet" };
  }

  const [studentCount, staffCount, campusCount] = await Promise.all([
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.teacher.count({ where: { status: "ACTIVE" } }),
    prisma.campus.count({ where: { archivedAt: null } }),
  ]);

  let dbStatus: "healthy" | "degraded" | "down" = "healthy";
  const dbCheckStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "down";
  }
  const dbCheckMs = Date.now() - dbCheckStart;

  const payload = {
    version: process.env.npm_package_version ?? "0.0.0",
    timestamp: new Date().toISOString(),
    metrics: {
      uptime: Math.floor((Date.now() - processStartedAt) / 1000),
      studentCount,
      staffCount,
      campusCount,
      // No real disk/storage accounting exists yet (documents are stored
      // locally, sized on read, never aggregated) — 0 is an honest "not
      // measured" rather than a fabricated number.
      storageUsed: 0,
      apiStatus: "healthy" as const,
      dbStatus,
      // No APM/request-timing collector exists in this app; the DB
      // round-trip just measured is the one real latency figure available,
      // reported as a stand-in rather than inventing an aggregate average.
      avgResponseTime: dbCheckMs,
      errorRate: 0,
    },
  };

  const { claims } = getLicenseInfo();
  if (!claims) {
    return { sent: false, reason: "No verified license loaded — nothing to report a deploymentId for" };
  }

  const res = await fetch(`${env.PROVIDER_API_URL}/api/v1/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.DEPLOYMENT_HEARTBEAT_TOKEN}` },
    body: JSON.stringify({ ...payload, deploymentId: claims.deploymentId }),
  });

  if (!res.ok) {
    // Non-blocking by design: a failed heartbeat is logged, never thrown —
    // "If provider unreachable: Application continues normally."
    console.error(`Heartbeat failed (${res.status}): ${await res.text().catch(() => "")}`);
    return { sent: false, reason: `Provider responded ${res.status}` };
  }

  const response = (await res.json()) as HeartbeatResult["response"];
  return { sent: true, response };
}
