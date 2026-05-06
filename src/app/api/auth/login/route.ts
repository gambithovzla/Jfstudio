import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { COOKIE_NAME, checkPassword, hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const password = data.get("password") as string;

  if (!password) {
    redirect("/admin/login?error=1");
  }

  const isValid = await checkPassword(password);

  if (!isValid) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, hashPassword(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  redirect("/admin/agenda");
}
