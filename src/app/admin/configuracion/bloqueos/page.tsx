import { Trash2 } from "lucide-react";

import { createTimeBlockAction, deleteTimeBlockAction } from "@/lib/actions";
import { getSalonSettings } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function TimeBlocksPage() {
  const [settings, blocks, staff] = await Promise.all([
    getSalonSettings(),
    prisma.timeBlock.findMany({
      orderBy: { startAt: "asc" },
      include: { staff: { select: { name: true } } }
    }),
    prisma.staff.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } })
  ]);

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: settings.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Configuracion</p>
          <h1 className="title">Bloqueos de horario</h1>
          <p className="subtitle">Vacaciones, feriados y eventos que bloquean disponibilidad.</p>
        </div>
      </div>

      <div className="grid two">
        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 16 }}>Nuevo bloqueo</h2>
          <form className="form-grid" action={createTimeBlockAction}>
            <div className="grid two">
              <div className="field">
                <label htmlFor="startDate">Inicio (fecha)</label>
                <input className="input" id="startDate" name="startDate" type="date" defaultValue={today} required />
              </div>
              <div className="field">
                <label htmlFor="startTime">Hora inicio</label>
                <input className="input" id="startTime" name="startTime" type="time" defaultValue="00:00" />
              </div>
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="endDate">Fin (fecha)</label>
                <input className="input" id="endDate" name="endDate" type="date" defaultValue={today} required />
              </div>
              <div className="field">
                <label htmlFor="endTime">Hora fin</label>
                <input className="input" id="endTime" name="endTime" type="time" defaultValue="23:59" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="staffId">Staff (dejar vacío = todos)</label>
              <select className="select" id="staffId" name="staffId">
                <option value="">Todos</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="reason">Motivo</label>
              <input className="input" id="reason" name="reason" placeholder="Vacaciones, feriado, evento..." />
            </div>
            <button className="btn" type="submit">Crear bloqueo</button>
          </form>
        </section>

        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>Bloqueos activos</h2>
          {blocks.length === 0 ? (
            <p className="small muted">No hay bloqueos configurados.</p>
          ) : (
            <div className="form-grid">
              {blocks.map((block) => (
                <div key={block.id} className="card" style={{ boxShadow: "none", padding: "10px 14px" }}>
                  <div className="button-row" style={{ justifyContent: "space-between" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>
                        {formatDateInZone(block.startAt, settings.timezone)} {formatTimeInZone(block.startAt, settings.timezone)}
                        {" → "}
                        {formatDateInZone(block.endAt, settings.timezone)} {formatTimeInZone(block.endAt, settings.timezone)}
                      </p>
                      <p className="small muted" style={{ margin: "2px 0 0" }}>
                        {block.staff ? block.staff.name : "Todos los staff"}
                        {block.reason ? ` · ${block.reason}` : ""}
                      </p>
                    </div>
                    <form action={deleteTimeBlockAction}>
                      <input type="hidden" name="blockId" value={block.id} />
                      <button className="btn danger" type="submit" style={{ minHeight: 34, padding: "0 10px" }}>
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
