import { PrismaClient } from "@prisma/client";
import { isProduction } from "../config/env.js";

// Single shared Prisma client. In dev with tsx watch, reuse across reloads
// via globalThis to avoid exhausting DB connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ["error", "warn"] : ["error", "warn", "query"],
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
