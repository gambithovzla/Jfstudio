import { NextRequest } from "next/server";
import ExcelJS from "exceljs";

import { requireAdmin } from "@/lib/auth";
import { getCashReport } from "@/lib/data";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";

export const dynamic = "force-dynamic";

const DARK   = "FF1A1A1A";
const PINK   = "FFC4587A";
const GOLD   = "FFC9A96E";
const LGRAY  = "FFF2F2F2";
const WHITE  = "FFFFFFFF";

function hFill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}
function thinBorder(): Partial<ExcelJS.Borders> {
  const s: ExcelJS.BorderStyle = "thin";
  return { top: { style: s }, bottom: { style: s }, left: { style: s }, right: { style: s } };
}

export async function GET(request: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to   = searchParams.get("to") ?? undefined;

  const isRange = Boolean(from && to);
  const { payments, settings } = await getCashReport(isRange ? { from, to } : { date });

  const ruc         = process.env.SALON_RUC ?? "";
  const address     = process.env.SALON_ADDRESS ?? "Lima, Peru";
  const businessName = process.env.SALON_BUSINESS_NAME ?? "Johanna Figueredo Studio E.I.R.L.";
  const periodo   = isRange ? `${from} al ${to}` : (date ?? new Date().toISOString().slice(0, 10));
  const generado  = new Date().toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" });

  const totalGeneral = payments.reduce((s, p) => s + Number(p.amount), 0);

  const byMethod = new Map<string, number>();
  for (const p of payments) byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + Number(p.amount));

  const byStaff = new Map<string, { count: number; total: number }>();
  for (const p of payments) {
    const name = p.collectedByStaff?.name ?? p.appointment.staff.name;
    const prev = byStaff.get(name) ?? { count: 0, total: 0 };
    byStaff.set(name, { count: prev.count + 1, total: prev.total + Number(p.amount) });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "JF Studio";
  wb.created = new Date();

  // ═══════════════════════════════════════════════════════════
  // HOJA 1 — RESUMEN
  // ═══════════════════════════════════════════════════════════
  const ws1 = wb.addWorksheet("Resumen");
  ws1.columns = [
    { width: 34 }, { width: 18 }, { width: 18 }
  ];

  // Cabecera institucional
  const r1 = ws1.addRow([businessName.toUpperCase()]);
  ws1.mergeCells(`A${r1.number}:C${r1.number}`);
  r1.getCell(1).font  = { bold: true, size: 14, color: { argb: WHITE } };
  r1.getCell(1).fill  = hFill(DARK);
  r1.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  r1.height = 24;

  if (ruc) {
    const r2 = ws1.addRow([`RUC: ${ruc}   |   ${address}`]);
    ws1.mergeCells(`A${r2.number}:C${r2.number}`);
    r2.getCell(1).font  = { size: 10, color: { argb: WHITE } };
    r2.getCell(1).fill  = hFill(DARK);
    r2.getCell(1).alignment = { horizontal: "center" };
  }

  const rTit = ws1.addRow(["REPORTE DE CAJA"]);
  ws1.mergeCells(`A${rTit.number}:C${rTit.number}`);
  rTit.getCell(1).font  = { bold: true, size: 11, color: { argb: WHITE } };
  rTit.getCell(1).fill  = hFill(PINK);
  rTit.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  rTit.height = 20;

  const rPeriod = ws1.addRow([`Periodo: ${periodo}`]);
  ws1.mergeCells(`A${rPeriod.number}:C${rPeriod.number}`);
  rPeriod.getCell(1).font = { size: 10 };
  rPeriod.getCell(1).fill = hFill(LGRAY);
  rPeriod.getCell(1).alignment = { horizontal: "center" };

  const rGen = ws1.addRow([`Generado: ${generado}`]);
  ws1.mergeCells(`A${rGen.number}:C${rGen.number}`);
  rGen.getCell(1).font = { size: 9, italic: true, color: { argb: "FF666666" } };
  rGen.getCell(1).alignment = { horizontal: "center" };

  ws1.addRow([]);

  // Totales destacados
  const rTotalLabel = ws1.addRow(["TOTAL DE INGRESOS", payments.length + " cobros", totalGeneral]);
  rTotalLabel.getCell(1).font = { bold: true, size: 11, color: { argb: WHITE } };
  rTotalLabel.getCell(1).fill = hFill(GOLD);
  rTotalLabel.getCell(2).font = { bold: true, size: 11, color: { argb: WHITE } };
  rTotalLabel.getCell(2).fill = hFill(GOLD);
  rTotalLabel.getCell(2).alignment = { horizontal: "center" };
  rTotalLabel.getCell(3).font = { bold: true, size: 12, color: { argb: WHITE } };
  rTotalLabel.getCell(3).fill = hFill(GOLD);
  rTotalLabel.getCell(3).numFmt = '"S/"#,##0.00';
  rTotalLabel.getCell(3).alignment = { horizontal: "right" };
  rTotalLabel.height = 22;
  for (let c = 1; c <= 3; c++) rTotalLabel.getCell(c).border = thinBorder();

  ws1.addRow([]);

  // Bloque por método
  const rMH = ws1.addRow(["POR MÉTODO DE PAGO"]);
  ws1.mergeCells(`A${rMH.number}:C${rMH.number}`);
  rMH.getCell(1).font = { bold: true, size: 10, color: { argb: WHITE } };
  rMH.getCell(1).fill = hFill(PINK);
  rMH.getCell(1).alignment = { horizontal: "center" };

  const rMCols = ws1.addRow(["Método de pago", "", "Total (S/)"]);
  ws1.mergeCells(`A${rMCols.number}:B${rMCols.number}`);
  [1, 3].forEach((c) => {
    rMCols.getCell(c).font = { bold: true };
    rMCols.getCell(c).fill = hFill(LGRAY);
    rMCols.getCell(c).border = thinBorder();
    rMCols.getCell(c).alignment = { horizontal: c === 3 ? "right" : "left" };
  });

  Array.from(byMethod.entries()).forEach(([method, total]) => {
    const r = ws1.addRow([method, "", total]);
    ws1.mergeCells(`A${r.number}:B${r.number}`);
    r.getCell(1).border = thinBorder();
    r.getCell(3).numFmt = '"S/"#,##0.00';
    r.getCell(3).border = thinBorder();
    r.getCell(3).alignment = { horizontal: "right" };
  });

  ws1.addRow([]);

  // Bloque por estilista
  const rEH = ws1.addRow(["POR ESTILISTA"]);
  ws1.mergeCells(`A${rEH.number}:C${rEH.number}`);
  rEH.getCell(1).font = { bold: true, size: 10, color: { argb: WHITE } };
  rEH.getCell(1).fill = hFill(PINK);
  rEH.getCell(1).alignment = { horizontal: "center" };

  const rECols = ws1.addRow(["Estilista", "N° Cobros", "Total (S/)"]);
  [1, 2, 3].forEach((c) => {
    rECols.getCell(c).font = { bold: true };
    rECols.getCell(c).fill = hFill(LGRAY);
    rECols.getCell(c).border = thinBorder();
    rECols.getCell(c).alignment = { horizontal: c !== 1 ? "center" : "left" };
  });

  Array.from(byStaff.entries()).forEach(([name, v]) => {
    const r = ws1.addRow([name, v.count, v.total]);
    r.getCell(1).border = thinBorder();
    r.getCell(2).border = thinBorder();
    r.getCell(2).alignment = { horizontal: "center" };
    r.getCell(3).numFmt = '"S/"#,##0.00';
    r.getCell(3).border = thinBorder();
    r.getCell(3).alignment = { horizontal: "right" };
  });

  // ═══════════════════════════════════════════════════════════
  // HOJA 2 — DETALLE DE PAGOS
  // ═══════════════════════════════════════════════════════════
  const ws2 = wb.addWorksheet("Detalle de Ventas");
  ws2.columns = [
    { width: 5 },  // N°
    { width: 13 }, // Fecha
    { width: 8 },  // Hora
    { width: 26 }, // Cliente
    { width: 14 }, // Telefono
    { width: 20 }, // Estilista
    { width: 32 }, // Servicio(s)
    { width: 14 }, // Metodo
    { width: 13 }  // Monto
  ];

  // Cabecera hoja detalle
  const d1 = ws2.addRow([`${businessName.toUpperCase()} — REGISTRO DE VENTAS`]);
  ws2.mergeCells(`A${d1.number}:I${d1.number}`);
  d1.getCell(1).font  = { bold: true, size: 13, color: { argb: WHITE } };
  d1.getCell(1).fill  = hFill(DARK);
  d1.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  d1.height = 24;

  if (ruc) {
    const d2 = ws2.addRow([`RUC: ${ruc}   |   ${address}`]);
    ws2.mergeCells(`A${d2.number}:I${d2.number}`);
    d2.getCell(1).font  = { size: 9, color: { argb: WHITE } };
    d2.getCell(1).fill  = hFill(DARK);
    d2.getCell(1).alignment = { horizontal: "center" };
  }

  const d3 = ws2.addRow([`Periodo: ${periodo}   |   Generado: ${generado}   |   Total: S/ ${totalGeneral.toFixed(2)}   |   ${payments.length} comprobantes`]);
  ws2.mergeCells(`A${d3.number}:I${d3.number}`);
  d3.getCell(1).font = { size: 9, color: { argb: "FF444444" } };
  d3.getCell(1).fill = hFill(LGRAY);
  d3.getCell(1).alignment = { horizontal: "center" };

  ws2.addRow([]);

  // Encabezados de columna
  const headers = ["N°", "Fecha", "Hora", "Cliente", "Telefono", "Estilista", "Servicio(s)", "Metodo de pago", "Monto (S/)"];
  const hRow = ws2.addRow(headers);
  hRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
    cell.fill = hFill(DARK);
    cell.border = thinBorder();
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });
  hRow.height = 18;

  // Filas de datos
  payments.forEach((p, i) => {
    const isEven = i % 2 === 0;
    const r = ws2.addRow([
      i + 1,
      formatDateInZone(p.paidAt, settings.timezone),
      formatTimeInZone(p.paidAt, settings.timezone),
      p.appointment.client.name,
      p.appointment.client.phone ?? "",
      p.appointment.staff.name,
      p.appointment.services.map((s) => s.serviceNameSnapshot).join(" / "),
      p.method,
      Number(p.amount)
    ]);
    r.eachCell((cell, col) => {
      cell.fill = hFill(isEven ? WHITE : LGRAY);
      cell.border = thinBorder();
      cell.font = { size: 9 };
      if (col === 1) cell.alignment = { horizontal: "center" };
      if (col === 9) { cell.numFmt = '"S/"#,##0.00'; cell.alignment = { horizontal: "right" }; }
    });
  });

  // Fila total final
  ws2.addRow([]);
  const totalRow = ws2.addRow(["", "", "", "", "", "", "", "TOTAL PERIODO", totalGeneral]);
  totalRow.getCell(8).font = { bold: true, color: { argb: WHITE } };
  totalRow.getCell(8).fill = hFill(GOLD);
  totalRow.getCell(8).border = thinBorder();
  totalRow.getCell(8).alignment = { horizontal: "right" };
  totalRow.getCell(9).font = { bold: true, color: { argb: WHITE } };
  totalRow.getCell(9).fill = hFill(GOLD);
  totalRow.getCell(9).numFmt = '"S/"#,##0.00';
  totalRow.getCell(9).border = thinBorder();
  totalRow.getCell(9).alignment = { horizontal: "right" };
  totalRow.height = 18;

  // ── Serializar y enviar ───────────────────────────────────────────────────
  const rawBuffer = await wb.xlsx.writeBuffer();
  const buffer = Buffer.from(rawBuffer as ArrayBuffer);

  const filename = isRange
    ? `ReporteCaja_JFStudio_${from}_${to}.xlsx`
    : `ReporteCaja_JFStudio_${date ?? "hoy"}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
