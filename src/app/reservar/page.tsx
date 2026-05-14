import { BookingForm } from "@/components/booking-form";
import { SetupNotice } from "@/components/setup-notice";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { getBookingBootstrap } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reserva tu cita"
};

export default async function BookingPage() {
  try {
    const { settings, services, staff } = await getBookingBootstrap();

    return (
      <>
        <SiteHeader />
        <main className="booking-page">
          <BookingForm
            services={services}
            staff={staff}
            currency={settings.currency}
            salonTimezone={settings.timezone}
          />
        </main>
        <SiteFooter />
      </>
    );
  } catch (error) {
    return (
      <>
        <SiteHeader />
        <SetupNotice message={error instanceof Error ? error.message : undefined} />
      </>
    );
  }
}
