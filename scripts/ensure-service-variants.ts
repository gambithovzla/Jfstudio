/**
 * Asegura variantes de laceado y botox en la BD (idempotente).
 * Se ejecuta en deploy (build) y manualmente con: npm run db:ensure-services
 */
import { PrismaClient } from "@prisma/client";

import { ensureBotoxServiceVariants } from "../prisma/ensure-botox-variants";
import { ensureLaceadoServiceVariants } from "../prisma/ensure-laceado-variants";
import { loadEnvFiles } from "./load-env";
import { resolveDatabaseUrlForLocalScript } from "./resolve-database-url";

loadEnvFiles();
resolveDatabaseUrlForLocalScript("db:ensure-services");

const deployOnly = process.argv.includes("--deploy");
const isRailway = Boolean(process.env.RAILWAY_ENVIRONMENT?.trim());

if (deployOnly && !isRailway) {
  console.log("[db:ensure-services] Omitido fuera de Railway (deploy local sin BD).");
  process.exit(0);
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error("[db:ensure-services] Falta DATABASE_URL.");
  process.exit(deployOnly ? 0 : 1);
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
