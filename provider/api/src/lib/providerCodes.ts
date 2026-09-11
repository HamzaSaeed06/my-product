import { prisma } from "./prisma.js";

// Same "read the highest existing suffix + 1" approach as
// product/api's financeCodes.ts — no dedicated sequence table, a
// P2002-retry at the call site covers the rare concurrent-create race.
async function nextCode(prefix: string, findLastCode: (yearPrefix: string) => Promise<string | null>): Promise<string> {
  const yearPrefix = `${prefix}-${new Date().getFullYear()}-`;
  const last = await findLastCode(yearPrefix);
  const lastNumber = last ? parseInt(last.slice(yearPrefix.length), 10) : 0;
  const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  return `${yearPrefix}${String(next).padStart(6, "0")}`;
}

export function generateCustomerCode() {
  return nextCode("CUST", async (yearPrefix) => {
    const last = await prisma.customer.findFirst({
      where: { customerCode: { startsWith: yearPrefix } },
      orderBy: { customerCode: "desc" },
      select: { customerCode: true },
    });
    return last?.customerCode ?? null;
  });
}

export function generateLicenseNumber() {
  return nextCode("LIC", async (yearPrefix) => {
    const last = await prisma.license.findFirst({
      where: { licenseNumber: { startsWith: yearPrefix } },
      orderBy: { licenseNumber: "desc" },
      select: { licenseNumber: true },
    });
    return last?.licenseNumber ?? null;
  });
}

export function generateTicketNumber() {
  return nextCode("TCK", async (yearPrefix) => {
    const last = await prisma.supportTicket.findFirst({
      where: { ticketNumber: { startsWith: yearPrefix } },
      orderBy: { ticketNumber: "desc" },
      select: { ticketNumber: true },
    });
    return last?.ticketNumber ?? null;
  });
}
