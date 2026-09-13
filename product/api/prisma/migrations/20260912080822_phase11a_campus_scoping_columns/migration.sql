/*
  Warnings:

  - Added the required column `campusId` to the `complaints` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "approval_requests" ADD COLUMN     "campusId" TEXT;

-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "campusId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "fee_structures" ADD COLUMN     "campusId" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "campusId" TEXT;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
