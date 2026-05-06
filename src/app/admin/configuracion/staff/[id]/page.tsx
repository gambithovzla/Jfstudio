import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createWorkingHourAction, deactivateStaffAction, updateStaffAction, updateWorkingHourAction } from "@/lib/actions";
import { getStaffById } from "@/lib/data";
import { FlashMessage } from "@/components/flash-message";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ msg?: string }>;
};

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const ROLES = [
  { value: "ADMIN", label: "Administrador" },
  { value: "STYLIST", label: "Estilista" },
  { value: "RECEPTIONIST", label: "Recepcionista" }
];

export default async function EditStaffPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const staff = await getStaffById(id);

  if (!staff) {
    notFound();
  }

  return (
    <>
      <FlashMessage msg={sp.msg} />
      <div className="page-header">
        <div>
          <p className="eyebrow">Staff</p>
          <h1 className="title">{staff.name}</h1>
          <p className="subtitle">{ROLES.find((r) => r.value === staff.role)?.label ?? staff.role}</p>
        </div>
        <Link className="btn secondary" href="/admin/configuracion">
          <ArrowLeft size={17} aria-hidden />
          Volver
        </Link>
      </div>

      <div className="grid two">
        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 16 }}>Datos del staff</h2>
          <form className="form-grid" action={updateStaffAction}>
            <input type="hidden" name="staffId" value={staff.id} />
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input className="input" id="name" name="name" defaultValue={staff.name} required />
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input className="input" id="email" name="email" type="email" defaultValue={staff.email ?? ""} />
              </div>
              <div className="field">
                <label htmlFor="phone">Telefono</label>
                <input className="input" id="phone" name="phone" defaultValue={staff.phone ?? ""} />
              </div>
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="role">Rol</label>
                <select className="select" id="role" name="role">
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value} selected={r.value === staff.role}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="color">Color en agenda</label>
                <input className="input" id="color" name="color" type="color" defaultValue={staff.color} />
              </div>
            </div>
            <button className="btn" type="submit">Guardar cambios</button>
          </form>

          {staff.isActive ? (
            <>
              <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "20px 0" }} />
              <form action={deactivateStaffAction}>
                <input type="hidden" name="staffId" value={staff.id} />
                <p className="small muted" style={{ marginBottom: 10 }}>
                  Desactivar oculta a este staff del sistema de reservas. No elimina sus citas pasadas.
                </p>
                <button className="btn danger" type="submit">
                  Desactivar staff
                </button>
              </form>
            </>
          ) : (
            <p className="small muted" style={{ marginTop: 16 }}>
              Este staff esta desactivado.
            </p>
          )}
        </section>

        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 4 }}>Horario laboral</h2>
          <p className="small muted" style={{ marginBottom: 16 }}>
            Configura los dias y horas en que este staff acepta citas.
          </p>
          <div className="form-grid">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const wh = staff.workingHours.find((w) => w.dayOfWeek === day);
              if (!wh) {
                return (
                  <div key={day} className="card" style={{ boxShadow: "none", borderStyle: "dashed" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <strong>{DAY_NAMES[day]}</strong>
                      <span className="small muted">Sin horario configurado</span>
                    </div>
                    <form action={createWorkingHourAction}>
                      <input type="hidden" name="staffId" value={staff.id} />
                      <input type="hidden" name="dayOfWeek" value={day} />
                      <button className="btn secondary" type="submit" style={{ minHeight: 36, marginTop: 8 }}>
                        Crear horario para {DAY_NAMES[day]}
                      </button>
                    </form>
                  </div>
                );
              }
              return (
                <div key={wh.id} className="card" style={{ boxShadow: "none" }}>
                  <form className="form-grid" action={updateWorkingHourAction}>
                    <input type="hidden" name="workingHourId" value={wh.id} />
                    <input type="hidden" name="staffId" value={staff.id} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <strong>{DAY_NAMES[wh.dayOfWeek]}</strong>
                      <label className="choice" style={{ minHeight: 36, padding: "0 12px" }}>
                        <input name="isActive" type="checkbox" defaultChecked={wh.isActive} />
                        <span className="small">Activo</span>
                      </label>
                    </div>
                    {wh.isActive ? (
                      <div className="grid two" style={{ gap: 8 }}>
                        <div className="field">
                          <label>Inicio</label>
                          <input className="input" name="startTime" type="time" defaultValue={wh.startTime} />
                        </div>
                        <div className="field">
                          <label>Fin</label>
                          <input className="input" name="endTime" type="time" defaultValue={wh.endTime} />
                        </div>
                        <div className="field">
                          <label>Inicio descanso</label>
                          <input className="input" name="breakStart" type="time" defaultValue={wh.breakStart ?? ""} />
                        </div>
                        <div className="field">
                          <label>Fin descanso</label>
                          <input className="input" name="breakEnd" type="time" defaultValue={wh.breakEnd ?? ""} />
                        </div>
                      </div>
                    ) : null}
                    <button className="btn secondary" type="submit" style={{ minHeight: 36 }}>
                      Guardar {DAY_NAMES[wh.dayOfWeek]}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
