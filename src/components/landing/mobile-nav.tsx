"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Servicios", href: "/#servicios" },
  { label: "Sobre", href: "/#sobre" },
  { label: "Galeria", href: "/#galeria" },
  { label: "Contacto", href: "/#contacto" },
  { label: "Reservar", href: "/reservar" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu size={24} />
      </button>

      <div
        className={`mobile-nav-overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />

      <nav className={`mobile-nav-panel ${open ? "open" : ""}`} aria-label="Menu movil">
        <button
          className="mobile-nav-close"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menu"
        >
          <X size={24} />
        </button>

        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="mobile-nav-link"
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
