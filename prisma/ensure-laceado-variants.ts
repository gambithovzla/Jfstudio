import type { PrismaClient } from "@prisma/client";

/**
 * Idempotente: desactiva el laceado legacy y asegura variantes + suplemento abundancia.
 * Usar desde seed y desde `scripts/ensure-laceado-services.ts` (producción).
 */
export async function ensureLaceadoServiceVariants(prisma: PrismaClient) {
  await prisma.service.updateMany({
    where: { name: { in: ["Laceado organico", "Laceado orgánico"] } },
    data: { isActive: false }
  });

  const laceadoDeposit = { requiresDeposit: true, depositAmount: 50 };
  const laceadoDesc = "Alisado orgánico con productos profesionales. El largo se elige al reservar.";

  const laceadoLengthRows = [
    { name: "Laceado orgánico — cabello corto", price: 300, durationMinutes: 240 },
    { name: "Laceado orgánico — cabello medio", price: 350, durationMinutes: 240 },
    { name: "Laceado orgánico — cabello largo", price: 400, durationMinutes: 240 },
    { name: "Laceado orgánico — cabello extra largo", price: 500, durationMinutes: 240 }
  ];

  for (const row of laceadoLengthRows) {
    await prisma.service.upsert({
      where: { name: row.name },
      update: {
        ...laceadoDeposit,
        price: row.price,
        durationMinutes: row.durationMinutes,
        description: laceadoDesc,
        isActive: true
      },
      create: {
        name: row.name,
        description: laceadoDesc,
        durationMinutes: row.durationMinutes,
        price: row.price,
        ...laceadoDeposit
      }
    });
  }

  await prisma.service.upsert({
    where: { name: "Laceado orgánico — suplemento abundancia" },
    update: {
      ...laceadoDeposit,
      price: 80,
      durationMinutes: 30,
      description: "Extra por abundancia de cabello (solo junto a laceado orgánico).",
      isActive: true
    },
    create: {
      name: "Laceado orgánico — suplemento abundancia",
      description: "Extra por abundancia de cabello (solo junto a laceado orgánico).",
      durationMinutes: 30,
      price: 80,
      ...laceadoDeposit
    }
  });
}
