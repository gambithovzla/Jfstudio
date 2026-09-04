-- Cobros agregados a una cita ya completada (saldo pagado despues, cobro olvidado).
-- Solo se agrega el valor al enum; no se usa en esta misma migracion, asi que
-- Postgres lo acepta dentro de la transaccion de Prisma.
ALTER TYPE "PaymentAuditAction" ADD VALUE IF NOT EXISTS 'CREATE';
