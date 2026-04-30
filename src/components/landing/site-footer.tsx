import Link from "next/link";

import { landingContent } from "@/content/landing";

export function SiteFooter() {
  const { brand, contact } = landingContent;
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <span className="brand-mark" aria-label={brand.name}>
            <span className="brand-dot">{brand.initials}</span>
            <span>{brand.name}</span>
          </span>
          <p className="small muted" style={{ marginTop: 8 }}>
            {brand.tagline}
          </p>
        </div>
        <nav className="site-footer-nav" aria-label="Pie de pagina">
          <Link href="/#servicios">Servicios</Link>
          <Link href="/#sobre">Sobre</Link>
          <Link href="/#contacto">Contacto</Link>
          <Link href="/reservar">Reservar</Link>
        </nav>
        <div>
          <p className="small muted">
            {contact.phone} · {contact.email}
          </p>
        </div>
      </div>
      <div className="site-footer-bottom small muted">
        © {year} {brand.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
