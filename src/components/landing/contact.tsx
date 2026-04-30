import Link from "next/link";
import { AtSign, Mail, MessageCircle, Phone } from "lucide-react";

import { landingContent } from "@/content/landing";

export function Contact() {
  const { contact } = landingContent;
  const whatsappLink = `https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`;

  return (
    <section className="landing-section landing-contact" id="contacto">
      <div className="section-header">
        <p className="eyebrow">{contact.title}</p>
        <h2 className="section-title">{contact.description}</h2>
      </div>
      <div className="grid two landing-contact-grid">
        <div className="card contact-card">
          <div className="contact-row">
            <MessageCircle size={20} aria-hidden />
            <div>
              <strong>WhatsApp</strong>
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="small">
                Escribir por WhatsApp
              </a>
            </div>
          </div>
          <div className="contact-row">
            <Phone size={20} aria-hidden />
            <div>
              <strong>Telefono</strong>
              <a href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`} className="small">
                {contact.phone}
              </a>
            </div>
          </div>
          <div className="contact-row">
            <Mail size={20} aria-hidden />
            <div>
              <strong>Email</strong>
              <a href={`mailto:${contact.email}`} className="small">
                {contact.email}
              </a>
            </div>
          </div>
          {contact.instagram ? (
            <div className="contact-row">
              <AtSign size={20} aria-hidden />
              <div>
                <strong>Instagram</strong>
                <a href={contact.instagram} target="_blank" rel="noreferrer" className="small">
                  {contact.instagram.replace(/^https?:\/\//, "")}
                </a>
              </div>
            </div>
          ) : null}
        </div>
        <div className="card contact-cta">
          <h3 className="card-title">Reserva en linea</h3>
          <p className="small muted">
            Elige servicio, estilista y horario. Confirmamos al instante por correo.
          </p>
          <Link className="btn" href="/reservar">
            Reservar cita ahora
          </Link>
        </div>
      </div>
    </section>
  );
}
