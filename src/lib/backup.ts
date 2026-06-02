import { gzipSync } from "node:zlib";

import { Prisma } from "@prisma/client";
import ExcelJS from "exceljs";

import { BACKUP_TABLES, type BackupTable } from "./backup-tables";
import { prisma } from "./prisma";

export { BACKUP_TABLES, type BackupTable };

/**
 * Respaldo completo de la base de datos en JSON (restaurable) y un Excel legible.
 *
 * El JSON es la copia "de verdad": contiene todas las tablas tal cual, pensado para
 * reconstruir la base en otro proveedor con `npm run db:restore`. El Excel es solo para
 * consultar a ojo (clientes, citas, pagos); no sirve para restaurar.
 */

/** Versión del formato del archivo; subir si cambia la forma del JSON. */
export const BACKUP_FORMAT_VERSION = 1;

/** Lectores por tabla (type-safe; obliga a registrar cada modelo nuevo aquí). */
const TABLE_READERS: Record<BackupTable, () => Promise<unknown[]>> = {
  salonSettings: () => prisma.salonSettings.findMany(),
  birthdayBonusSettings: () => prisma.birthdayBonusSettings.findMany(),
  paymentMethodConfig: () => prisma.paymentMethodConfig.findMany(),
  clientTestimonial: () => prisma.clientTestimonial.findMany(),
  landingGalleryImage: () => prisma.landingGalleryImage.findMany(),
  staff: () => prisma.staff.findMany(),
  workingHour: () => prisma.workingHour.findMany(),
  client: () => prisma.client.findMany(),
  service: () => prisma.service.findMany(),
  product: () => prisma.product.findMany(),
  serviceProduct: () => prisma.serviceProduct.findMany(),
  birthdayBonus: () => prisma.birthdayBonus.findMany(),
  appointment: () => prisma.appointment.findMany(),
  appointmentService: () => prisma.appointmentService.findMany(),
  payment: () => prisma.payment.findMany(),
  inventoryMovement: () => prisma.inventoryMovement.findMany(),
  timeBlock: () => prisma.timeBlock.findMany()
};

export type BackupFile = {
  meta: {
    format: number;
    app: string;
    generatedAt: string;
    tableCounts: Record<string, number>;
  };
  data: Record<string, unknown[]>;
};

/** Lee todas las tablas (solo campos escalares y llaves foráneas, sin relaciones anidadas). */
export async function generateBackupData(): Promise<BackupFile> {
  const data: Record<string, unknown[]> = {};
  const tableCounts: Record<string, number> = {};

  for (const table of BACKUP_TABLES) {
    const rows = await TABLE_READERS[table]();
    data[table] = rows;
    tableCounts[table] = rows.length;
  }

  return {
    meta: {
      format: BACKUP_FORMAT_VERSION,
      app: "JF Studio",
      generatedAt: new Date().toISOString(),
      tableCounts
    },
    data
  };
}

/**
 * Convierte tipos de Prisma a JSON seguro: `Decimal` → string (preserva precisión),
 * `DateTime`/`Date` → ISO (vía toJSON nativo de Date). Defensivo: funciona aunque la
 * versión de Decimal no traiga `toJSON`.
 */
function backupReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Prisma.Decimal) return value.toString();
  return value;
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, backupReplacer);
}

/** JSON del respaldo comprimido con gzip (sin dependencias externas). */
export function gzipBackup(backup: BackupFile): Buffer {
  return gzipSync(Buffer.from(serializeBackup(backup), "utf8"));
}

/** Resumen humano del respaldo, para el correo y la UI. */
export function backupStats(backup: BackupFile) {
  const counts = backup.meta.tableCounts;
  return {
    clients: counts.client ?? 0,
    appointments: counts.appointment ?? 0,
    payments: counts.payment ?? 0,
    totalRecords: Object.values(counts).reduce((sum, n) => sum + n, 0)
  };
}

/** `respaldo-jfstudio-2026-06-02.<ext>` con la fecha de hoy. */
export function backupFilename(ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `respaldo-jfstudio-${date}.${ext}`;
}

// ── Excel legible ───────────────────────────────────────────────────────────

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1A1A1A" }
};

function fmtDateTime(d: Date | null | undefined, tz: string): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("es-PE", { timeZone: tz, dateStyle: "short", timeStyle: "short" }).format(d);
}

