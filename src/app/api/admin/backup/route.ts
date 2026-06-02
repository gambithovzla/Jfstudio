import { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { backupFilename, generateBackupData, generateReadableXlsx, gzipBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";

/**
 * Descarga manual del respaldo desde el panel.
 *   ?format=json (por defecto) → JSON comprimido (.json.gz), restaurable con `db:restore`.
 *   ?format=xlsx               → Excel legible para consultar a ojo.
 */
export async function GET(request: NextRequest) {
  await requireAdmin();

  const format = new URL(request.url).searchParams.get("format") ?? "json";

  if (format === "xlsx") {
    const buffer = await generateReadableXlsx();
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${backupFilename("xlsx")}"`,
        "Cache-Control": "no-store"
      }
    });
  }

  const backup = await generateBackupData();
  const gz = gzipBackup(backup);
  return new Response(new Uint8Array(gz), {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="${backupFilename("json.gz")}"`,
      "Cache-Control": "no-store"
    }
  });
}
