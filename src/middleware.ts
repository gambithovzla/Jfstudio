import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return NextResponse.next();
  }

  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const expected = await sha256hex(`${password}:jfstudio-admin`);
  const session = request.cookies.get("admin_session")?.value;

  if (session !== expected) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
