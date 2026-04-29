import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createBooking } from "@/lib/data";

const bookingSchema = z.object({
  client: z.object({
    name: z.string().min(2),
    phone: z.string().min(6),
    email: z.string().email().optional().or(z.literal(""))
  }),
  serviceIds: z.array(z.string()).min(1),
  staffId: z.string().min(1),
  startAt: z.string().datetime(),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = bookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de reserva invalidos." }, { status: 400 });
  }

  try {
    const appointment = await createBooking({
      client: parsed.data.client,
      serviceIds: parsed.data.serviceIds,
      staffId: parsed.data.staffId,
      startAt: new Date(parsed.data.startAt),
      notes: parsed.data.notes
    });

    return NextResponse.json({
      appointment: {
        id: appointment.id,
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
