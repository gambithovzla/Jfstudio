/**
 * Ejecutar una vez contra la BD de producción (solo servicios laceado; no toca staff ni inventario).
 *
 *   npx tsx scripts/ensure-laceado-services.ts
 *
 * Desde tu PC con `railway run`: si DATABASE_URL usa `*.railway.internal`, no conectará.
 * Usa la URL pública del Postgres (TCP proxy) o define DATABASE_PUBLIC_URL y se usará sola.
 */
import { PrismaClient } from "@prisma/client";

import { ensureLaceadoServiceVariants } from "../prisma/ensure-laceado-variants";

function resolveDatabaseUrlForLocalScript(): void {
  const internal = process.env.DATABASE_URL ?? "";
  const pub = process.env.DATABASE_PUBLIC_URL?.trim();

  if (!internal.includes(".railway.internal")) return;

  if (pub) {
    process.env.DATABASE_URL = pub;
    console.warn("[db:ensure-laceado] Usando DATABASE_PUBLIC_URL (el host .railway.internal no es alcanzable desde tu PC).\n");
    return;
  }

  console.error(`
[db:ensure-laceado] No se puede usar DATABASE_URL con host .railway.internal desde tu ordenador.

Haz UNA de estas:

  A) Railway → servicio Postgres → pestaña "Connect" / "Data" → copia la URL PUBLICA (TCP Proxy).
     En PowerShell:
       $env:DATABASE_URL = "postgresql://...copiada..."
       npm run db:ensure-laceado

  B) En Railway, en el servicio de la APP (Jfstudio): agrega variable DATABASE_PUBLIC_URL
     (referencia la variable publica del Postgres) y vuelve a ejecutar:
       railway run npm run db:ensure-laceado
`);
  process.exit(1);
}

resolveDatabaseUrlForLocalScript();

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
