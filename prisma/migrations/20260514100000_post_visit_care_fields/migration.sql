-- Cuidados post-visita (texto y adjunto opcional) enviados por correo a la clienta al completar la cita
ALTER TABLE "Appointment" ADD COLUMN "postVisitCareNote" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "postVisitAttachmentKey" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "postVisitAttachmentFilename" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "postVisitAttachmentMime" TEXT;
