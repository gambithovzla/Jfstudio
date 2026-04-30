import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { updateAppointmentAction } from "@/lib/actions";
import { getAppointmentForEdit } from "@/lib/data";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAppointmentPage({ params }: PageProps) {
  const { id } = await params;
  const { appointment, settings, allStaff, allServices } = await getAppointmentForEdit(id);

  if (!appointment) {
    notFound();
  }

  if (appointment.status !== "CONFIRMED") {
    return (
      <div className="card" style={{ maxWidth: 520 }}>
        <p className="eyebrow">No disponible</p>
        <h1 className="card-title">Solo se pueden editar citas confirmadas</h1>
        <div className="button-row" style={{ marginTop: 14 }}>
          <Link className="btn secondary" href={`/admin/agenda/${id}`}>
            <ArrowLeft size={17} /> Volver
          </Link>
        </div>
      </div>
    );
  }

  const currentServiceIds = appointment.services.map((s) => s.serviceId);
  const startLocal = new Intl.DateTimeFormat("sv-SE", {
    timeZone: settings.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(appointment.startAt);

  const startTime = formatTimeInZone(appointment.startAt, settings.timezone);

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Editar cita</p>
          <h1 className="title">{appointment.client.name}</h1>
          <p className="subtitle">
            {formatDateInZone(appointment.startAt, settings.timezone)} · {startTime}
          </p>
        </div>
        <Link className="btn secondary" href={`/admin/agenda/${id}`}>
          <ArrowLeft size={17} aria-hidden />
          Volver
        </Link>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <form className="form-grid" action={updateAppointmentAction}>
          <input type="hidden" name="appointmentId" value={appointment.id} />

          <div className="checkbox-list">
            <span className="field-label">Servicios</span>
            {allServices.map((service) => (
              <label className="choice" key={service.id}>
                <input
                  name="serviceIds"
                  value={service.id}
                  type="checkbox"
                  defaultChecked={currentServiceIds.includes(service.id)}
                />
                <span>
                  <strong>{service.name}</strong>
                  <span className="small muted">
                    {" "}· {service.durationMinutes} min · {formatCurrency(Number(service.price), settings.currency)}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="grid three">
            <div className="field">
              <label htmlFor="staffId">Estilista</label>
              <select className="select" id="staffId" name="staffId" required>
                {allStaff.map((member) => (
                  <option value={member.id} key={member.id} selected={member.id === appointment.staffId}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="date">Fecha</label>
              <input className="input" id="date" name="date" type="date" defaultValue={startLocal} required />
            </div>
            <div className="field">
              <label htmlFor="time">Hora</label>
              <input className="input" id="time" name="time" type="time" step="900" defaultValue={startTime} required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="notes">Notas</label>
            <textarea className="textarea" id="notes" name="notes" defaultValue={appointment.notes ?? ""} />
          </div>

          <div className="button-row">
            <button className="btn" type="submit">
              Guardar cambios
            </button>
            <Link className="btn secondary" href={`/admin/agenda/${id}`}>
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
