import Link from "next/link";
import Image from "next/image";

import { landingContent } from "@/content/landing";
import { MobileNav } from "./mobile-nav";

const navLinks = [
  { label: "Servicios", href: "/#servicios" },
  { label: "Sobre", href: "/#sobre" },
  { label: "Galeria", href: "/#galeria" },
  { label: "Contacto", href: "/#contacto" },
];

export function SiteHeader() {
  const { brand } = landingContent;

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand-mark" href="/" aria-label={brand.name}>
          {brand.logoUrl ? (
            <Image
              src={brand.logoUrl}
              alt={brand.name}
              width={36}
              height={36}
              priority
              style={{ borderRadius: 6, mixBlendMode: "multiply" }}
            />
          ) : (
            <span className="brand-dot">{brand.initials}</span>
          )}
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
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
