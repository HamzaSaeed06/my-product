-- Phase 11 Phase D: Homework.documentId (single) -> HomeworkAttachment (one-to-many),
-- plus the new ClassDiaryEntry model.

-- CreateTable
CREATE TABLE "homework_attachments" (
    "id" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homework_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_diary_entries" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "subjectId" TEXT,
    "teacherId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_diary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "homework_attachments_documentId_key" ON "homework_attachments"("documentId");

-- CreateIndex
CREATE INDEX "homework_attachments_homeworkId_idx" ON "homework_attachments"("homeworkId");

-- CreateIndex
CREATE INDEX "class_diary_entries_sectionId_date_idx" ON "class_diary_entries"("sectionId", "date");

-- AddForeignKey
ALTER TABLE "homework_attachments" ADD CONSTRAINT "homework_attachments_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_attachments" ADD CONSTRAINT "homework_attachments_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_diary_entries" ADD CONSTRAINT "class_diary_entries_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_diary_entries" ADD CONSTRAINT "class_diary_entries_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_diary_entries" ADD CONSTRAINT "class_diary_entries_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data migration: carry forward any existing single-document homework
-- attachments into the new join table before dropping the old column.
-- (Checked live: 0 rows currently have a documentId, but this keeps the
-- migration correct/replayable regardless of when it runs.)
INSERT INTO "homework_attachments" ("id", "homeworkId", "documentId", "createdAt")
SELECT gen_random_uuid(), "id", "documentId", CURRENT_TIMESTAMP
FROM "homework"
WHERE "documentId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "homework" DROP CONSTRAINT "homework_documentId_fkey";

-- DropIndex
DROP INDEX "homework_documentId_key";

-- AlterTable
ALTER TABLE "homework" DROP COLUMN "documentId";
