import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";

// Returns whether an existing client has a birthday set.
// Used by the booking form to show/hide the birthday field.
export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone");
  if (!phone || phone.length < 6) {
    return NextResponse.json({ status: "unknown" });
  }

  const normalized = normalizePhone(phone);

  const client = await prisma.client.findUnique({
    where: { phone: normalized },
    select: { birthday: true }
  });

  if (!client) return NextResponse.json({ status: "new" });
  if (client.birthday) return NextResponse.json({ status: "has_birthday" });
  return NextResponse.json({ status: "missing_birthday" });
}
