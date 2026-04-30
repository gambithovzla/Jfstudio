-- AlterTable: add depositPaid to Appointment
ALTER TABLE "Appointment" ADD COLUMN "depositPaid" BOOLEAN NOT NULL DEFAULT false;
