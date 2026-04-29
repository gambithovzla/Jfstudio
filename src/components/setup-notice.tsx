export function SetupNotice({ message }: { message?: string }) {
  return (
    <main className="booking-page">
      <div className="card">
        <p className="eyebrow">Configuracion</p>
        <h1 className="title">Base de datos pendiente</h1>
        <p className="subtitle">
          {message ??
            "Configura DATABASE_URL, ejecuta las migraciones y carga el seed para empezar a operar."}
        </p>
      </div>
    </main>
  );
}
