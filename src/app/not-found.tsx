import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <div className="card" style={{ textAlign: "center", maxWidth: 480 }}>
        <p className="eyebrow">404</p>
        <h1 className="title" style={{ fontSize: "2rem" }}>
          Pagina no encontrada
        </h1>
        <p className="subtitle">La direccion que buscas no existe o fue movida.</p>
        <div className="button-row" style={{ justifyContent: "center", marginTop: 18 }}>
          <Link className="btn" href="/">
            Volver al inicio
          </Link>
          <Link className="btn secondary" href="/reservar">
            Reservar cita
          </Link>
        </div>
      </div>
    </main>
  );
}
