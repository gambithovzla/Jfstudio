-- Add birthday field to Client
ALTER TABLE "Client" ADD COLUMN "birthday" DATE;
CREATE INDEX "Client_birthday_idx" ON "Client"("birthday");

-- Add birthdayBonusId to Appointment
ALTER TABLE "Appointment" ADD COLUMN "birthdayBonusId" TEXT;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_birthdayBonusId_key" UNIQUE ("birthdayBonusId");

-- Create BirthdayBonusSettings singleton
CREATE TABLE "BirthdayBonusSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "discountPercent" INTEGER NOT NULL DEFAULT 15,
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "messageTemplate" TEXT NOT NULL DEFAULT 'Feliz cumpleanos, {nombre}! En JF Studio queremos celebrarte con un {descuento}% de descuento en tu proximo servicio. Tu codigo: {codigo}. Valido hasta {vence}.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BirthdayBonusSettings_pkey" PRIMARY KEY ("id")
);

-- Create BirthdayBonus table
CREATE TABLE "BirthdayBonus" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailSentAt" TIMESTAMP(3),
    "whatsappSentAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    CONSTRAINT "BirthdayBonus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BirthdayBonus_code_key" ON "BirthdayBonus"("code");
CREATE INDEX "BirthdayBonus_clientId_generatedAt_idx" ON "BirthdayBonus"("clientId", "generatedAt");
CREATE INDEX "BirthdayBonus_expiresAt_idx" ON "BirthdayBonus"("expiresAt");

-- Foreign keys
ALTER TABLE "BirthdayBonus" ADD CONSTRAINT "BirthdayBonus_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_birthdayBonusId_fkey"
    FOREIGN KEY ("birthdayBonusId") REFERENCES "BirthdayBonus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
