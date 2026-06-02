/**
 * En Railway la URL interna (.railway.internal) funciona en runtime.
 * Desde tu PC hace falta DATABASE_PUBLIC_URL o la URL pública del Postgres.
 */
export function resolveDatabaseUrlForLocalScript(scriptName: string): void {
  const internal = process.env.DATABASE_URL ?? "";
  const pub = process.env.DATABASE_PUBLIC_URL?.trim();
  const onRailway = Boolean(process.env.RAILWAY_ENVIRONMENT?.trim());

  if (!internal.includes(".railway.internal")) return;
  if (onRailway) return;

  if (pub) {
    process.env.DATABASE_URL = pub;
    console.warn(`[${scriptName}] Usando DATABASE_PUBLIC_URL (el host .railway.internal no es alcanzable desde tu PC).\n`);
    return;
  }

  console.error(`
[${scriptName}] No se puede usar DATABASE_URL con host .railway.internal desde tu ordenador.

Haz UNA de estas:

  A) Railway → servicio Postgres → pestaña "Connect" / "Data" → copia la URL PUBLICA (TCP Proxy).
     En PowerShell:
       $env:DATABASE_URL = "postgresql://...copiada..."
       npm run db:ensure-services

  B) En Railway, en el servicio de la APP: agrega DATABASE_PUBLIC_URL y ejecuta:
       railway run npm run db:ensure-services
`);
  process.exit(1);
}
