-- CreateEnum
CREATE TYPE "StaffCheckInMethod" AS ENUM ('QR', 'MANUAL', 'REMOTE_APPROVED');

-- CreateEnum
CREATE TYPE "StaffCheckInVerifiedStatus" AS ENUM ('VERIFIED', 'UNVERIFIED', 'MANUAL_OVERRIDE');

-- CreateTable
CREATE TABLE "staff_attendances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL,
    "checkInMethod" "StaffCheckInMethod" NOT NULL,
    "verifiedStatus" "StaffCheckInVerifiedStatus" NOT NULL,
    "ipAddress" TEXT,
    "geoLat" DOUBLE PRECISION,
    "geoLng" DOUBLE PRECISION,
    "markedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_attendances_campusId_date_idx" ON "staff_attendances"("campusId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendances_userId_date_key" ON "staff_attendances"("userId", "date");

-- AddForeignKey
ALTER TABLE "staff_attendances" ADD CONSTRAINT "staff_attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendances" ADD CONSTRAINT "staff_attendances_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendances" ADD CONSTRAINT "staff_attendances_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

