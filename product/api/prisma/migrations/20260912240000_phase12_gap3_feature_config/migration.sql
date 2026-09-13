-- CreateEnum
CREATE TYPE "FeatureConfigPolicyMode" AS ENUM ('MANDATORY', 'INSTITUTE_DEFAULT', 'CAMPUS_CONTROLLED');

-- AlterTable
ALTER TABLE "terminology_overrides" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "feature_configs" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "campusId" TEXT,
    "featureKey" TEXT NOT NULL,
    "policyMode" "FeatureConfigPolicyMode",
    "valueJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_configs_instituteId_campusId_featureKey_key" ON "feature_configs"("instituteId", "campusId", "featureKey");

-- AddForeignKey
ALTER TABLE "feature_configs" ADD CONSTRAINT "feature_configs_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_configs" ADD CONSTRAINT "feature_configs_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

