import type { PrismaClient } from "@prisma/client";

const STANDALONE_LACEADO = /^laceado\s+org[aá]nico$/i;
const LACEADO_ABUNDANCIA_NAME = "Laceado orgánico — suplemento abundancia";

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

/** Desactiva el suplemento por abundancia (ya no se ofrece). */
export async function deactivateLaceadoAbundanciaService(prisma: PrismaClient) {
  const row = await prisma.service.findUnique({
    where: { name: LACEADO_ABUNDANCIA_NAME },
    select: { id: true }
  });
  if (row) {
    await prisma.service.update({
      where: { id: row.id },
      data: { isActive: false }
    });
  }
}

/**
 * Idempotente: desactiva el laceado legacy y asegura variantes por largo de cabello.
 * Usar desde seed y desde `scripts/ensure-laceado-services.ts` (producción).
 */
export async function ensureLaceadoServiceVariants(prisma: PrismaClient) {
  await deactivateStandaloneLaceadoServices(prisma);
  await deactivateLaceadoAbundanciaService(prisma);

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
}
