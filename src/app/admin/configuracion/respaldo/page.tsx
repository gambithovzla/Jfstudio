import { Database, Download, FileSpreadsheet, ShieldCheck } from "lucide-react";

import { BackupAutoFolder } from "@/components/backup-auto-folder";

export const dynamic = "force-dynamic";

export default function RespaldoPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Configuración</p>
          <h1 className="title">Respaldo de datos</h1>
          <p className="subtitle">Copia de seguridad de toda tu información: clientes, citas, pagos, servicios y más.</p>
        </div>
      </div>

      <div className="grid two">
        {/* Descarga manual */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Descargar ahora</h2>
            <Download size={20} aria-hidden />
          </div>
          <p className="small muted" style={{ marginBottom: 16 }}>
            Guarda una copia en esta computadora. El <strong>archivo de datos</strong> sirve para restaurar todo si
            hiciera falta; el <strong>Excel</strong> es solo para consultar a ojo.
          </p>
          <div className="button-row">
            <a className="btn" href="/api/admin/backup?format=json" download>
              <Database size={16} aria-hidden />
              Descargar respaldo (datos)
            </a>
            <a className="btn secondary" href="/api/admin/backup?format=xlsx" download>
              <FileSpreadsheet size={16} aria-hidden />
              Descargar Excel legible
            </a>
          </div>
        </section>

        {/* Respaldo automático (informativo) */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Respaldo automático</h2>
            <ShieldCheck size={20} aria-hidden />
          </div>
          <p className="small muted">
            Cada día se genera un respaldo automático que se guarda <strong>cifrado en la nube, fuera de Railway</strong>.
            Tu correo solo recibe un aviso de que salió bien (sin datos de clientas adjuntos) — así tu información
            queda protegida aunque la plataforma falle, sin exponerla por email.
          </p>
        </section>

        {/* Carpeta automática en la PC (PWA / File System Access) */}
        <BackupAutoFolder />
      </div>
    </>
  );
}
