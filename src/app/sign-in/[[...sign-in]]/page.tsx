import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="booking-page">
        <div className="card">
          <p className="eyebrow">Admin</p>
          <h1 className="title">Configura Clerk</h1>
          <p className="subtitle">
            Agrega las variables de Clerk para activar el inicio de sesion administrativo.
          </p>
          <div className="button-row" style={{ marginTop: 18 }}>
            <Link className="btn" href="/admin">
              Entrar en desarrollo
            </Link>
            <Link className="btn secondary" href="/reservar">
              Ver reservas
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <div className="card" style={{ display: "grid", placeItems: "center" }}>
        <SignIn routing="path" path="/sign-in" />
      </div>
    </main>
  );
}
