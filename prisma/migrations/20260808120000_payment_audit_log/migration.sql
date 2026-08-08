-- Bitacora de correcciones de pagos (quien edito o elimino un cobro y que cambio)
CREATE TYPE "PaymentAuditAction" AS ENUM ('UPDATE', 'DELETE', 'REFUND');

CREATE TABLE "PaymentAuditLog" (
    "id" TEXT NOT NULL,
    "action" "PaymentAuditAction" NOT NULL,
    "paymentId" TEXT,
    "appointmentId" TEXT,
    "clientName" TEXT,
    "actorStaffId" TEXT,
    "actorName" TEXT NOT NULL,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "paidAt" TIMESTAMP(3),
    "beforeAmount" DECIMAL(10,2),
    "beforeMethod" TEXT,
    "beforeNote" TEXT,
    "afterAmount" DECIMAL(10,2),
    "afterMethod" TEXT,
    "afterNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentAuditLog_createdAt_idx" ON "PaymentAuditLog"("createdAt");
CREATE INDEX "PaymentAuditLog_appointmentId_idx" ON "PaymentAuditLog"("appointmentId");
CREATE INDEX "PaymentAuditLog_paidAt_idx" ON "PaymentAuditLog"("paidAt");
