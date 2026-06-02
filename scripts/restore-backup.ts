/**
 * Restaura un respaldo JSON generado por la app (botón "Descargar respaldo (datos)" o el
 * correo automático) en la base de datos APUNTADA por DATABASE_URL.
 *
 * Pensado para reconstruir el negocio en una base NUEVA/VACÍA si Railway desaparece.
 *
 * Uso local (acepta .json o .json.gz):
 *   npm run db:restore -- C:\ruta\respaldo-jfstudio-2026-06-02.json.gz
 *
 * Apuntando a otra base (p. ej. un Postgres nuevo en otro proveedor):
 *   $env:DATABASE_URL = "postgresql://...nueva-base..."; npm run db:restore -- archivo.json.gz
 *
 * Por seguridad se niega a escribir sobre una base que ya tiene datos; usa --force para forzar.
 */
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

import { PrismaClient } from "@prisma/client";

import { loadEnvFiles } from "./load-env";
import { resolveDatabaseUrlForLocalScript } from "./resolve-database-url";
import { BACKUP_TABLES, type BackupTable } from "../src/lib/backup-tables";

loadEnvFiles();
resolveDatabaseUrlForLocalScript("restore-backup");

const prisma = new PrismaClient();

type BackupFile = {
  meta?: { format?: number; generatedAt?: string; tableCounts?: Record<string, number> };
  data?: Record<string, unknown[]>;
};

type CreateManyDelegate = {
  createMany: (args: { data: unknown[]; skipDuplicates?: boolean }) => Promise<{ count: number }>;
};

function maskUrl(u?: string): string {
  if (!u) return "(no definido)";
  try {
    const x = new URL(u);
    return `${x.protocol}//${x.username ? "***@" : ""}${x.host}${x.pathname}`;
  } catch {
    return "(no parseable)";
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    file: args.find((a) => !a.startsWith("--")),
    force: args.includes("--force")
  };
}

function readBackup(file: string): BackupFile {
  const raw = readFileSync(file);
  const text = file.endsWith(".gz") ? gunzipSync(raw).toString("utf8") : raw.toString("utf8");
  return JSON.parse(text) as BackupFile;
}

async function main() {
  const { file, force } = parseArgs();
  if (!file) {
    console.error("Uso: npm run db:restore -- <archivo.json|.json.gz> [--force]");
    process.exit(1);
  }

  console.log("Base de datos:", maskUrl(process.env.DATABASE_URL));
  console.log("Archivo:      ", file);

  const backup = readBackup(file);
  if (!backup.meta || !backup.data) {
    console.error("El archivo no parece un respaldo válido (falta meta o data).");
    process.exit(1);
  }
  console.log(`Respaldo: generado ${backup.meta.generatedAt ?? "?"} · formato ${backup.meta.format ?? "?"}`);

  const data = backup.data;

  // Salvaguarda: no escribir encima de una base con datos salvo --force.
  const [existingClients, existingAppointments] = await Promise.all([
    prisma.client.count(),
    prisma.appointment.count()
  ]);
  if ((existingClients > 0 || existingAppointments > 0) && !force) {
    console.error(
      `\n⚠️  La base de destino YA tiene datos (clientes: ${existingClients}, citas: ${existingAppointments}).` +
        `\n    Este comando está pensado para una base NUEVA/VACÍA.` +
        `\n    Si de verdad quieres insertar el respaldo encima, repite el comando con --force.\n`
    );
    process.exit(1);
  }

  // Todo o nada: si una tabla falla, no queda una restauración a medias.
  const results: { table: BackupTable; count: number }[] = [];
  await prisma.$transaction(
    async (tx) => {
      for (const table of BACKUP_TABLES) {
        const rows = data[table] ?? [];
        if (rows.length === 0) {
          results.push({ table, count: 0 });
          continue;
        }
        const delegate = tx[table as keyof typeof tx] as unknown as CreateManyDelegate;
        const { count } = await delegate.createMany({ data: rows, skipDuplicates: true });
        results.push({ table, count });
      }
    },
    { timeout: 5 * 60_000, maxWait: 30_000 }
  );

  console.log("\n=== Restauración terminada ===");
  let total = 0;
  for (const { table, count } of results) {
    total += count;
    const expected = backup.meta.tableCounts?.[table];
    const note = expected !== undefined && expected !== count ? `  (el respaldo tenía ${expected})` : "";
    console.log(`  ${table.padEnd(22)} ${String(count).padStart(6)}${note}`);
  }
  console.log(`\n✅ ${total} registros insertados.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("\n❌ Error en la restauración:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
