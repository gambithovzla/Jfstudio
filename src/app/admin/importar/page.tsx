"use client";

import Link from "next/link";
import { useState } from "react";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ imported: number; updated?: number; skipped: number; errors: string[] } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setStatus("loading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/import-clients", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setResult({ imported: 0, updated: 0, skipped: 0, errors: [data.error ?? "Error desconocido"] });
      } else {
        setResult(data);
        setStatus("done");
      }
    } catch {
      setStatus("error");
      setResult({ imported: 0, updated: 0, skipped: 0, errors: ["No se pudo conectar con el servidor"] });
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1 className="title">Importar clientas desde Excel</h1>
          <p className="subtitle">
            Sube el archivo <strong>.xlsx</strong> con la base de clientas. Las clientas que ya existen
            (mismo teléfono) se omiten automáticamente. Si agregas una columna <strong>Cumpleaños</strong>
            (o <em>Fecha de nacimiento</em>), las clientas existentes sin esa fecha se actualizarán.
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        {status !== "done" && (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <div className="field">
              <label htmlFor="file">Archivo Excel (.xlsx)</label>
              <input
                className="input"
                id="file"
                type="file"
                accept=".xlsx,.xls"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="button-row">
              <button className="btn" type="submit" disabled={!file || status === "loading"}>
                {status === "loading" ? "Importando..." : "Importar clientas"}
              </button>
            </div>
            {status === "loading" && (
              <p className="small muted">Procesando el archivo, puede tardar unos segundos...</p>
            )}
          </form>
        )}

        {(status === "done" || status === "error") && result && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              <div>
                <p className="eyebrow">Importadas</p>
                <p className="title" style={{ color: "var(--brand)" }}>{result.imported}</p>
              </div>
              <div>
                <p className="eyebrow">Actualizadas</p>
                <p className="title">{result.updated ?? 0}</p>
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
                <p className="small muted" style={{ marginBottom: 4 }}>Detalles de errores:</p>
                <ul style={{ paddingLeft: 16, display: "grid", gap: 4 }}>
                  {result.errors.map((e, i) => (
                    <li key={i} className="small" style={{ color: "var(--accent)" }}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="button-row">
              {status === "done" && (
                <Link className="btn" href="/admin/clientes">Ver historial de clientas</Link>
              )}
              <button className="btn secondary" onClick={() => { setStatus("idle"); setFile(null); setResult(null); }}>
                Importar otro archivo
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
