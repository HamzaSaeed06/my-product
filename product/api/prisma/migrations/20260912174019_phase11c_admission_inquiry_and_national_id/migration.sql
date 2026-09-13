-- CreateEnum
CREATE TYPE "AdmissionInquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED');

-- AlterTable
ALTER TABLE "parents" ADD COLUMN     "nationalId" TEXT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "nationalId" TEXT;

-- CreateTable
CREATE TABLE "admission_inquiries" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "classId" TEXT,
    "childName" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "parentEmail" TEXT,
    "source" TEXT,
    "status" "AdmissionInquiryStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "convertedStudentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admission_inquiries_convertedStudentId_key" ON "admission_inquiries"("convertedStudentId");

-- CreateIndex
CREATE INDEX "admission_inquiries_campusId_status_idx" ON "admission_inquiries"("campusId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "parents_nationalId_key" ON "parents"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "students_nationalId_key" ON "students"("nationalId");

-- AddForeignKey
ALTER TABLE "admission_inquiries" ADD CONSTRAINT "admission_inquiries_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_inquiries" ADD CONSTRAINT "admission_inquiries_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_inquiries" ADD CONSTRAINT "admission_inquiries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_inquiries" ADD CONSTRAINT "admission_inquiries_convertedStudentId_fkey" FOREIGN KEY ("convertedStudentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

