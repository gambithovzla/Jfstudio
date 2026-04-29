import { NextRequest, NextResponse } from "next/server";

import { getAvailabilityForServices } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const serviceIds = searchParams.get("serviceIds")?.split(",").filter(Boolean) ?? [];
  const staffId = searchParams.get("staffId");

  if (!date || serviceIds.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  try {
    const slots = await getAvailabilityForServices({
      date,
      serviceIds,
      staffId: staffId === "any" ? null : staffId
    });

    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo calcular disponibilidad." },
      { status: 400 }
    );
  }
}
