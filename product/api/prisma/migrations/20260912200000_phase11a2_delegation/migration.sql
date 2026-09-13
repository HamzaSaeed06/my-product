-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "viaDelegationId" TEXT;

-- CreateTable
CREATE TABLE "delegations" (
    "id" TEXT NOT NULL,
    "grantedByUserId" TEXT NOT NULL,
    "delegateToUserId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delegations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delegations_delegateToUserId_validFrom_validUntil_idx" ON "delegations"("delegateToUserId", "validFrom", "validUntil");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_viaDelegationId_fkey" FOREIGN KEY ("viaDelegationId") REFERENCES "delegations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_delegateToUserId_fkey" FOREIGN KEY ("delegateToUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

