import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase() ?? "";
  const phoneRaw = request.nextUrl.searchParams.get("phone")?.trim() ?? "";

  if (!code || phoneRaw.length < 6) {
    return NextResponse.json({ valid: false, message: null });
  }

  const phone = normalizePhone(phoneRaw);

  const bonus = await prisma.birthdayBonus.findUnique({
    where: { code },
    include: { client: { select: { phone: true } } }
  });

  if (!bonus) {
    return NextResponse.json({ valid: false, message: "El código no existe." });
  }

  if (normalizePhone(bonus.client.phone ?? "") !== phone) {
    return NextResponse.json({ valid: false, message: "Este código pertenece a otra clienta." });
  }

  if (bonus.redeemedAt) {
    return NextResponse.json({ valid: false, message: "Este código ya fue canjeado." });
  }

  if (bonus.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, message: "Este código venció." });
  }

  return NextResponse.json({ valid: true, discountPercent: bonus.discountPercent, code: bonus.code });
}