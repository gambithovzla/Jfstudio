/**
 * @deprecated Usa `npm run db:ensure-services` (incluye laceado + botox).
 */
import { PrismaClient } from "@prisma/client";

import { ensureBotoxServiceVariants } from "../prisma/ensure-botox-variants";
import { loadEnvFiles } from "./load-env";
import { resolveDatabaseUrlForLocalScript } from "./resolve-database-url";

loadEnvFiles();
resolveDatabaseUrlForLocalScript("db:ensure-botox");

const prisma = new PrismaClient();

async function main() {
  await ensureBotoxServiceVariants(prisma);
  console.log("Botox: variantes por largo de cabello listas.");
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
