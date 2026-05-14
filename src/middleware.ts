import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory rate limiter — resets on cold start (acceptable for Edge runtime)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

type RateLimitRule = { windowMs: number; max: number };

const RATE_LIMITS: Record<string, RateLimitRule> = {
  "/api/auth/login":    { windowMs: 60_000, max: 10 },   // 10 attempts/min
  "/api/availability":  { windowMs: 60_000, max: 60 },   // 60 availability checks/min
  "/api/qr":            { windowMs: 60_000, max: 45 }    // QR generation (evita abuso del endpoint)
};

function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(key: string, rule: RateLimitRule): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rule.windowMs });
    return false;
  }

  entry.count += 1;
  if (entry.count > rule.max) return true;

  return false;
}

async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rate limiting for public API routes
  const rule = RATE_LIMITS[pathname];
  if (rule) {
    const ip = getIp(request);
    const key = `${pathname}:${ip}`;
    if (isRateLimited(key, rule)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta en un momento." },
        { status: 429 }
      );
    }
  }

  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    const res = NextResponse.next();
    res.headers.set("x-pathname", pathname);
    return res;
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

  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  return res;
}

export const config = {
  // Nota: no incluir /api/bookings — el middleware fuerza buffer del body y rompe multipart (comprobante).
  matcher: ["/admin/:path*", "/api/auth/login", "/api/availability", "/api/qr"]
};
