/**
 * Ejecutar una vez contra la BD de producción (solo servicios laceado; no toca staff ni inventario).
 *
 *   npx tsx scripts/ensure-laceado-services.ts
 *
 * con DATABASE_URL apuntando a producción, o en el panel del host: mismo comando tras deploy.
 */
import { PrismaClient } from "@prisma/client";

import { ensureLaceadoServiceVariants } from "../prisma/ensure-laceado-variants";

const prisma = new PrismaClient();

async function main() {
  await ensureLaceadoServiceVariants(prisma);
  console.log("Laceado: variantes y suplemento abundancia listos.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
