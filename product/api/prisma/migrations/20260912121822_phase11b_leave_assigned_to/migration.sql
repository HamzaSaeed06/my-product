-- AlterTable
ALTER TABLE "leaves" ADD COLUMN     "assignedToId" TEXT;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
