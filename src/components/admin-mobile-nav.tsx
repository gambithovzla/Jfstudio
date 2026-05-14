"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Ban, CalendarDays, Cake, ClipboardList, CreditCard, Images, Menu, Package, Scissors, Settings, Star, Upload, Users,
  X, LogOut, type LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  CalendarDays, Users, Cake, Scissors, Package,
  CreditCard, Settings, Ban, Upload, ClipboardList, Star, Images
};

export type AdminNavLink = {
  href: string;
  label: string;
  iconName: string;
};

type Props = {
  links: AdminNavLink[];
};

export function AdminMobileNav({ links }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const close = () => setOpen(false);

  const isActive = (href: string) => {
    if (href === "/admin/agenda") {
      return pathname === href || pathname === "/admin";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const overlay = (
    <>
      <div
        className={`mobile-nav-overlay ${open ? "open" : ""}`}
        onClick={close}
        aria-hidden
      />
      <nav className={`mobile-nav-panel admin-nav-panel ${open ? "open" : ""}`} aria-label="Menú admin">
        <button
          className="mobile-nav-close"
          onClick={close}
          aria-label="Cerrar menú"
        >
          <X size={24} />
        </button>

        {links.map((link) => {
          const Icon = iconMap[link.iconName];
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`mobile-nav-link admin-mobile-nav-link${active ? " active" : ""}`}
              onClick={close}
            >
              {Icon ? <Icon size={18} aria-hidden /> : null}
              <span>{link.label}</span>
            </Link>
          );
        })}

        <form action="/api/auth/logout" method="POST" style={{ marginTop: 16 }}>
          <button
            type="submit"
            className="mobile-nav-link admin-mobile-nav-link"
            style={{ width: "100%", background: "none", border: 0, textAlign: "left", cursor: "pointer" }}
          >
            <LogOut size={18} aria-hidden />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </nav>
    </>
  );

  return (
    <>
      <div className="admin-topbar-mobile">
        <Link className="admin-topbar-brand" href="/admin/agenda" onClick={close}>
          <span className="brand-dot">JF</span>
          <span>JF Studio</span>
        </Link>
        <button
          className="admin-topbar-menu-btn"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú admin"
        >
          <Menu size={24} />
        </button>
      </div>
      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
