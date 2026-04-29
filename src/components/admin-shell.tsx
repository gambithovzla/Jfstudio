import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  Package,
  Scissors,
  Settings,
  Users
} from "lucide-react";
import Link from "next/link";

const links = [
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/servicios", label: "Servicios", icon: Scissors },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/caja", label: "Caja", icon: CreditCard },
  { href: "/admin/configuracion", label: "Configuracion", icon: Settings }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <Link className="brand-mark" href="/admin/agenda">
          <span className="brand-dot">JF</span>
          <span>JF Studio</span>
        </Link>
        <nav className="sidebar-nav" aria-label="Admin">
          {links.map((link) => {
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
