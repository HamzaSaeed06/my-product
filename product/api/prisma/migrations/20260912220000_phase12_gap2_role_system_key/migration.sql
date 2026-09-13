-- Phase 12 Gap 2: Role.name becomes a free-editable display label; Role.systemKey
-- is the new stable identity authorization code keys off instead.

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "systemKey" TEXT;

-- Backfill the 7 known system roles' systemKey from their current name —
-- the last moment name and systemKey are guaranteed identical, since no
-- role has ever been renamed yet (the rename capability is what this very
-- migration enables). A custom, institute-defined role (if any exist)
-- correctly keeps systemKey NULL.
UPDATE "roles" SET "systemKey" = "name"
WHERE "name" IN ('SUPER_ADMIN', 'CAMPUS_HEAD', 'INCHARGE', 'OFFICE', 'TEACHER', 'PARENT', 'STUDENT');

-- CreateIndex
CREATE UNIQUE INDEX "roles_systemKey_key" ON "roles"("systemKey");
