import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash } from "crypto";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return NextResponse.next();
  }

  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    // No password set — allow in dev, block in prod
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const expected = createHash("sha256").update(`${password}:jfstudio-admin`).digest("hex");
  const session = request.cookies.get("admin_session")?.value;

  if (session !== expected) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
