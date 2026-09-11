import { prisma } from "../../lib/prisma.js";
import { computeLicenseState } from "../../lib/license.js";

export interface HeartbeatInput {
  deploymentId: string;
  version: string;
  metrics: {
    uptime: number;
    studentCount: number;
    staffCount: number;
    campusCount: number;
    storageUsed: number;
    apiStatus: string;
    dbStatus: string;
    avgResponseTime: number;
    errorRate: number;
  };
}

// spec's health-status vocabulary is deployment-level (healthy | degraded |
// down); derive it from what the deployment itself reported rather than
// inventing a second classification.
function deriveHealthStatus(apiStatus: string, dbStatus: string): "HEALTHY" | "DEGRADED" | "DOWN" {
  if (apiStatus === "down" || dbStatus === "down") return "DOWN";
  if (apiStatus === "degraded" || dbStatus === "degraded") return "DEGRADED";
  return "HEALTHY";
}

export async function recordHeartbeat(deploymentId: string, input: HeartbeatInput) {
  const healthStatus = deriveHealthStatus(input.metrics.apiStatus, input.metrics.dbStatus);

  const [, deployment] = await prisma.$transaction([
    prisma.healthCheck.create({
      data: {
        deploymentId,
        version: input.version,
        uptimeSeconds: input.metrics.uptime,
        studentCount: input.metrics.studentCount,
        staffCount: input.metrics.staffCount,
        campusCount: input.metrics.campusCount,
        storageUsedMb: input.metrics.storageUsed,
        apiStatus: input.metrics.apiStatus,
        dbStatus: input.metrics.dbStatus,
        avgResponseTimeMs: input.metrics.avgResponseTime,
        errorRatePercent: input.metrics.errorRate,
      },
    }),
    prisma.deployment.update({
      where: { id: deploymentId },
      data: { version: input.version, healthStatus, lastCheckInAt: new Date() },
    }),
  ]);

  // Spec's heartbeat response reports validity of the license currently
  // tied to this deployment — the most recently issued one, matching
  // "generate a new license -> customer updates env var -> heartbeats
  // against the new one from then on."
  const license = await prisma.license.findFirst({
    where: { deploymentId },
    orderBy: { createdAt: "desc" },
  });

  if (!license) {
    return { valid: false, expiresIn: 0, message: "No license on file for this deployment" };
  }

  const state = computeLicenseState(license.status, license.expiresAt);
  const valid = state !== "REVOKED" && state !== "SUSPENDED" && state !== "EXPIRED_FINAL";
  const expiresInSeconds = Math.max(0, Math.floor((license.expiresAt.getTime() - Date.now()) / 1000));

  return { valid, expiresIn: expiresInSeconds, message: `License ${state}`, deployment };
}
