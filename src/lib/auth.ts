import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "./prisma";

export const COOKIE_NAME = "admin_session";

function hashPassword(password: string): string {
  return createHash("sha256").update(`${password}:jfstudio-admin`).digest("hex");
}

export function getEnvPasswordHash(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return hashPassword(password);
}

export async function getDbPasswordHash(): Promise<string | null> {
  try {
    const settings = await prisma.salonSettings.findUnique({
      where: { id: "default" },
      select: { adminPasswordHash: true }
    });
    return settings?.adminPasswordHash ?? null;
  } catch {
    return null;
  }
}

// Returns all valid session token hashes — env var is always the master override
export async function getValidTokens(): Promise<string[]> {
  const tokens: string[] = [];
  const envHash = getEnvPasswordHash();
  if (envHash) tokens.push(envHash);
  const dbHash = await getDbPasswordHash();
  if (dbHash && dbHash !== envHash) tokens.push(dbHash);
  return tokens;
}

export async function checkPassword(plaintext: string): Promise<boolean> {
  const inputHash = hashPassword(plaintext);
  const valid = await getValidTokens();
  return valid.includes(inputHash);
}

export async function isAuthenticated(): Promise<boolean> {
  const valid = await getValidTokens();
  if (valid.length === 0) {
    return process.env.NODE_ENV !== "production";
  }
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(COOKIE_NAME)?.value;
  return valid.includes(cookieVal ?? "");
}

export async function requireAdmin() {
  const ok = await isAuthenticated();
  if (!ok) redirect("/admin/login");
}

export { hashPassword };
