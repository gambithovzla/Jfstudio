import Link from "next/link";

import { landingContent } from "@/content/landing";
import { ScrollReveal } from "./scroll-reveal";

export function Contact() {
  const { contact } = landingContent;
  const whatsappLink = `https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`;

  return (
    <section className="landing-cta" id="contacto">
      <div className="landing-cta-inner">
        <ScrollReveal>
          <p className="landing-cta-eyebrow">Reservar cita</p>
          <h2 className="landing-cta-title">
            Tu próxima<br /><em>transformación</em> empieza aquí.
          </h2>
          <p className="landing-cta-body">
            Reserva en línea en menos de un minuto. Recibe confirmación inmediata por email y un recordatorio 24h antes de tu cita.
          </p>
          <div className="button-row" style={{ justifyContent: "center", gap: 14 }}>
            <Link className="btn" href="/reservar">
              Reservar online →
            </Link>
            <a
              className="btn secondary"
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
            >
              Escribir por WhatsApp
            </a>
          </div>
          <div className="landing-cta-tags">
            <span className="landing-cta-tag">Confirmación por email</span>
            <span className="landing-cta-tag">Recordatorio 24h antes</span>
            <span className="landing-cta-tag">Reagendar online</span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
