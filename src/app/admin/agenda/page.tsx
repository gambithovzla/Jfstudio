import Link from "next/link";
import { CalendarPlus, Eye } from "lucide-react";

import { AgendaCalendar } from "@/components/agenda-calendar";
import { InlineCancelForm } from "@/components/inline-cancel-form";
import { StatusBadge } from "@/components/status-badge";
import { createAdminAppointmentAction } from "@/lib/actions";
import { getAgenda, getAgendaRange } from "@/lib/data";
import { formatTimeInZone } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ date?: string; view?: string }>;
};

export default async function AgendaPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const isCalendarView = params.view === "calendar";
  const { settings, selectedDate, appointments, staff, services } = await getAgenda(params.date);

  let calendarAppointments: {
    id: string; clientName: string; staffName: string; staffColor: string;
    services: string[]; startAt: string; endAt: string; status: string;
  }[] = [];

  if (isCalendarView) {
    const now = new Date();
    const rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const rangeEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1));

    const { appointments: rangeAppts, settings: rs } = await getAgendaRange(rangeStart, rangeEnd);
    void rs;
    calendarAppointments = rangeAppts.map((a) => ({
      id: a.id,
      clientName: a.client.name,
      staffName: a.staff.name,
      staffColor: a.staff.color,
      services: a.services.map((s) => s.serviceNameSnapshot),
      startAt: a.startAt.toISOString(),
      endAt: a.endAt.toISOString(),
      status: a.status
    }));
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Agenda</p>
          <h1 className="title">Citas del dia</h1>
          <p className="subtitle">Vista operativa por staff con bloqueo por duracion total de servicios.</p>
        </div>
        <div className="button-row">
          <form className="button-row">
            <input className="input" name="date" type="date" defaultValue={selectedDate} />
            <button className="btn secondary" type="submit">
              Ver fecha
            </button>
          </form>
          <div className="button-row">
            <Link className={`btn ${!isCalendarView ? "" : "secondary"}`} href="/admin/agenda">Lista</Link>
            <Link className={`btn ${isCalendarView ? "" : "secondary"}`} href="/admin/agenda?view=calendar">Semana</Link>
          </div>
        </div>
      </div>

      {isCalendarView ? (
        <section className="card" style={{ marginBottom: 24 }}>
          <AgendaCalendar appointments={calendarAppointments} defaultDate={new Date()} />
        </section>
      ) : null}

      <div className="grid two">
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Crear cita interna</h2>
              <p className="small muted">Usa el mismo bloqueo de horarios que la reserva publica.</p>
            </div>
            <CalendarPlus size={20} aria-hidden />
          </div>
          <form className="form-grid" action={createAdminAppointmentAction}>
            <div className="grid two">
              <div className="field">
                <label htmlFor="clientName">Cliente</label>
                <input className="input" id="clientName" name="clientName" required />
              </div>
              <div className="field">
                <label htmlFor="clientPhone">Telefono</label>
                <input className="input" id="clientPhone" name="clientPhone" required />
              </div>
            </div>
            <div className="field">
              <label htmlFor="clientEmail">Correo</label>
              <input className="input" id="clientEmail" name="clientEmail" type="email" />
            </div>
            <div className="checkbox-list">
              <span className="field-label">Servicios</span>
              {services.map((service) => (
                <label className="choice" key={service.id}>
                  <input name="serviceIds" value={service.id} type="checkbox" />
                  <span>
                    <strong>{service.name}</strong>
                    <span className="small muted">
                      {" "}
                      · {service.durationMinutes} min · {formatCurrency(service.price, settings.currency)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <div className="grid three">
              <div className="field">
                <label htmlFor="staffId">Staff</label>
                <select className="select" id="staffId" name="staffId" required>
                  {staff.map((staffMember) => (
                    <option value={staffMember.id} key={staffMember.id}>
                      {staffMember.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="date">Fecha</label>
                <input className="input" id="date" name="date" type="date" defaultValue={selectedDate} required />
              </div>
              <div className="field">
                <label htmlFor="time">Hora</label>
                <input className="input" id="time" name="time" type="time" step="900" required />
              </div>
            </div>
            <div className="field">
              <label htmlFor="notes">Notas</label>
              <textarea className="textarea" id="notes" name="notes" />
            </div>
            <button className="btn" type="submit">
              <CalendarPlus size={18} aria-hidden />
              Crear cita
            </button>
          </form>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Citas</h2>
              <p className="small muted">{selectedDate}</p>
            </div>
          </div>
          {appointments.length === 0 ? (
            <div className="empty">No hay citas para esta fecha.</div>
          ) : (
            <div className="grid">
              {appointments.map((appointment) => (
                <article
                  className="card"
                  key={appointment.id}
                  style={{ boxShadow: "none", borderLeft: `4px solid ${appointment.staff.color}`, paddingLeft: 14 }}
                >
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">
                        {formatTimeInZone(appointment.startAt, settings.timezone)} · {appointment.client.name}
                      </h3>
                      <p className="small muted">
                        {appointment.services.map((service) => service.serviceNameSnapshot).join(", ")} ·{" "}
                        <span style={{ fontWeight: 700, color: appointment.staff.color }}>{appointment.staff.name}</span>
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <div className="button-row">
                    <Link className="btn secondary" href={`/admin/agenda/${appointment.id}`}>
                      <Eye size={17} aria-hidden />
                      Ver
                    </Link>
                    {appointment.status === "CONFIRMED" ? (
                      <InlineCancelForm appointmentId={appointment.id} />
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
