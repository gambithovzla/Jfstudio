import { PasswordInput } from "./password-input";

export const metadata = { title: "Acceso admin" };

export default function LoginPage() {
  return (
    <main className="booking-page">
      <section className="card" style={{ maxWidth: 400, margin: "0 auto" }}>
        <p className="eyebrow">Admin</p>
        <h1 className="title">Acceso</h1>
        <form className="form-grid" action="/api/auth/login" method="POST">
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <PasswordInput />
          </div>
          <button className="btn" type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
