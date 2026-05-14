import type { PrismaClient } from "@prisma/client";

const STANDALONE_LACEADO = /^laceado\s+org[aá]nico$/i;

/**
 * Desactiva cualquier servicio "Laceado … orgánico" sin variante de largo (evita sumar 300 + 400).
 */
export async function deactivateStandaloneLaceadoServices(prisma: PrismaClient) {
  const rows = await prisma.service.findMany({
    select: { id: true, name: true }
  });
  for (const row of rows) {
    if (STANDALONE_LACEADO.test(row.name.trim())) {
      await prisma.service.update({
        where: { id: row.id },
        data: { isActive: false }
      });
    }
  }
}

/**
 * Idempotente: desactiva el laceado legacy y asegura variantes + suplemento abundancia.
 * Usar desde seed y desde `scripts/ensure-laceado-services.ts` (producción).
 */
export async function ensureLaceadoServiceVariants(prisma: PrismaClient) {
  await deactivateStandaloneLaceadoServices(prisma);

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
