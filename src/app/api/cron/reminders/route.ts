import { NextRequest, NextResponse } from "next/server";

import { sendBookingReminder } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const settings = await prisma.salonSettings.findUnique({ where: { id: "default" } });
  const timezone = settings?.timezone ?? "America/Lima";

  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      startAt: { gte: windowStart, lte: windowEnd },
      client: { email: { not: null } }
    },
    include: { client: true, staff: true, services: true }
  });

  let sent = 0;
  let failed = 0;

  for (const appointment of appointments) {
    if (!appointment.client.email) continue;

    const serviceNames = appointment.services.map((s) => s.serviceNameSnapshot).join(", ");

    try {
      await sendBookingReminder({
        to: appointment.client.email,
        clientName: appointment.client.name,
        serviceName: serviceNames,
        staffName: appointment.staff.name,
        dateLabel: formatDateInZone(appointment.startAt, timezone),
        timeLabel: formatTimeInZone(appointment.startAt, timezone),
        accessToken: appointment.accessToken
      });

      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: now }
      });

      sent++;
    } catch (err) {
      console.error(`[cron] reminder fallo para cita ${appointment.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, checked: appointments.length });
}
