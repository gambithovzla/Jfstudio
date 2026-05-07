import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createBooking, getSalonSettings } from "@/lib/data";
import { sendNewBookingNotification } from "@/lib/email";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";
import { prisma } from "@/lib/prisma";

const CANCEL_WINDOW_HOURS = 24;

const bookingSchema = z.object({
  _trap: z.string().max(0).optional(),
  client: z.object({
    name: z.string().min(2).max(100),
    phone: z.string().min(6).max(30),
    email: z.string().email().optional().or(z.literal("")),
    birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    documentType: z.enum(["DNI", "CE", "PASSPORT"]).optional(),
    documentNumber: z.string().min(4).max(30).optional()
  }),
  serviceIds: z.array(z.string()).min(1).max(10),
  staffId: z.string().min(1),
  startAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
  replaceToken: z.string().optional(),
  bonusCode: z.string().optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = bookingSchema.safeParse(body);

  // Honeypot: if _trap is filled, silently discard
  if (parsed.success && parsed.data._trap) {
    return NextResponse.json({ ok: true });
  }

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
      client: {
        name: parsed.data.client.name,
        phone: parsed.data.client.phone,
        email: parsed.data.client.email,
        birthday: birthdayDate,
        documentType: parsed.data.client.documentNumber ? parsed.data.client.documentType ?? "DNI" : null,
        documentNumber: parsed.data.client.documentNumber ?? null
      },
      serviceIds: parsed.data.serviceIds,
      staffId: parsed.data.staffId,
      startAt: new Date(parsed.data.startAt),
      notes: parsed.data.notes,
      bonusCode: parsed.data.bonusCode || null
    });

    if (cancelAppointmentId) {
      await prisma.appointment.update({
        where: { id: cancelAppointmentId },
        data: { status: "CANCELED" }
      });
    }

    // Notificar al admin
    try {
      const settings = await getSalonSettings();
      await sendNewBookingNotification({
        clientName: appointment.client.name,
        clientPhone: appointment.client.phone ?? "",
        serviceName: appointment.services.map((s) => s.serviceNameSnapshot).join(", "),
        staffName: appointment.staff.name,
        dateLabel: formatDateInZone(appointment.startAt, settings.timezone),
        timeLabel: formatTimeInZone(appointment.startAt, settings.timezone)
      });
    } catch (err) {
      console.error("[email] notificacion admin fallo:", err);
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
