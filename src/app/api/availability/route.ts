import { NextRequest, NextResponse } from "next/server";

import { getAvailabilityForServices } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const serviceIds = searchParams.get("serviceIds")?.split(",").filter(Boolean) ?? [];
  const staffId = searchParams.get("staffId");
  const replaceToken = searchParams.get("replaceToken");

  if (!date || serviceIds.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  let excludeAppointmentId: string | null = null;
  if (replaceToken) {
    const row = await prisma.appointment.findUnique({
      where: { accessToken: replaceToken },
      select: { id: true, status: true }
    });
    if (row?.status === "CONFIRMED") {
      excludeAppointmentId = row.id;
    }
  }

  try {
    const slots = await getAvailabilityForServices({
      date,
      serviceIds,
      staffId: staffId === "any" ? null : staffId,
      excludeAppointmentId
    });

    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo calcular disponibilidad." },
      { status: 400 }
    );
  }
}
