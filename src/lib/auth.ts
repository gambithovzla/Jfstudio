import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const COOKIE_NAME = "admin_session";

export function getSessionToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(`${password}:jfstudio-admin`).digest("hex");
}

export async function isAuthenticated(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) {
    return process.env.NODE_ENV !== "production";
  }
  const expected = getSessionToken();
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === expected;
}

export async function requireAdmin() {
  const ok = await isAuthenticated();
  if (!ok) redirect("/admin/login");
}
