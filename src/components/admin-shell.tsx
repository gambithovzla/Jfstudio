import {
  Ban,
  CalendarDays,
  Cake,
  ClipboardList,
  CreditCard,
  LogOut,
  Package,
  Scissors,
  Settings,
  Upload,
  Users,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";

import { AdminMobileNav, type AdminNavLink } from "./admin-mobile-nav";

const iconMap: Record<string, LucideIcon> = {
  CalendarDays,
  Users,
  Cake,
  Scissors,
  Package,
  CreditCard,
  Settings,
  Ban,
  Upload,
  ClipboardList
};

const navLinks: AdminNavLink[] = [
  { href: "/admin/agenda", label: "Agenda", iconName: "CalendarDays" },
  { href: "/admin/clientes", label: "Clientes", iconName: "Users" },
  { href: "/admin/cumpleanos", label: "Cumpleaños", iconName: "Cake" },
  { href: "/admin/servicios", label: "Servicios", iconName: "Scissors" },
  { href: "/admin/productos", label: "Productos", iconName: "Package" },
  { href: "/admin/caja", label: "Caja", iconName: "CreditCard" },
  { href: "/admin/configuracion", label: "Configuración", iconName: "Settings" },
  { href: "/admin/configuracion/bloqueos", label: "Bloqueos", iconName: "Ban" },
  { href: "/admin/importar", label: "Importar Excel", iconName: "Upload" }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout">
      <AdminMobileNav links={navLinks} />
      <aside className="sidebar">
        <Link className="brand-mark" href="/admin/agenda">
          <span className="brand-dot">JF</span>
          <span>JF Studio</span>
        </Link>
        <nav className="sidebar-nav" aria-label="Admin">
          {navLinks.map((link) => {
            const Icon = iconMap[link.iconName];
            return (
              <Link className="nav-link" href={link.href} key={link.href}>
                {Icon ? <Icon aria-hidden size={18} /> : null}
                {link.label}
              </Link>
            );
          })}
          <Link className="nav-link" href="/reservar">
            <ClipboardList aria-hidden size={18} />
            Reservar
          </Link>
        </nav>
        <form action="/api/auth/logout" method="POST" style={{ marginTop: "auto" }}>
          <button className="nav-link" type="submit" style={{ width: "100%", background: "none", border: "none", cursor: "pointer" }}>
            <LogOut aria-hidden size={18} />
            Cerrar sesión
          </button>
        </form>
      </aside>
      <main className="page">{children}</main>
    </div>
  );
}