/** Para campos `@db.Date` (cumpleaños): se guardan a medianoche UTC; formatear en UTC. */
function fmtDateOnly(d: Date | null | undefined): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("es-PE", { timeZone: "UTC", dateStyle: "short" }).format(d);
}

function addSheet(
  wb: ExcelJS.Workbook,
  name: string,
  columns: { header: string; width: number }[],
  rows: (string | number)[][]
) {
  const ws = wb.addWorksheet(name);
  ws.columns = columns.map((c) => ({ width: c.width }));
  const headerRow = ws.addRow(columns.map((c) => c.header));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle" };
  });
  headerRow.height = 18;
  for (const row of rows) ws.addRow(row);
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

/**
 * Excel legible (para consultar, no para restaurar). Hace sus propias consultas con
 * relaciones para mostrar nombres en vez de IDs.
 */
export async function generateReadableXlsx(): Promise<Buffer> {
  const settings = await prisma.salonSettings.findUnique({ where: { id: "default" } });
  const tz = settings?.timezone ?? "America/Lima";

  const [clients, appointments, payments, services, products] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.appointment.findMany({
      orderBy: { startAt: "desc" },
      include: { client: true, staff: true, services: true }
    }),
    prisma.payment.findMany({
      orderBy: { paidAt: "desc" },
      include: { appointment: { include: { client: true } }, collectedByStaff: true }
    }),
    prisma.service.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" } })
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "JF Studio";
  wb.created = new Date();

  addSheet(
    wb,
    "Clientes",
    [
      { header: "Nombre", width: 28 },
      { header: "Teléfono", width: 16 },
      { header: "Correo", width: 26 },
      { header: "Documento", width: 16 },
      { header: "Cumpleaños", width: 14 },
      { header: "Primera visita", width: 16 },
      { header: "Origen", width: 16 },
      { header: "Notas", width: 40 }
    ],
    clients.map((c) => [
      c.name,
      c.phone ?? "",
      c.email ?? "",
      [c.documentType, c.dni].filter(Boolean).join(" "),
      fmtDateOnly(c.birthday),
      fmtDateTime(c.firstVisitAt, tz),
      c.source ?? "",
      c.notes ?? ""
    ])
  );

  addSheet(
    wb,
    "Citas",
    [
      { header: "Fecha y hora", width: 20 },
      { header: "Cliente", width: 28 },
      { header: "Estilista", width: 20 },
      { header: "Estado", width: 12 },
      { header: "Servicios", width: 40 },
      { header: "Total (S/)", width: 12 }
    ],
    appointments.map((a) => [
      fmtDateTime(a.startAt, tz),
      a.client.name,
      a.staff.name,
      a.status,
      a.services.map((s) => s.serviceNameSnapshot).join(" / "),
      a.totalPrice != null ? Number(a.totalPrice) : ""
    ])
  );

  addSheet(
    wb,
    "Pagos",
    [
      { header: "Fecha y hora", width: 20 },
      { header: "Cliente", width: 28 },
      { header: "Monto (S/)", width: 12 },
      { header: "Método", width: 16 },
      { header: "Cobrado por", width: 20 }
    ],
    payments.map((p) => [
      fmtDateTime(p.paidAt, tz),
      p.appointment.client.name,
      Number(p.amount),
      p.method,
      p.collectedByStaff?.name ?? ""
    ])
  );

  addSheet(
    wb,
    "Servicios",
    [
      { header: "Servicio", width: 32 },
      { header: "Duración (min)", width: 16 },
      { header: "Precio (S/)", width: 12 },
      { header: "Activo", width: 10 }
    ],
    services.map((s) => [s.name, s.durationMinutes, Number(s.price), s.isActive ? "Sí" : "No"])
  );

  addSheet(
    wb,
    "Productos",
    [
      { header: "Producto", width: 32 },
      { header: "Unidad", width: 12 },
      { header: "Stock", width: 12 },
      { header: "Umbral", width: 12 },
      { header: "Activo", width: 10 }
    ],
    products.map((p) => [p.name, p.unit, Number(p.stock), Number(p.lowStockThreshold), p.isActive ? "Sí" : "No"])
  );

  const raw = await wb.xlsx.writeBuffer();
  return Buffer.from(raw as ArrayBuffer);
}
