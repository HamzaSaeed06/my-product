import { env } from "../config/env.js";
import { sendHeartbeat } from "./heartbeatSender.js";

// PRODUCT_SPEC.md §2 "Heartbeat Mechanism": "Frequency: Daily (configurable:
// 6h, 12h, 24h, 48h) ... Asynchronous (runs in background job) ...
// Non-blocking (failure doesn't stop application)." The spec's own
// deployment architecture lists "Shared hosting" as a valid customer
// target, where cron/systemd-timer access can't be assumed — so the
// interval lives in-process instead: started once the server is listening,
// stopped on graceful shutdown. A deployment with no
// DEPLOYMENT_HEARTBEAT_TOKEN configured (not yet registered with a
// provider) never schedules anything — same permissive-by-default rule as
// license enforcement elsewhere, so a local/dev instance that predates
// having a provider account is never affected.
let intervalHandle: NodeJS.Timeout | null = null;
let inFlight = false;

async function runHeartbeat(): Promise<void> {
  if (inFlight) return; // guards a slow provider response outliving the interval, not expected to trigger in practice
  inFlight = true;
  try {
    const result = await sendHeartbeat();
    if (result.sent) {
      console.log(`[heartbeat] sent — ${result.response?.license.message ?? "ok"}`);
    } else {
      console.warn(`[heartbeat] not sent: ${result.reason}`);
    }
  } catch (err) {
    console.error("[heartbeat] threw unexpectedly (non-fatal):", err);
  } finally {
    inFlight = false;
  }
}

export function startHeartbeatScheduler(): void {
  if (!env.DEPLOYMENT_HEARTBEAT_TOKEN || intervalHandle) return;

  const intervalMs = env.HEARTBEAT_INTERVAL_HOURS * 60 * 60 * 1000;
  void runHeartbeat(); // report in on boot rather than waiting a full interval
  intervalHandle = setInterval(runHeartbeat, intervalMs);
  console.log(`[heartbeat] scheduler started — every ${env.HEARTBEAT_INTERVAL_HOURS}h`);
}

export function stopHeartbeatScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
