import { NextRequest, NextResponse } from "next/server";

// Sin CRON_SECRET en produccion se bloquea (fail-closed), igual que el middleware con
// ADMIN_PASSWORD: si la variable se borra por error, nadie de afuera puede disparar
// recordatorios o saludos masivos a las clientas.
export function isCronAuthorized(
  authHeader: string | null,
  secret: string | undefined = process.env.CRON_SECRET,
  nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
  if (!secret) return nodeEnv !== "production";
  return authHeader === `Bearer ${secret}`;
}

export function rejectUnauthorizedCron(request: NextRequest): NextResponse | null {
  if (isCronAuthorized(request.headers.get("authorization"))) return null;
  if (!process.env.CRON_SECRET) {
    console.error("[cron] CRON_SECRET no configurado: endpoint bloqueado en produccion");
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
