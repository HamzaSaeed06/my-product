import { PrismaClient } from "../generated/prisma/index.js";
import { isProduction } from "../config/env.js";

const globalForPrisma = globalThis as unknown as { providerPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.providerPrisma ??
  new PrismaClient({
    log: isProduction ? ["error", "warn"] : ["error", "warn", "query"],
    transactionOptions: { timeout: 15000 },
  });

if (!isProduction) {
  globalForPrisma.providerPrisma = prisma;
}
