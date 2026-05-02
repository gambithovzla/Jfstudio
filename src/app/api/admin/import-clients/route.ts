import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function excelDateToJS(serial: unknown): Date | null {
  if (!serial || typeof serial !== "number") return null;
  const utcDays = Math.floor(serial - 25569);
  return new Date(utcDays * 86400 * 1000);
}

function cleanPhone(raw: unknown): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length < 6) return null;
  return digits;
}

function titleCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function nullIfEmpty(val: unknown): string | null {
  if (!val) return null;
  const s = String(val).trim();
  if (!s || s.toLowerCase() === "null") return null;
  return s;
}

type Row = Record<string, unknown>;

export async function POST(request: NextRequest) {
  await requireAdmin();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(ws);

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const nombre = titleCase(String(row["Nombre"] || "").trim());
    const apellido = titleCase(String(row["Apellido "] || "").trim());
    const fullName = [nombre, apellido].filter(Boolean).join(" ");

    if (!fullName) { skipped++; continue; }

    const phone = cleanPhone(row["Nro. de telefono"]);
    const email = nullIfEmpty(String(row["Correo Electronico"] || "").toLowerCase());
    const dni = nullIfEmpty(row["DNI"]);
    const rawSource = nullIfEmpty(row["Empresa"]);
    const source = rawSource ? titleCase(rawSource) : null;
    const firstVisitAt = excelDateToJS(row["Primera vez que nos visito"]);

    const servicio = nullIfEmpty(row["Servicio "]);
    const costo = row["Costo"];
    const fecha = excelDateToJS(row["Fecha"]);

    let notes: string | null = null;
    if (servicio) {
      let note = `Ultimo servicio: ${servicio}`;
      if (costo) note += ` (S/ ${costo})`;
      if (fecha) note += ` — ${fecha.toISOString().slice(0, 10)}`;
      notes = note;
    }

    try {
      if (phone) {
        const existing = await prisma.client.findUnique({ where: { phone } });
        if (existing) { skipped++; continue; }
      }

      await prisma.client.create({
        data: { name: fullName, phone, email, dni, source, notes, firstVisitAt }
      });
      imported++;
    } catch (err) {
      errors.push(`${fullName}: ${err instanceof Error ? err.message : "error"}`);
    }
  }

  return NextResponse.json({ imported, skipped, errors });
}
