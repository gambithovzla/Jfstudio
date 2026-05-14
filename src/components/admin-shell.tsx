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
  Star,
  Upload,
  Users,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
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
  ClipboardList,
  Star
};

const navLinks: AdminNavLink[] = [
  { href: "/admin/agenda", label: "Agenda", iconName: "CalendarDays" },
  { href: "/admin/clientes", label: "Clientes", iconName: "Users" },
  { href: "/admin/cumpleanos", label: "Cumpleaños", iconName: "Cake" },
  { href: "/admin/servicios", label: "Servicios", iconName: "Scissors" },
  { href: "/admin/productos", label: "Productos", iconName: "Package" },
  { href: "/admin/caja", label: "Caja", iconName: "CreditCard" },
  { href: "/admin/testimonios", label: "Testimonios", iconName: "Star" },
  { href: "/admin/configuracion", label: "Configuración", iconName: "Settings" },
  { href: "/admin/configuracion/bloqueos", label: "Bloqueos", iconName: "Ban" },
  { href: "/admin/importar", label: "Importar Excel", iconName: "Upload" }
];

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const [allProducts, todayAppointmentCount] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { stock: true, lowStockThreshold: true }
    }),
    prisma.appointment.count({
      where: { status: "CONFIRMED", startAt: { gte: new Date() } }
    })
  ]);

  const lowStockCount = allProducts.filter(
    (p) => Number(p.stock) <= Number(p.lowStockThreshold)
  ).length;

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
            const showBadge = link.href === "/admin/productos" && lowStockCount > 0;
            const showAgendaBadge = link.href === "/admin/agenda" && todayAppointmentCount > 0;
            return (
              <Link className="nav-link" href={link.href} key={link.href} style={{ justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {Icon ? <Icon aria-hidden size={18} /> : null}
                  {link.label}
                </span>
                {showBadge ? (
                  <span style={{ background: "#b91c1c", color: "#fff", borderRadius: 10, fontSize: "0.68rem", fontWeight: 700, padding: "1px 7px", minWidth: 18, textAlign: "center" }}>
                    {lowStockCount}
                  </span>
                ) : null}
                {showAgendaBadge ? (
                  <span style={{ background: "#c4587a", color: "#fff", borderRadius: 10, fontSize: "0.68rem", fontWeight: 700, padding: "1px 7px", minWidth: 18, textAlign: "center" }}>
                    {todayAppointmentCount}
                  </span>
                ) : null}
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
