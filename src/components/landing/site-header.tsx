import Link from "next/link";

import { landingContent } from "@/content/landing";

const navLinks = [
  { label: "Servicios", href: "/#servicios" },
  { label: "Sobre", href: "/#sobre" },
  { label: "Galeria", href: "/#galeria" },
  { label: "Contacto", href: "/#contacto" }
];

export function SiteHeader() {
  const { brand } = landingContent;

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand-mark" href="/" aria-label={brand.name}>
          <span className="brand-dot">{brand.initials}</span>
          <span>{brand.name}</span>
        </Link>
        <nav className="site-nav" aria-label="Navegacion principal">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="site-nav-link">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="button-row">
          <Link className="btn" href="/reservar">
            Reservar
          </Link>
        </div>
      </div>
    </header>
  );
}
