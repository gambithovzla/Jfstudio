import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { MIN_BOOKING_ADVANCE_HOURS, WEB_DEPOSIT_AMOUNT_PEN } from "@/lib/booking-rules";
import { createBooking, getSalonSettings } from "@/lib/data";
import {
  sendAdminRescheduleCancellationNotice,
  sendBookingCancellation,
  sendNewBookingNotification
} from "@/lib/email";
import { assertAllowedVoucherMime, getDepositVoucherBuffer, isDepositStorageConfigured, uploadDepositVoucher } from "@/lib/deposit-storage";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_VOUCHER_BYTES = 5 * 1024 * 1024;

const bookingPayloadSchema = z.object({
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
  const ct = request.headers.get("content-type") ?? "";
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Actualiza la pagina y vuelve a intentar (formulario de reserva desactualizado)." },
      { status: 400 }
    );
  }

  const formData = await request.formData();

  if (String(formData.get("_trap") ?? "").trim()) {
    return NextResponse.json({ ok: true });
  }

  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string") {
    return NextResponse.json({ error: "Datos de reserva invalidos." }, { status: 400 });
  }

  let parsed: z.infer<typeof bookingPayloadSchema>;
  try {
    const json = JSON.parse(rawPayload) as unknown;
    const r = bookingPayloadSchema.safeParse(json);
    if (!r.success) {
      return NextResponse.json({ error: "Datos de reserva invalidos." }, { status: 400 });
    }
    parsed = r.data;
  } catch {
    return NextResponse.json({ error: "Datos de reserva invalidos." }, { status: 400 });
  }

  let cancelAppointmentId: string | null = null;
  let inheritedDeposit: {
    voucherKey: string;
    voucherFilename: string;
    voucherMime: string;
    amountPen: number;
  } | null = null;
  let voucherBufferForEmail: Buffer | null = null;
  let voucherFilenameForEmail: string | null = null;

  if (parsed.replaceToken) {
    const existing = await prisma.appointment.findUnique({
      where: { accessToken: parsed.replaceToken },
      select: {
        id: true,
        status: true,
        startAt: true,
        depositVoucherKey: true,
        depositVoucherFilename: true,
        depositVoucherMime: true,
        depositAmountPen: true
      }
    });

    if (!existing || existing.status !== "CONFIRMED") {
      return NextResponse.json({ error: "La cita original no puede ser modificada." }, { status: 409 });
    }

    const hoursUntil = (existing.startAt.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < MIN_BOOKING_ADVANCE_HOURS) {
      return NextResponse.json(
        { error: `Solo puedes reagendar con al menos ${MIN_BOOKING_ADVANCE_HOURS} horas de anticipacion.` },
        { status: 409 }
      );
    }

    if (!existing.depositVoucherKey) {
      return NextResponse.json(
        { error: "La reserva original no tiene comprobante registrado; contacta al salon." },
        { status: 409 }
      );
    }

    cancelAppointmentId = existing.id;
    inheritedDeposit = {
      voucherKey: existing.depositVoucherKey,
      voucherFilename: existing.depositVoucherFilename || "comprobante",
      voucherMime: existing.depositVoucherMime || "application/octet-stream",
      amountPen: Number(existing.depositAmountPen ?? WEB_DEPOSIT_AMOUNT_PEN)
    };

    try {
      const got = await getDepositVoucherBuffer(existing.depositVoucherKey);
      voucherBufferForEmail = got.buffer;
      voucherFilenameForEmail = existing.depositVoucherFilename || "comprobante";
    } catch {
      voucherBufferForEmail = null;
    }
  } else {
    if (!isDepositStorageConfigured()) {
      return NextResponse.json(
        { error: "Reservas web no disponibles: falta configurar almacenamiento de comprobantes (S3)." },
        { status: 503 }
      );
    }

    const file = formData.get("voucher");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Debes adjuntar el comprobante de pago del adelanto (S/ 50)." },
        { status: 400 }
      );
    }

    if (file.size > MAX_VOUCHER_BYTES) {
      return NextResponse.json({ error: "El comprobante supera el tamaño maximo (5 MB)." }, { status: 400 });
    }

    const mime = file.type || "application/octet-stream";
    try {
      assertAllowedVoucherMime(mime);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Archivo no permitido" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    try {
      const { key } = await uploadDepositVoucher({
        buffer: buf,
        mime,
        originalFilename: file.name || "comprobante"
      });
      inheritedDeposit = {
        voucherKey: key,
        voucherFilename: file.name || "comprobante",
        voucherMime: mime.split(";")[0].trim(),
        amountPen: WEB_DEPOSIT_AMOUNT_PEN
      };
      voucherBufferForEmail = buf;
      voucherFilenameForEmail = inheritedDeposit.voucherFilename;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "No se pudo guardar el comprobante." },
        { status: 500 }
      );
    }
  }

  try {
    const birthdayDate = parsed.client.birthday
      ? new Date(parsed.client.birthday + "T00:00:00Z")
      : null;

    const appointment = await createBooking({
      client: {
        name: parsed.client.name,
        phone: parsed.client.phone,
        email: parsed.client.email,
        birthday: birthdayDate,
        documentType: parsed.client.documentNumber ? parsed.client.documentType ?? "DNI" : null,
        documentNumber: parsed.client.documentNumber ?? null
      },
      serviceIds: parsed.serviceIds,
      staffId: parsed.staffId,
      startAt: new Date(parsed.startAt),
      notes: parsed.notes,
      bonusCode: parsed.bonusCode || null,
      bookingSource: "public_web",
      webDeposit: inheritedDeposit,
      excludeAppointmentId: cancelAppointmentId
    });

    if (cancelAppointmentId) {
      await prisma.appointment.update({
        where: { id: cancelAppointmentId },
        data: { status: "CANCELED" }
      });

      const canceled = await prisma.appointment.findUnique({
        where: { id: cancelAppointmentId },
        include: { client: true, staff: true, services: true }
      });

      if (canceled) {
        const settingsCanceled = await getSalonSettings();
        const serviceNames = canceled.services.map((s) => s.serviceNameSnapshot).join(", ");
        const dateLabel = formatDateInZone(canceled.startAt, settingsCanceled.timezone);
        const timeLabel = formatTimeInZone(canceled.startAt, settingsCanceled.timezone);
        try {
          if (canceled.client.email) {
            await sendBookingCancellation({
              to: canceled.client.email,
              clientName: canceled.client.name,
              serviceName: serviceNames,
              dateLabel,
              timeLabel
            });
          } else {
            await sendAdminRescheduleCancellationNotice({
              clientName: canceled.client.name,
              clientPhone: canceled.client.phone ?? "",
              serviceName: serviceNames,
              staffName: canceled.staff.name,
              dateLabel,
              timeLabel
            });
          }
        } catch (err) {
          console.error("[email] cancelacion por reagendamiento fallo:", err);
        }
      }
    }

    try {
      const settings = await getSalonSettings();
      await sendNewBookingNotification({
        clientName: appointment.client.name,
        clientPhone: appointment.client.phone ?? "",
        serviceName: appointment.services.map((s) => s.serviceNameSnapshot).join(", "),
        staffName: appointment.staff.name,
        dateLabel: formatDateInZone(appointment.startAt, settings.timezone),
        timeLabel: formatTimeInZone(appointment.startAt, settings.timezone),
        ...(voucherBufferForEmail && voucherFilenameForEmail
          ? {
              adminAttachment: {
                filename: voucherFilenameForEmail,
                contentBase64: voucherBufferForEmail.toString("base64")
              }
            }
          : {})
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
