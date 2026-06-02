"use client";

import { useEffect, useState } from "react";
import { Database, ShieldAlert, X } from "lucide-react";

const STORAGE_KEY = "jf-last-backup";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Marca que hoy ya se descargó (o guardó) un respaldo. Compartido con la carpeta PWA. */
export function markBackupDoneToday() {
  try {
    localStorage.setItem(STORAGE_KEY, todayStr());
  } catch {
    // localStorage no disponible (modo privado, etc.): ignorar.
  }
}

/**
 * Banner discreto y descartable que avisa cuando aún no se ha descargado el respaldo del día.
 * El estado vive en localStorage (por dispositivo), suficiente para un recordatorio.
 */
export function BackupReminder() {
  const [needsBackup, setNeedsBackup] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setNeedsBackup(localStorage.getItem(STORAGE_KEY) !== todayStr());
    } catch {
      setNeedsBackup(false);
    }
  }, []);

  if (!needsBackup || dismissed) return null;

  return (
    <div
      className="card"
      style={{
        borderLeft: "4px solid #c4587a",
        background: "#fdf4f7",
        marginBottom: 16,
        display: "flex",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap"
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <ShieldAlert size={20} aria-hidden style={{ color: "#c4587a", flexShrink: 0 }} />
        <p className="small" style={{ margin: 0 }}>
          <strong>Aún no descargaste el respaldo de hoy.</strong> Guarda una copia para no perder tu información.
        </p>
      </div>
      <div className="button-row">
        <a
          className="btn"
          href="/api/admin/backup?format=json"
          download
          onClick={() => {
            markBackupDoneToday();
            setDismissed(true);
          }}
        >
          <Database size={16} aria-hidden />
          Descargar ahora
        </a>
        <button
          className="btn secondary"
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Descartar recordatorio"
          style={{ padding: "0 10px" }}
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
