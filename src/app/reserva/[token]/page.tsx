import { notFound } from "next/navigation";
import Link from "next/link";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { StatusBadge } from "@/components/status-badge";
import { sendBookingCancellation } from "@/lib/email";
import { getAppointmentByToken, getSalonSettings } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";
import { ARRIVAL_TOLERANCE_MINUTES, WEB_DEPOSIT_AMOUNT_PEN } from "@/lib/booking-rules";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ token: string }> };

const CANCEL_WINDOW_HOURS = 24;

async function cancelByToken(token: string) {
  "use server";

  const { redirect } = await import("next/navigation");
  const appointment = await prisma.appointment.findUnique({
    where: { accessToken: token },
    include: {
      client: true,
      services: { select: { serviceNameSnapshot: true } }
    }
  });

  if (!appointment || appointment.status !== "CONFIRMED") {
    redirect(`/reserva/${token}`);
    return;
  }

  const hoursUntil = (appointment.startAt.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < CANCEL_WINDOW_HOURS) {
    redirect(`/reserva/${token}`);
    return;
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELED" }
  });

  if (appointment.client.email) {
    const settings = await prisma.salonSettings.findUnique({ where: { id: "default" } });
    const timezone = settings?.timezone ?? "America/Lima";
    sendBookingCancellation({
      to: appointment.client.email,
      clientName: appointment.client.name,
      serviceName: appointment.services.map((s) => s.serviceNameSnapshot).join(", "),
      dateLabel: formatDateInZone(appointment.startAt, timezone),
      timeLabel: formatTimeInZone(appointment.startAt, timezone)
    }).catch(() => {});
  }

  redirect(`/reserva/${token}`);
}

export default async function PublicAppointmentPage({ params }: PageProps) {
  const { token } = await params;
  const [appointment, settings] = await Promise.all([getAppointmentByToken(token), getSalonSettings()]);

  if (!appointment) {
    notFound();
  }

  const now = new Date();
  const hoursUntilAppointment = (appointment.startAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  const canModify = appointment.status === "CONFIRMED" && hoursUntilAppointment >= CANCEL_WINDOW_HOURS;
  const isPast = appointment.startAt < now;

  const totalPaid = appointment.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const cancelAction = cancelByToken.bind(null, token);

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: "60vh", padding: "40px 16px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: "0 0 4px", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", color: "#6b7280", letterSpacing: "0.05em" }}>
            {settings.name}
          </p>
          <h1 style={{ margin: "0 0 8px", fontSize: "1.6rem", lineHeight: 1.2 }}>Tu reserva</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusBadge status={appointment.status} />
          </div>
        </div>

        <section className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title" style={{ marginBottom: 14 }}>Detalle de la cita</h2>
          <table className="table">
            <tbody>
              <tr>
                <td className="muted">Cliente</td>
                <td><strong>{appointment.client.name}</strong></td>
              </tr>
              <tr>
                <td className="muted">Estilista</td>
                <td>{appointment.staff.name}</td>
              </tr>
              <tr>
                <td className="muted">Fecha</td>
                <td>{formatDateInZone(appointment.startAt, settings.timezone)}</td>
              </tr>
              <tr>
                <td className="muted">Hora</td>
                <td>
                  {formatTimeInZone(appointment.startAt, settings.timezone)} – {formatTimeInZone(appointment.endAt, settings.timezone)}
                </td>
              </tr>
              <tr>
                <td className="muted">Servicios</td>
                <td>{appointment.services.map((s) => s.serviceNameSnapshot).join(", ")}</td>
              </tr>
              {appointment.status === "COMPLETED" && totalPaid > 0 ? (
                <tr>
                  <td className="muted">Pagado</td>
                  <td>{formatCurrency(totalPaid, settings.currency)}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        {appointment.status === "CONFIRMED" && !isPast ? (
          <section className="card">
            <h2 className="card-title" style={{ marginBottom: 8 }}>Gestionar</h2>
            {canModify ? (
              <>
                <p className="small muted" style={{ marginBottom: 12 }}>
                  Puedes cancelar o reagendar con al menos {CANCEL_WINDOW_HOURS} horas de anticipacion.
                </p>
                <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: "0.83rem", color: "#92400e" }}>
                  <strong>Adelanto S/ {WEB_DEPOSIT_AMOUNT_PEN}:</strong> si cancelas tu cita, el adelanto no se devuelve. Si reagendas, conservamos tu comprobante en la nueva fecha.
                  <br />
                  <br />
                  <strong>Llegada:</strong> por favor llega puntual; contamos con {ARRIVAL_TOLERANCE_MINUTES} minutos de tolerancia desde la hora acordada.
                </div>
                <div className="button-row">
                  <Link className="btn" href={`/reserva/${token}/reagendar`}>
                    Reagendar
                  </Link>
                  <form action={cancelAction}>
                    <ConfirmSubmitButton
                      className="btn danger"
                      type="submit"
                      message={`Si cancelas, el adelanto S/ ${WEB_DEPOSIT_AMOUNT_PEN} no se devuelve. ¿Confirmas que deseas cancelar tu cita? Recibirás un email de confirmación.`}
                    >
                      Cancelar cita
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </>
            ) : (
              <>
                <p className="small muted" style={{ marginBottom: 12 }}>
                  Ya no es posible modificar esta cita (menos de {CANCEL_WINDOW_HOURS} horas de anticipacion).
                </p>
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: "0.83rem", color: "#991b1b" }}>
                  Ya no puedes cancelar ni reagendar desde el enlace (menos de {CANCEL_WINDOW_HOURS} h). El adelanto de la reserva web (S/ {WEB_DEPOSIT_AMOUNT_PEN}) no se reembolsa si cancelas; por urgencias escribenos por WhatsApp.
                </div>
              </>
            )}
          </section>
        ) : null}

        {appointment.status === "CANCELED" ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Link className="btn" href="/reservar">
              Hacer nueva reserva
            </Link>
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
