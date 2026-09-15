import Link from "next/link";

import { resetAdminPasswordAction } from "@/lib/actions";
import { FlashMessage } from "@/components/flash-message";
import { PasswordInput } from "../login/password-input";

export const metadata = { title: "Restablecer contraseña · Admin" };

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; msg?: string }>;
}) {
  const { token, msg } = await searchParams;

  if (!token) {
    return (
      <main className="booking-page">
        <section className="card" style={{ maxWidth: 400, margin: "0 auto" }}>
          <h1 className="title">Enlace inválido</h1>
          <FlashMessage msg="error_token" />
          <p style={{ marginTop: 16, fontSize: "0.85rem" }}>
            <Link href="/admin/forgot" style={{ color: "var(--primary)" }}>
              Solicitar un nuevo enlace
            </Link>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <section className="card" style={{ maxWidth: 400, margin: "0 auto" }}>
        <p className="eyebrow">Admin</p>
        <h1 className="title">Nueva contraseña</h1>
        <FlashMessage msg={msg} />
        <form className="form-grid" action={resetAdminPasswordAction}>
          <input type="hidden" name="token" value={token} />
          <div className="field">
            <label htmlFor="newPassword">Nueva contraseña</label>
            <PasswordInput id="newPassword" name="newPassword" />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Repite la contraseña</label>
            <PasswordInput id="confirmPassword" name="confirmPassword" autoFocus={false} />
          </div>
          <button className="btn" type="submit">
            Guardar nueva contraseña
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