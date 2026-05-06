import Link from "next/link";
import Image from "next/image";

import { landingContent } from "@/content/landing";

export function SiteFooter() {
  const { brand, contact } = landingContent;
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">

        {/* Col 1 — Brand */}
        <div className="footer-brand-col">
          <Link href="/" className="footer-brand-mark" aria-label={brand.name}>
            {brand.logoUrl ? (
              <Image
                src={brand.logoUrl}
                alt=""
                width={90}
                height={90}
                style={{
                  objectFit: "contain",
                  filter: "invert(1) hue-rotate(180deg)",
                  mixBlendMode: "screen",
                  display: "block",
                }}
              />
            ) : (
              <span className="footer-brand-dot">{brand.initials}</span>
            )}
            <span className="footer-brand-name">
              Johanna Figueredo<em> Studio</em>
              <span className="footer-brand-sub">Salón · Lima</span>
            </span>
          </Link>
          <p className="footer-brand-desc">
            Boutique de belleza dedicada a cortes, color y peinados de autor. Atención personalizada en un espacio íntimo en Miraflores.
          </p>
        </div>

        {/* Col 2 — Navegación */}
        <div className="footer-col">
          <h4 className="footer-col-title">Navegación</h4>
          <ul className="footer-col-links">
            <li><Link href="/#servicios">Servicios</Link></li>
            <li><Link href="/#sobre">Sobre Johanna</Link></li>
            <li><Link href="/#galeria">Galería</Link></li>
            <li><Link href="/#testimonios">Testimonios</Link></li>
            <li><Link href="/#ubicacion">Ubicación</Link></li>
          </ul>
        </div>

        {/* Col 3 — Reservas */}
        <div className="footer-col">
          <h4 className="footer-col-title">Reservas</h4>
          <ul className="footer-col-links">
            <li><Link href="/reservar">Reservar online</Link></li>
            <li><Link href="/reservar">Reagendar cita</Link></li>
            <li><Link href="/#contacto">Política de cancelación</Link></li>
            <li><Link href="/#contacto">Preguntas frecuentes</Link></li>
          </ul>
        </div>

        {/* Col 4 — Contacto */}
        <div className="footer-col">
          <h4 className="footer-col-title">Contacto</h4>
          <ul className="footer-col-links">
            <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
            <li><a href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}>{contact.phone}</a></li>
            {contact.instagram ? (
              <li><a href={contact.instagram} target="_blank" rel="noreferrer">Instagram · @jfigueredo07</a></li>
            ) : null}
            {contact.tiktok ? (
              <li><a href={contact.tiktok} target="_blank" rel="noreferrer">TikTok · @jfigueredo07</a></li>
            ) : null}
          </ul>
        </div>

      </div>

      <div className="site-footer-bottom">
        <span>© {year} Johanna Figueredo Studio</span>
        <span>By Gambitho Labs · Lima Perú</span>
      </div>
    </footer>
  );
}
