import { NextRequest, NextResponse } from "next/server";

import {
  backupFilename,
  backupStats,
  generateBackupData,
  generateReadableXlsx,
  gzipBackup
} from "@/lib/backup";
import { isDepositStorageConfigured, uploadBackupObject } from "@/lib/deposit-storage";
import { sendBackupStatusEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Respaldo automático diario. Debe llamarse una vez al día con
 * `Authorization: Bearer ${CRON_SECRET}` (mismo mecanismo que /api/cron/reminders).
 *
 * El archivo con datos reales (nombres, telefonos, DNI) SOLO se sube cifrado al bucket
 * S3/R2 bajo backups/<año>/ — nunca sale por correo (exposicion de datos personales bajo
 * Ley 29733: un adjunto sin cifrar quedaria indefinidamente en bandejas de Gmail). El correo
 * es solo una notificacion de estado (sent/error), sin adjuntos ni datos de clientas.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const backup = await generateBackupData();
  const gz = gzipBackup(backup);
  const xlsx = await generateReadableXlsx();
  const stats = backupStats(backup);

  const jsonName = backupFilename("json.gz");
  const xlsxName = backupFilename("xlsx");
  const dateLabel = new Date().toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" });
  const sizeLabel = `${(gz.length / 1024).toFixed(0)} KB`;

  let storage: "uploaded" | "error" | "not_configured" = "not_configured";

  if (isDepositStorageConfigured()) {
    try {
      const year = new Date().getUTCFullYear();
      await uploadBackupObject({ key: `backups/${year}/${jsonName}`, body: gz, contentType: "application/gzip" });
      await uploadBackupObject({ key: `backups/${year}/${xlsxName}`, body: xlsx, contentType: XLSX_MIME });
      storage = "uploaded";
    } catch (err) {
      console.error("[cron] backup: fallo al subir a S3/R2:", err);
      storage = "error";
    }
  } else {
    console.error("[cron] backup: DEPOSIT_S3_* no configurado, no se pudo guardar el respaldo del dia.");
  }

  let email: "sent" | "skipped" | "error" = "skipped";
  try {
    email = await sendBackupStatusEmail({ dateLabel, stats, sizeLabel, storage });
  } catch (err) {
    console.error("[cron] backup: fallo al enviar notificacion:", err);
    email = "error";
  }

  const ok = storage === "uploaded";
  return NextResponse.json(
    { ok, email, storage, sizeBytes: gz.length, ...stats },
    { status: ok ? 200 : 500 }
  );
}
