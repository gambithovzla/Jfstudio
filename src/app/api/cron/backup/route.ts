import { NextRequest, NextResponse } from "next/server";

import {
  backupFilename,
  backupStats,
  generateBackupData,
  generateReadableXlsx,
  gzipBackup
} from "@/lib/backup";
import { isDepositStorageConfigured, uploadBackupObject } from "@/lib/deposit-storage";
import { sendDatabaseBackupEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Respaldo automático diario. Debe llamarse una vez al día con
 * `Authorization: Bearer ${CRON_SECRET}` (mismo mecanismo que /api/cron/reminders).
 *
 * Genera el respaldo y lo saca de Railway por dos vías independientes:
 *   1) correo a ADMIN_EMAIL con el .json.gz y el .xlsx adjuntos (Resend);
 *   2) subida al bucket S3/R2 bajo backups/<año>/.
 * Si una vía falla, la otra se intenta igual.
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

  let email: "sent" | "skipped" | "error" = "skipped";
  let storage: "uploaded" | "skipped" | "error" = "skipped";

  // 1) Correo
  try {
    email = await sendDatabaseBackupEmail({
      dateLabel,
      stats,
      sizeLabel,
      attachments: [
        { filename: jsonName, content: gz },
        { filename: xlsxName, content: xlsx }
      ]
    });
  } catch (err) {
    console.error("[cron] backup: fallo al enviar correo:", err);
    email = "error";
  }

  // 2) Almacenamiento S3/R2
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
  }

  const ok = email !== "error" && storage !== "error";
  return NextResponse.json(
    { ok, email, storage, sizeBytes: gz.length, ...stats },
    { status: ok ? 200 : 500 }
  );
}
