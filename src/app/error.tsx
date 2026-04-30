"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="page" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <div className="card" style={{ textAlign: "center", maxWidth: 520 }}>
        <p className="eyebrow">Error</p>
        <h1 className="title" style={{ fontSize: "1.8rem" }}>
          Algo salio mal
        </h1>
        <p className="subtitle">
          Ocurrio un error inesperado. Vuelve a intentarlo o regresa al inicio.
        </p>
        {error.digest ? (
          <p className="small muted" style={{ marginTop: 8 }}>
            Ref: {error.digest}
          </p>
        ) : null}
        <div className="button-row" style={{ justifyContent: "center", marginTop: 18 }}>
          <button className="btn" type="button" onClick={() => reset()}>
            Reintentar
          </button>
          <Link className="btn secondary" href="/">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
