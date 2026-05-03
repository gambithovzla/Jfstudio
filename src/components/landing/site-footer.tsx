import Link from "next/link";
import Image from "next/image";
import { Camera, Music } from "lucide-react";

import { landingContent } from "@/content/landing";

export function SiteFooter() {
  const { brand, contact } = landingContent;
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <span className="brand-mark" aria-label={brand.name}>
            {brand.logoUrl ? (
              <Image
                src={brand.logoUrl}
                alt={brand.name}
                width={32}
                height={32}
                style={{ borderRadius: 6 }}
              />
            ) : (
              <span className="brand-dot">{brand.initials}</span>
            )}
            <span>{brand.name}</span>
          </span>
          <p className="small" style={{ marginTop: 8, opacity: 0.7 }}>
            {brand.tagline}
          </p>
        </div>
        <nav className="site-footer-nav" aria-label="Pie de página">
          <Link href="/#servicios">Servicios</Link>
          <Link href="/#sobre">Sobre</Link>
          <Link href="/#contacto">Contacto</Link>
          <Link href="/reservar">Reservar</Link>
        </nav>
        <div>
          <p className="small" style={{ opacity: 0.7, marginBottom: 12 }}>
            {contact.phone} · {contact.email}
          </p>
          <div className="site-footer-social">
            {contact.instagram ? (
              <a
                href={contact.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <Camera size={18} />
              </a>
            ) : null}
            {contact.tiktok ? (
              <a
                href={contact.tiktok}
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
              >
                <Music size={18} />
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="site-footer-bottom small">
        &copy; {year} {brand.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
