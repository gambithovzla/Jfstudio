import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { COOKIE_NAME, getSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const password = data.get("password") as string;

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !password) {
    redirect("/admin/login?error=1");
  }

  const inputHash = createHash("sha256").update(`${password}:jfstudio-admin`).digest("hex");
  const expected = getSessionToken();

  if (inputHash !== expected) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, inputHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });

  redirect("/admin/agenda");
}
