/**
 * Asegura variantes de laceado y botox en la BD (idempotente).
 * Ejecutar manualmente tras deploy: npm run db:ensure-services
 * (o railway run npm run db:ensure-services)
 */
import { PrismaClient } from "@prisma/client";

import { ensureBotoxServiceVariants } from "../prisma/ensure-botox-variants";
import { ensureLaceadoServiceVariants } from "../prisma/ensure-laceado-variants";
import { loadEnvFiles } from "./load-env";
import { resolveDatabaseUrlForLocalScript } from "./resolve-database-url";

loadEnvFiles();
resolveDatabaseUrlForLocalScript("db:ensure-services");

if (!process.env.DATABASE_URL?.trim()) {
  console.error("[db:ensure-services] Falta DATABASE_URL.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  await ensureLaceadoServiceVariants(prisma);
  await ensureBotoxServiceVariants(prisma);
  console.log("Servicios: laceado y botox listos (sin suplemento abundancia).");
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
