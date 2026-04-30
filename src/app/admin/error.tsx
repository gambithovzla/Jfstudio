"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] error", error);
  }, [error]);

  return (
    <div className="card" style={{ maxWidth: 560, margin: "32px auto" }}>
      <p className="eyebrow">Error</p>
      <h2 className="card-title" style={{ fontSize: "1.25rem", marginTop: 4 }}>
        No pudimos cargar esta seccion
      </h2>
      <p className="small muted" style={{ marginTop: 6 }}>
        {error.message || "Error inesperado en el panel administrativo."}
      </p>
      {error.digest ? (
        <p className="small muted" style={{ marginTop: 4 }}>
          Ref: {error.digest}
        </p>
      ) : null}
      <div className="button-row" style={{ marginTop: 14 }}>
        <button className="btn" type="button" onClick={() => reset()}>
          Reintentar
        </button>
        <a className="btn secondary" href="/admin">
          Volver al panel
        </a>
      </div>
    </div>
  );
}
