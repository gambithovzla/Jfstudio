export default function RootLoading() {
  return (
    <main className="page" style={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
      <div className="loader" aria-label="Cargando" role="status">
        <span className="loader-dot" />
        <span className="loader-dot" />
        <span className="loader-dot" />
      </div>
    </main>
  );
}
