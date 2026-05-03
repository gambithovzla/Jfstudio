"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Servicios", href: "/#servicios" },
  { label: "Sobre", href: "/#sobre" },
  { label: "Galería", href: "/#galeria" },
  { label: "Contacto", href: "/#contacto" },
  { label: "Reservar", href: "/reservar" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const close = () => setOpen(false);

  const overlay = (
    <>
      <div
        className={`mobile-nav-overlay ${open ? "open" : ""}`}
        onClick={close}
        aria-hidden
      />
      <nav className={`mobile-nav-panel ${open ? "open" : ""}`} aria-label="Menú móvil">
        <button
          className="mobile-nav-close"
          onClick={close}
          aria-label="Cerrar menú"
        >
          <X size={24} />
        </button>

        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="mobile-nav-link"
            onClick={close}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu size={24} />
      </button>
      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
