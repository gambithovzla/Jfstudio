"use client";

import { useState } from "react";

export default function ImportPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  async function handleImport() {
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/import-clients", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setResult({ imported: 0, skipped: 0, errors: [data.error ?? "Error desconocido"] });
      } else {
        setResult(data);
        setStatus("done");
      }
    } catch {
      setStatus("error");
      setResult({ imported: 0, skipped: 0, errors: ["No se pudo conectar con el servidor"] });
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1 className="title">Importar base de clientas</h1>
          <p className="subtitle">
            Importa las clientas desde el archivo Excel <strong>Base de Clientes JF.xlsx</strong>.
            Las clientas que ya existen (mismo teléfono) se omiten automáticamente.
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        {status === "idle" && (
          <>
            <p className="small muted" style={{ marginBottom: 16 }}>
              Este proceso es seguro de ejecutar varias veces — no crea duplicados.
            </p>
            <button className="btn" onClick={handleImport}>
              Importar clientas del Excel
            </button>
          </>
        )}

        {status === "loading" && (
          <p className="subtitle">Importando... puede tardar unos segundos.</p>
        )}

        {(status === "done" || status === "error") && result && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <p className="eyebrow">Importadas</p>
                <p className="title" style={{ color: "var(--brand)" }}>{result.imported}</p>
              </div>
              <div>
                <p className="eyebrow">Omitidas</p>
                <p className="title">{result.skipped}</p>
              </div>
              <div>
                <p className="eyebrow">Errores</p>
                <p className="title" style={{ color: result.errors.length > 0 ? "var(--accent)" : undefined }}>
                  {result.errors.length}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <p className="small muted" style={{ marginBottom: 4 }}>Errores:</p>
                <ul style={{ paddingLeft: 16 }}>
                  {result.errors.map((e, i) => (
                    <li key={i} className="small" style={{ color: "var(--accent)" }}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {status === "done" && (
              <a className="btn" href="/admin/clientes">
                Ver historial de clientas
              </a>
            )}
            {status === "error" && (
              <button className="btn secondary" onClick={() => setStatus("idle")}>
                Reintentar
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
