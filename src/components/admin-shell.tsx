import {
  Ban,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Package,
  Scissors,
  Settings,
  Users
} from "lucide-react";
import Link from "next/link";

import { getAuthContext } from "@/lib/auth";

type NavLink = { href: string; label: string; icon: React.FC<{ size?: number; "aria-hidden"?: boolean }> };

const allLinks: (NavLink & { roles?: string[] })[] = [
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/clientes", label: "Clientes", icon: Users, roles: ["ADMIN", "RECEPTIONIST"] },
  { href: "/admin/servicios", label: "Servicios", icon: Scissors, roles: ["ADMIN"] },
  { href: "/admin/productos", label: "Productos", icon: Package, roles: ["ADMIN"] },
  { href: "/admin/caja", label: "Caja", icon: CreditCard, roles: ["ADMIN", "RECEPTIONIST"] },
  { href: "/admin/configuracion", label: "Configuracion", icon: Settings, roles: ["ADMIN"] },
  { href: "/admin/configuracion/bloqueos", label: "Bloqueos", icon: Ban, roles: ["ADMIN"] }
];

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const { role, needsClerkSetup } = await getAuthContext();
  const visibleLinks = allLinks.filter((link) => !link.roles || needsClerkSetup || (role && link.roles.includes(role)));

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <Link className="brand-mark" href="/admin/agenda">
          <span className="brand-dot">JF</span>
          <span>JF Studio</span>
        </Link>
        <nav className="sidebar-nav" aria-label="Admin">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link className="nav-link" href={link.href} key={link.href}>
                <Icon aria-hidden size={18} />
                {link.label}
              </Link>
            );
          })}
          <Link className="nav-link" href="/reservar">
            <ClipboardList aria-hidden size={18} />
            Reservar
          </Link>
        </nav>
      </aside>
      <main className="page">{children}</main>
    </div>
  );
}
