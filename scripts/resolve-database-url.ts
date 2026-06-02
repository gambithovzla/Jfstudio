/**
 * En Railway el build/run usa DATABASE_URL interna; desde tu PC hace falta la URL pública.
 */
export function resolveDatabaseUrlForLocalScript(scriptName: string): void {
  const internal = process.env.DATABASE_URL ?? "";
  const pub = process.env.DATABASE_PUBLIC_URL?.trim();

  if (!internal.includes(".railway.internal")) return;

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
