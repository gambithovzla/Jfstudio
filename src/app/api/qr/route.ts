import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_URL_LEN = 2048;

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw || raw.length > MAX_URL_LEN) {
    return new NextResponse("Parámetro url inválido", { status: 400 });
  }

  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return new NextResponse("Protocolo no permitido", { status: 400 });
    }
  } catch {
    return new NextResponse("URL inválida", { status: 400 });
  }

  const allowedBase = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  if (raw !== allowedBase && !raw.startsWith(`${allowedBase}/`)) {
    return new NextResponse("URL no permitida", { status: 400 });
  }

  try {
    const png = await QRCode.toBuffer(raw, {
      type: "png",
      width: 420,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f766e", light: "#fffbf7" }
    });

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400"
      }
    });
  } catch {
    return new NextResponse("No se pudo generar el código QR", { status: 500 });
  }
}
