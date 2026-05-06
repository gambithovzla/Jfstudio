import { NextRequest } from "next/server";
import * as XLSX from "xlsx";

import { requireAdmin } from "@/lib/auth";
import { getCashReport } from "@/lib/data";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const isRange = Boolean(from && to);
  const { payments, settings } = await getCashReport(isRange ? { from, to } : { date });

  const periodo = isRange ? `${from} al ${to}` : (date ?? "Hoy");
  const totalGeneral = payments.reduce((s, p) => s + Number(p.amount), 0);

  // ── Resumen por método ────────────────────────────────────────────────────
  const byMethod = new Map<string, number>();
  for (const p of payments) {
    byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + Number(p.amount));
  }

  // ── Resumen por estilista ─────────────────────────────────────────────────
  const byStaff = new Map<string, { count: number; total: number }>();
  for (const p of payments) {
    const staffName = p.collectedByStaff?.name ?? p.appointment.staff.name;
    const prev = byStaff.get(staffName) ?? { count: 0, total: 0 };
    byStaff.set(staffName, { count: prev.count + 1, total: prev.total + Number(p.amount) });
  }

  const wb = XLSX.utils.book_new();

  // ═══════════════════════════════════════════════════════════
  // HOJA 1 — RESUMEN
  // ═══════════════════════════════════════════════════════════
  const summaryRows: (string | number)[][] = [
    ["JOHANNA FIGUEREDO STUDIO"],
    ["Reporte de Caja"],
    [`Período: ${periodo}`],
    [`Total de ingresos: S/ ${totalGeneral.toFixed(2)}`],
    [`Cantidad de cobros: ${payments.length}`],
    [],
    ["POR MÉTODO DE PAGO"],
    ["Método", "Total (S/)"],
    ...Array.from(byMethod.entries()).map(([m, t]) => [m, Number(t.toFixed(2))]),
    [],
    ["POR ESTILISTA"],
    ["Estilista", "N° Cobros", "Total (S/)"],
    ...Array.from(byStaff.entries()).map(([name, v]) => [name, v.count, Number(v.total.toFixed(2))]),
    [],
    ["Generado por JF Studio"]
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(summaryRows);
  wsResumen["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  // ═══════════════════════════════════════════════════════════
  // HOJA 2 — DETALLE DE PAGOS
  // ═══════════════════════════════════════════════════════════
  const headers = [
    "N°", "Fecha", "Hora", "Cliente", "Teléfono",
    "Estilista", "Servicio(s)", "Método de pago", "Monto (S/)"
  ];

  const rows = payments.map((p, i) => [
    i + 1,
    formatDateInZone(p.paidAt, settings.timezone),
    formatTimeInZone(p.paidAt, settings.timezone),
    p.appointment.client.name,
    p.appointment.client.phone ?? "",
    p.appointment.staff.name,
    p.appointment.services.map((s) => s.serviceNameSnapshot).join(" / "),
    p.method,
    Number(Number(p.amount).toFixed(2))
  ]);

  const totalRow = ["", "", "", "", "", "", "", "TOTAL", Number(totalGeneral.toFixed(2))];
  const wsDetalle = XLSX.utils.aoa_to_sheet([headers, ...rows, [], totalRow]);
  wsDetalle["!cols"] = [
    { wch: 5 }, { wch: 12 }, { wch: 8 }, { wch: 24 }, { wch: 14 },
    { wch: 18 }, { wch: 30 }, { wch: 16 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle");

  // ── Escribir buffer ───────────────────────────────────────────────────────
  const raw = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
  const buf = Buffer.from(raw);

  const filename = isRange
    ? `ReporteCaja_JFStudio_${from}_${to}.xlsx`
    : `ReporteCaja_JFStudio_${date ?? "hoy"}.xlsx`;

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
