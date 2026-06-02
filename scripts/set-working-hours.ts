/**
 * Fija la hora de ENTRADA del horario laboral de todo el staff:
 *   Lunes a viernes -> 08:00 (entrada)
 *   Sabado y domingo -> 07:00 (entrada)
 *   Domingo -> fin 09:00 (ventana especial; el resto lo gobierna booking-rules.ts)
 *
 * Idempotente. NO toca citas agendadas (solo la plantilla WorkingHour).
 * No modifica la hora de salida (endTime) ni los descansos.
 *
 * Uso local:        npm run db:set-hours
 * Uso produccion:   $env:DATABASE_URL = "postgresql://...url-publica-railway..."; npm run db:set-hours
 */
import { PrismaClient } from "@prisma/client";

import { loadEnvFiles } from "./load-env";
import { resolveDatabaseUrlForLocalScript } from "./resolve-database-url";

loadEnvFiles();
resolveDatabaseUrlForLocalScript("set-working-hours");

const prisma = new PrismaClient();
const DAYS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

function maskUrl(u?: string) {
  if (!u) return "(no definido)";
  try {
    const x = new URL(u);
    return `${x.protocol}//${x.username ? "***@" : ""}${x.host}${x.pathname}`;
  } catch {
    return "(no parseable)";
  }
}

async function show(label: string) {
  const rows = await prisma.workingHour.findMany({
    include: { staff: { select: { name: true } } },
    orderBy: [{ staff: { name: "asc" } }, { dayOfWeek: "asc" }]
  });
  console.log(`\n=== ${label} (${rows.length} filas) ===`);
  for (const r of rows) {
    console.log(
      `${r.staff.name.padEnd(16)} | ${DAYS[r.dayOfWeek]} | ${r.startTime}-${r.endTime} | activo:${r.isActive}`
    );
  }
}

async function main() {
  console.log("Base de datos:", maskUrl(process.env.DATABASE_URL));
  await show("ANTES");

  const semana = await prisma.workingHour.updateMany({
    where: { dayOfWeek: { in: [1, 2, 3, 4, 5] } },
    data: { startTime: "08:00" }
  });
  const finde = await prisma.workingHour.updateMany({
    where: { dayOfWeek: { in: [0, 6] } },
    data: { startTime: "07:00" }
  });
  // Domingo: la ventana real es 07:00-09:00 (constante en booking-rules.ts). Alineamos el fin mostrado.
  const domingoFin = await prisma.workingHour.updateMany({
    where: { dayOfWeek: 0 },
    data: { endTime: "09:00" }
  });

  console.log(
    `\nLun-Vie -> 08:00: ${semana.count} | Sab-Dom entrada -> 07:00: ${finde.count} | Dom fin -> 09:00: ${domingoFin.count}`
  );

  await show("DESPUES");
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
