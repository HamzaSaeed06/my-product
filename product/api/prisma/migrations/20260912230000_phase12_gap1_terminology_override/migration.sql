-- Phase 12 Gap 1: generalizes the old fixed studentLabel/teacherLabel/
-- classLabel/sectionLabel columns on institute_settings into a proper
-- (instituteId, canonicalKey) -> label table covering any entity.

-- CreateTable
CREATE TABLE "terminology_overrides" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "singularLabel" TEXT NOT NULL,
    "pluralLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terminology_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "terminology_overrides_instituteId_canonicalKey_key" ON "terminology_overrides"("instituteId", "canonicalKey");

-- AddForeignKey
ALTER TABLE "terminology_overrides" ADD CONSTRAINT "terminology_overrides_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: carry forward any real customization on the 4 old
-- columns (i.e. anything that isn't still the plain English default) into
-- the new generic table before dropping them, so no admin's earlier
-- customization is silently lost.
INSERT INTO "terminology_overrides" ("id", "instituteId", "canonicalKey", "singularLabel", "pluralLabel", "createdAt", "updatedAt")
SELECT gen_random_uuid(), s."instituteId", 'STUDENT', s."studentLabel", s."studentLabel" || 's', now(), now()
FROM "institute_settings" s WHERE s."studentLabel" IS NOT NULL AND s."studentLabel" <> 'Student';

INSERT INTO "terminology_overrides" ("id", "instituteId", "canonicalKey", "singularLabel", "pluralLabel", "createdAt", "updatedAt")
SELECT gen_random_uuid(), s."instituteId", 'TEACHER', s."teacherLabel", s."teacherLabel" || 's', now(), now()
FROM "institute_settings" s WHERE s."teacherLabel" IS NOT NULL AND s."teacherLabel" <> 'Teacher';

INSERT INTO "terminology_overrides" ("id", "instituteId", "canonicalKey", "singularLabel", "pluralLabel", "createdAt", "updatedAt")
SELECT gen_random_uuid(), s."instituteId", 'CLASS', s."classLabel", s."classLabel" || 'es', now(), now()
FROM "institute_settings" s WHERE s."classLabel" IS NOT NULL AND s."classLabel" <> 'Class';

INSERT INTO "terminology_overrides" ("id", "instituteId", "canonicalKey", "singularLabel", "pluralLabel", "createdAt", "updatedAt")
SELECT gen_random_uuid(), s."instituteId", 'SECTION', s."sectionLabel", s."sectionLabel" || 's', now(), now()
FROM "institute_settings" s WHERE s."sectionLabel" IS NOT NULL AND s."sectionLabel" <> 'Section';

-- AlterTable
ALTER TABLE "institute_settings" DROP COLUMN "classLabel",
DROP COLUMN "sectionLabel",
DROP COLUMN "studentLabel",
DROP COLUMN "teacherLabel";
