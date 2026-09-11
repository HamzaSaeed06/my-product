import { PrismaClient } from "@prisma/client";
import { isProduction } from "../config/env.js";

// Single shared Prisma client. In dev with tsx watch, reuse across reloads
// via globalThis to avoid exhausting DB connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ["error", "warn"] : ["error", "warn", "query"],
    // Prisma's own default (5000ms) was observed expiring real, correct
    // interactive transactions (payments/service.ts's recordPayment, which
    // does several sequential round-trips) under this environment's
    // elevated network latency — see docs/PROJECT_STATUS.md §5a. Widening
    // this globally is the fix Prisma's own error message recommends; it
    // doesn't hide a genuinely stuck transaction, it just stops a slow-but-
    // correct one from being killed prematurely.
    transactionOptions: { timeout: 15000 },
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
