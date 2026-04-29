import { Plus, Settings } from "lucide-react";

import { createPaymentMethodAction, createStaffAction, updateSalonSettingsAction } from "@/lib/actions";
import { getConfigurationAdmin } from "@/lib/data";

export const dynamic = "force-dynamic";

const dayLabels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

export default async function ConfigurationPage() {
  const { settings, staff, methods } = await getConfigurationAdmin();

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Configuracion</p>
          <h1 className="title">{settings.name}</h1>
          <p className="subtitle">Datos del salon, staff, horarios y metodos de pago.</p>
        </div>
      </div>

      <div className="grid two">
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Salon</h2>
            <Settings size={20} aria-hidden />
          </div>
          <form className="form-grid" action={updateSalonSettingsAction}>
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input className="input" id="name" name="name" defaultValue={settings.name} required />
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="timezone">Timezone</label>
                <input className="input" id="timezone" name="timezone" defaultValue={settings.timezone} required />
              </div>
              <div className="field">
                <label htmlFor="currency">Moneda</label>
                <input className="input" id="currency" name="currency" defaultValue={settings.currency} required />
              </div>
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="appointmentIntervalMinutes">Intervalo</label>
                <input
                  className="input"
                  id="appointmentIntervalMinutes"
                  name="appointmentIntervalMinutes"
                  type="number"
                  min="5"
                  step="5"
                  defaultValue={settings.appointmentIntervalMinutes}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="bookingLookaheadDays">Dias visibles</label>
                <input
                  className="input"
                  id="bookingLookaheadDays"
                  name="bookingLookaheadDays"
                  type="number"
                  min="1"
                  defaultValue={settings.bookingLookaheadDays}
                  required
                />
              </div>
            </div>
            <button className="btn" type="submit">
              Guardar
            </button>
          </form>
        </section>

        <section className="card">
          <h2 className="card-title">Nuevo staff</h2>
          <form className="form-grid" action={createStaffAction} style={{ marginTop: 14 }}>
            <div className="grid two">
              <div className="field">
                <label htmlFor="staff-name">Nombre</label>
                <input className="input" id="staff-name" name="name" required />
              </div>
              <div className="field">
                <label htmlFor="staff-email">Correo</label>
                <input className="input" id="staff-email" name="email" type="email" />
              </div>
            </div>
            <div className="grid three">
              <div className="field">
                <label htmlFor="staff-phone">Telefono</label>
                <input className="input" id="staff-phone" name="phone" />
              </div>
              <div className="field">
                <label htmlFor="staff-role">Rol</label>
                <select className="select" id="staff-role" name="role" defaultValue="STYLIST">
                  <option value="ADMIN">Admin</option>
                  <option value="STYLIST">Estilista</option>
                  <option value="RECEPTIONIST">Recepcion</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="staff-color">Color</label>
                <input className="input" id="staff-color" name="color" type="color" defaultValue="#0f766e" />
              </div>
            </div>
            <button className="btn" type="submit">
              <Plus size={17} aria-hidden />
              Agregar staff
            </button>
          </form>
        </section>

        <section className="card">
          <h2 className="card-title">Staff</h2>
          <div className="grid" style={{ marginTop: 14 }}>
            {staff.map((staffMember) => (
              <article className="card" key={staffMember.id} style={{ boxShadow: "none" }}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{staffMember.name}</h3>
                    <p className="small muted">{staffMember.role}</p>
                  </div>
                  <span className="badge">{staffMember.isActive ? "Activo" : "Inactivo"}</span>
                </div>
                <p className="small muted">
                  {staffMember.workingHours
                    .filter((hour) => hour.isActive)
                    .map((hour) => `${dayLabels[hour.dayOfWeek]} ${hour.startTime}-${hour.endTime}`)
                    .join(" · ")}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="card-title">Metodos de pago</h2>
          <div className="button-row" style={{ marginTop: 12 }}>
            {methods.map((method) => (
              <span className="badge" key={method.id}>
                {method.name}
              </span>
            ))}
          </div>
          <form className="form-grid" action={createPaymentMethodAction} style={{ marginTop: 18 }}>
            <div className="grid two">
              <div className="field">
                <label htmlFor="method-name">Nombre</label>
                <input className="input" id="method-name" name="name" required />
              </div>
              <div className="field">
                <label htmlFor="sortOrder">Orden</label>
                <input className="input" id="sortOrder" name="sortOrder" type="number" defaultValue="0" />
              </div>
            </div>
            <button className="btn secondary" type="submit">
              Crear metodo
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
