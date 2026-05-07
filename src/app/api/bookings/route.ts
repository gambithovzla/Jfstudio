import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createBooking } from "@/lib/data";
import { prisma } from "@/lib/prisma";

const CANCEL_WINDOW_HOURS = 4;

const bookingSchema = z.object({
  client: z.object({
    name: z.string().min(2),
    phone: z.string().min(6),
    email: z.string().email().optional().or(z.literal("")),
    birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  }),
  serviceIds: z.array(z.string()).min(1),
  staffId: z.string().min(1),
  startAt: z.string().datetime(),
  notes: z.string().optional(),
  replaceToken: z.string().optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = bookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de reserva invalidos." }, { status: 400 });
  }

  let cancelAppointmentId: string | null = null;

  if (parsed.data.replaceToken) {
    const existing = await prisma.appointment.findUnique({
      where: { accessToken: parsed.data.replaceToken }
    });

    if (!existing || existing.status !== "CONFIRMED") {
      return NextResponse.json({ error: "La cita original no puede ser modificada." }, { status: 409 });
    }

    const hoursUntil = (existing.startAt.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < CANCEL_WINDOW_HOURS) {
      return NextResponse.json(
        { error: `Solo puedes reagendar con al menos ${CANCEL_WINDOW_HOURS} horas de anticipacion.` },
        { status: 409 }
      );
    }

    cancelAppointmentId = existing.id;
  }

  try {
    const birthdayDate = parsed.data.client.birthday
      ? new Date(parsed.data.client.birthday + "T00:00:00Z")
      : null;

    const appointment = await createBooking({
      client: { ...parsed.data.client, birthday: birthdayDate },
      serviceIds: parsed.data.serviceIds,
      staffId: parsed.data.staffId,
      startAt: new Date(parsed.data.startAt),
      notes: parsed.data.notes
    });

    if (cancelAppointmentId) {
      await prisma.appointment.update({
        where: { id: cancelAppointmentId },
        data: { status: "CANCELED" }
      });
    }

    return NextResponse.json({
      appointment: {
        id: appointment.id,
        accessToken: appointment.accessToken,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        clientName: appointment.client.name,
        staffName: appointment.staff.name,
        services: appointment.services.map((service) => service.serviceNameSnapshot)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear la reserva." },
      { status: 409 }
    );
  }
}
