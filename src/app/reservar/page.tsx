import Link from "next/link";

import { BookingForm } from "@/components/booking-form";
import { SetupNotice } from "@/components/setup-notice";
import { getBookingBootstrap } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  try {
    const { settings, services, staff } = await getBookingBootstrap();

    return (
      <>
        <header className="topbar">
          <div className="topbar-inner">
            <Link className="brand-mark" href="/reservar">
              <span className="brand-dot">JF</span>
              <span>{settings.name}</span>
            </Link>
            <Link className="btn secondary" href="/admin">
              Admin
            </Link>
          </div>
        </header>
        <main className="booking-page">
          <BookingForm services={services} staff={staff} currency={settings.currency} />
        </main>
      </>
    );
  } catch (error) {
    return <SetupNotice message={error instanceof Error ? error.message : undefined} />;
  }
}
