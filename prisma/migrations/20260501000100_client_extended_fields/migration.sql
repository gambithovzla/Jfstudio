-- AlterTable: make phone optional and add fields for client import
ALTER TABLE "Client" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "Client" ADD COLUMN "dni" TEXT;
ALTER TABLE "Client" ADD COLUMN "source" TEXT;
ALTER TABLE "Client" ADD COLUMN "firstVisitAt" TIMESTAMP(3);
