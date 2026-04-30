import { notFound, redirect } from "next/navigation";

import { BookingForm } from "@/components/booking-form";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { getAppointmentByToken, getBookingBootstrap } from "@/lib/data";

export const dynamic = "force-dynamic";

const CANCEL_WINDOW_HOURS = 4;

type PageProps = { params: Promise<{ token: string }> };

export default async function ReschedulePublicPage({ params }: PageProps) {
  const { token } = await params;

  const [appointment, { settings, services, staff }] = await Promise.all([
    getAppointmentByToken(token),
    getBookingBootstrap()
  ]);

  if (!appointment) {
    notFound();
  }

  if (appointment.status !== "CONFIRMED") {
    redirect(`/reserva/${token}`);
  }

  const hoursUntil = (appointment.startAt.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < CANCEL_WINDOW_HOURS) {
    redirect(`/reserva/${token}`);
  }

  const currentServiceIds = appointment.services.map((s) => s.serviceId);

  return (
    <>
      <SiteHeader />
      <main className="booking-page">
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 16px" }}>
          <p style={{ margin: "0 0 4px", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "#6b7280" }}>
            Reagendar cita
          </p>
          <h1 style={{ margin: "0 0 20px", fontSize: "1.4rem" }}>Elige nuevo horario</h1>
        </div>
        <BookingForm
          services={services}
          staff={staff}
          currency={settings.currency}
          initialServiceIds={currentServiceIds}
          replaceToken={token}
        />
      </main>
      <SiteFooter />
    </>
  );
}
