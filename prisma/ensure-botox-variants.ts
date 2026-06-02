import type { PrismaClient } from "@prisma/client";

const STANDALONE_BOTOX = /^botox\s+org[aá]nico$/i;

/**
 * Desactiva cualquier servicio "Botox … orgánico" sin variante de largo.
 */
export async function deactivateStandaloneBotoxServices(prisma: PrismaClient) {
  const rows = await prisma.service.findMany({
    select: { id: true, name: true }
  });
  for (const row of rows) {
    if (STANDALONE_BOTOX.test(row.name.trim())) {
      await prisma.service.update({
        where: { id: row.id },
        data: { isActive: false }
      });
    }
  }
}

/**
 * Idempotente: desactiva el botox legacy y asegura variantes por largo de cabello.
 */
export async function ensureBotoxServiceVariants(prisma: PrismaClient) {
  await deactivateStandaloneBotoxServices(prisma);

  const botoxDeposit = { requiresDeposit: true, depositAmount: 50 };
  const botoxDesc = "Tratamiento botox orgánico. El largo se elige al reservar.";

  const botoxLengthRows = [
    { name: "Botox orgánico — cabello corto", price: 210, durationMinutes: 120 },
    { name: "Botox orgánico — cabello medio", price: 250, durationMinutes: 180 },
    { name: "Botox orgánico — cabello largo", price: 250, durationMinutes: 240 },
    { name: "Botox orgánico — cabello extra largo", price: 300, durationMinutes: 240 }
  ];

  for (const row of botoxLengthRows) {
    await prisma.service.upsert({
      where: { name: row.name },
      update: {
        ...botoxDeposit,
        price: row.price,
        durationMinutes: row.durationMinutes,
        description: botoxDesc,
        isActive: true
      },
      create: {
        name: row.name,
        description: botoxDesc,
        durationMinutes: row.durationMinutes,
        price: row.price,
        ...botoxDeposit
      }
    });
  }
}
