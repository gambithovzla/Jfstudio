-- Adelanto web: comprobante en almacenamiento externo (S3-compatible)
ALTER TABLE "Appointment" ADD COLUMN "depositAmountPen" DECIMAL(10,2);
ALTER TABLE "Appointment" ADD COLUMN "depositVoucherKey" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "depositVoucherFilename" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "depositVoucherMime" TEXT;
