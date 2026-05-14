-- Migrar citas marcadas como NO_SHOW a canceladas
UPDATE "Appointment" SET status = 'CANCELED' WHERE status = 'NO_SHOW';

-- Reemplazar enum AppointmentStatus sin NO_SHOW
CREATE TYPE "AppointmentStatus_new" AS ENUM ('CONFIRMED', 'COMPLETED', 'CANCELED');

ALTER TABLE "Appointment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Appointment" ALTER COLUMN "status" TYPE "AppointmentStatus_new" USING ("status"::text::"AppointmentStatus_new");

DROP TYPE "AppointmentStatus";
ALTER TYPE "AppointmentStatus_new" RENAME TO "AppointmentStatus";

ALTER TABLE "Appointment" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED'::"AppointmentStatus";

-- Testimonios públicos (aprobación admin)
CREATE TYPE "TestimonialStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "ClientTestimonial" (
    "id" TEXT NOT NULL,
    "authorName" TEXT,
    "body" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 5,
    "status" "TestimonialStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ClientTestimonial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientTestimonial_status_createdAt_idx" ON "ClientTestimonial"("status", "createdAt");
