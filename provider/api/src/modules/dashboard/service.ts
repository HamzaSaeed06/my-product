import { prisma } from "../../lib/prisma.js";
import { computeLicenseState } from "../../lib/license.js";

// Per spec's Dashboard screen: "Total customers, Active licenses,
// Expiring soon, Health status, Support tickets." Everything here is
// computed live, nothing cached.
export async function getDashboardSummary() {
  const [totalCustomers, activeCustomers, licenses, deployments, openTickets, ticketsByStatus] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { status: "ACTIVE" } }),
    prisma.license.findMany({ select: { status: true, expiresAt: true } }),
    prisma.deployment.groupBy({ by: ["healthStatus"], _count: true }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.supportTicket.groupBy({ by: ["status"], _count: true }),
  ]);

  const licenseStates = licenses.map((l) => computeLicenseState(l.status, l.expiresAt));
  const activeLicenses = licenseStates.filter((s) => s === "VALID" || s === "EXPIRING_SOON" || s === "EXPIRING_CRITICAL").length;
  const expiringSoon = licenseStates.filter((s) => s === "EXPIRING_SOON" || s === "EXPIRING_CRITICAL").length;
  const expiredGrace = licenseStates.filter((s) => s === "EXPIRED_GRACE").length;
  const expiredFinal = licenseStates.filter((s) => s === "EXPIRED_FINAL").length;

  return {
    customers: { total: totalCustomers, active: activeCustomers },
    licenses: { total: licenses.length, active: activeLicenses, expiringSoon, expiredGrace, expiredFinal },
    deploymentHealth: deployments.map((d) => ({ status: d.healthStatus, count: d._count })),
    support: { open: openTickets, byStatus: ticketsByStatus.map((t) => ({ status: t.status, count: t._count })) },
  };
}
