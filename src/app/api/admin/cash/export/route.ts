import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { getCashReport } from "@/lib/data";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";

export const dynamic = "force-dynamic";

function escapeCsv(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const isRange = Boolean(from && to);
  const { payments, settings } = await getCashReport(isRange ? { from, to } : { date });

  const headers = ["Fecha", "Hora", "Cliente", "Telefono", "Estilista", "Servicios", "Metodo", "Monto"];
  const rows = payments.map((payment) => [
    formatDateInZone(payment.paidAt, settings.timezone),
    formatTimeInZone(payment.paidAt, settings.timezone),
    payment.appointment.client.name,
    payment.appointment.client.phone,
    payment.appointment.staff.name,
    payment.appointment.services.map((s) => s.serviceNameSnapshot).join(" / "),
    payment.method,
    Number(payment.amount).toFixed(2)
  ]);

  const csvLines = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  const bom = "﻿";
  const filename = isRange ? `caja_${from}_${to}.csv` : `caja_${date ?? "hoy"}.csv`;

  return new NextResponse(bom + csvLines, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
