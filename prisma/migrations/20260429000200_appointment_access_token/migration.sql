-- AlterTable: add accessToken and reminderSentAt to Appointment
ALTER TABLE "Appointment" ADD COLUMN "accessToken" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- Backfill accessToken for existing rows
UPDATE "Appointment" SET "accessToken" = gen_random_uuid()::text WHERE "accessToken" IS NULL;

-- Make accessToken NOT NULL and add unique constraint
ALTER TABLE "Appointment" ALTER COLUMN "accessToken" SET NOT NULL;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_accessToken_key" UNIQUE ("accessToken");
