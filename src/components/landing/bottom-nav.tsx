"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarHeart, Camera, Home, MessageCircle, Scissors } from "lucide-react";

const NAV_ITEMS = [
  { label: "Inicio",    href: "/",           icon: Home },
  { label: "Servicios", href: "/#servicios",  icon: Scissors },
  { label: "Galería",   href: "/#galeria",    icon: Camera },
  { label: "Contacto",  href: "/#contacto",   icon: MessageCircle },
  { label: "Reservar",  href: "/reservar",    icon: CalendarHeart, primary: true },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Navegación móvil">
      {NAV_ITEMS.map(({ label, href, icon: Icon, primary }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href.replace(/#.*/, "")) && href !== "/";
        return (
          <Link
            key={href}
            href={href}
            className={[
              "bottom-nav-item",
              primary ? "bottom-nav-item--primary" : "",
              active  ? "active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Icon size={22} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
