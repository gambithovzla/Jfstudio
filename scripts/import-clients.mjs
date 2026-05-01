/**
 * Import clients from the Excel spreadsheet into the database.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/import-clients.mjs
 *
 * Requires: xlsx (devDependency), @prisma/client
 * The Excel file must be at public/Base de Clientes JF.xlsx
 */

import { PrismaClient } from "@prisma/client";
import XLSX from "xlsx";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXCEL_PATH = resolve(__dirname, "../public/Base de Clientes JF.xlsx");

const prisma = new PrismaClient();

function excelDateToJS(serial) {
  if (!serial || typeof serial !== "number") return null;
  const utcDays = Math.floor(serial - 25569);
  return new Date(utcDays * 86400 * 1000);
}

function cleanPhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length < 6) return null;
  return digits;
}

function titleCase(str) {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function main() {
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const nombre = titleCase(String(row["Nombre"] || "").trim());
    const apellido = titleCase(String(row["Apellido "] || "").trim());
    const fullName = [nombre, apellido].filter(Boolean).join(" ");

    if (!fullName) {
      skipped++;
      continue;
    }

    const phone = cleanPhone(row["Nro. de telefono"]);
    const rawEmail = String(row["Correo Electronico"] || "").trim().toLowerCase();
    const email = rawEmail && rawEmail !== "null" ? rawEmail : null;
    const rawDni = row["DNI"] ? String(row["DNI"]).trim() : null;
    const dni = rawDni && rawDni !== "null" ? rawDni : null;
    const rawSource = String(row["Empresa"] || "").trim();
    const source = rawSource && rawSource.toLowerCase() !== "null" ? titleCase(rawSource) : null;
    const firstVisitAt = excelDateToJS(row["Primera vez que nos visito"]);

    const servicio = String(row["Servicio "] || "").trim();
    const costo = row["Costo"];
    const fecha = excelDateToJS(row["Fecha"]);

    const noteParts = [];
    if (servicio) {
      let note = `Ultimo servicio: ${servicio}`;
      if (costo) note += ` (S/ ${costo})`;
      if (fecha) note += ` — ${fecha.toISOString().slice(0, 10)}`;
      noteParts.push(note);
    }
    const notes = noteParts.length > 0 ? noteParts.join("\n") : null;

    try {
      if (phone) {
        const existing = await prisma.client.findUnique({ where: { phone } });
        if (existing) {
          console.log(`  SKIP (phone exists): ${fullName} — ${phone}`);
          skipped++;
          continue;
        }
      }

      await prisma.client.create({
        data: {
          name: fullName,
          phone,
          email,
          dni,
          source,
          notes,
          firstVisitAt,
        },
      });
      imported++;
      console.log(`  OK: ${fullName}`);
    } catch (err) {
      errors++;
      console.error(`  ERROR: ${fullName} — ${err.message}`);
    }
  }

  console.log(`\nDone: ${imported} imported, ${skipped} skipped, ${errors} errors`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
