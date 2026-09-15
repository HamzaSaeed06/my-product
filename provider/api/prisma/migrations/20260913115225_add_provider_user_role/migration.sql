-- CreateEnum
CREATE TYPE "ProviderRole" AS ENUM ('ADMIN', 'SUPPORT_READ_ONLY');

-- AlterTable
ALTER TABLE "provider_users" ADD COLUMN     "role" "ProviderRole" NOT NULL DEFAULT 'ADMIN';
