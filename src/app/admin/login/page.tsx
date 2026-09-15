import Link from "next/link";

import { FlashMessage } from "@/components/flash-message";
import { PasswordInput } from "./password-input";

export const metadata = { title: "Acceso admin" };

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ msg?: string; error?: string }>;
}) {
  const { msg, error } = await searchParams;

  return (
    <main className="booking-page">
      <section className="card" style={{ maxWidth: 400, margin: "0 auto" }}>
        <p className="eyebrow">Admin</p>
        <h1 className="title">Acceso</h1>
        <FlashMessage msg={msg} />
        {error ? (
          <div className="flash-message flash-error" role="alert">
            Contraseña incorrecta. Vuelve a intentar.
          </div>
        ) : null}
        <form className="form-grid" action="/api/auth/login" method="POST">
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <PasswordInput />
          </div>
          <button className="btn" type="submit">
            Entrar
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: "0.85rem", textAlign: "center" }}>
          <Link href="/admin/forgot" style={{ color: "var(--primary)" }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </section>
    </main>
  );
}