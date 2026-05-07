-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DNI', 'CE', 'PASSPORT');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN "documentType" "DocumentType";

-- Backfill: existing clients with a dni number are assumed to be DNI
UPDATE "Client" SET "documentType" = 'DNI' WHERE "dni" IS NOT NULL;
