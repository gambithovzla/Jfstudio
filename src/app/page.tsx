import { About } from "@/components/landing/about";
import { Contact } from "@/components/landing/contact";
import { Gallery } from "@/components/landing/gallery";
import { Hero } from "@/components/landing/hero";
import { Location } from "@/components/landing/location";
import { ServicesShowcase } from "@/components/landing/services-showcase";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { StudioSpace } from "@/components/landing/studio-space";
import { Testimonials } from "@/components/landing/testimonials";
import { getBookingBootstrap } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let services: Awaited<ReturnType<typeof getBookingBootstrap>>["services"] = [];
  let currency = "PEN";

  try {
    const bootstrap = await getBookingBootstrap();
    services = bootstrap.services;
    currency = bootstrap.settings.currency;
  } catch {
    // Sin DB: la landing usa el contenido estatico de fallback.
  }

  return (
    <>
      <SiteHeader />
      <main className="landing">
        <Hero />
        <ServicesShowcase services={services} currency={currency} />
        <About />
        <Gallery />
        <StudioSpace />
        <Testimonials />
        <Location />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
