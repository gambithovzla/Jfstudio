import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  if (session.needsClerkSetup) {
    return (
      <main className="booking-page">
        <section className="card">
          <p className="eyebrow">Admin</p>
          <h1 className="title">Falta configurar el acceso</h1>
          <p className="subtitle">
            El panel administrativo necesita las variables de Clerk en Railway:
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY y CLERK_SECRET_KEY.
          </p>
        </section>
      </main>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
