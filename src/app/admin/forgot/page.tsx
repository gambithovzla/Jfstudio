import Link from "next/link";

import { requestAdminPasswordResetAction } from "@/lib/actions";
import { FlashMessage } from "@/components/flash-message";

export const metadata = { title: "Recuperar contraseña · Admin" };

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;

  return (
    <main className="booking-page">
      <section className="card" style={{ maxWidth: 400, margin: "0 auto" }}>
        <p className="eyebrow">Admin</p>
        <h1 className="title">Recuperar contraseña</h1>
        <FlashMessage msg={msg} />
        <p className="muted" style={{ marginBottom: 16, fontSize: "0.9rem" }}>
          Ingresa el correo del panel. Si coincide con el configurado (ADMIN_EMAIL),
          te enviaremos un enlace de un solo uso.
        </p>
        <form className="form-grid" action={requestAdminPasswordResetAction}>
          <div className="field">
            <label htmlFor="email">Correo del panel</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <button className="btn" type="submit">
            Enviar enlace
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: "0.85rem" }}>
          <Link href="/admin/login" style={{ color: "var(--primary)" }}>
            ← Volver al acceso
          </Link>
        </p>
      </section>
    </main>
  );
}