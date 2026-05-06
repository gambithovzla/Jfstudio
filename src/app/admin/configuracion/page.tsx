import Link from "next/link";
import { Cake, KeyRound, Pencil, Plus, Settings, Trash2 } from "lucide-react";

import {
  changeAdminPasswordAction,
  createPaymentMethodAction,
  createStaffAction,
  deletePaymentMethodAction,
  updatePaymentMethodAction,
  updateSalonSettingsAction
} from "@/lib/actions";
import { getConfigurationAdmin } from "@/lib/data";
import { FlashMessage } from "@/components/flash-message";

export const dynamic = "force-dynamic";

const dayLabels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const ROLES: Record<string, string> = {
  ADMIN: "Admin",
  STYLIST: "Estilista",
  RECEPTIONIST: "Recepcion"
};

type PageProps = { searchParams?: Promise<{ msg?: string }> };

export default async function ConfigurationPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const { settings, staff, methods } = await getConfigurationAdmin();

  return (
    <>
      <FlashMessage msg={params.msg} />
      <div className="page-header">
        <div>
          <p className="eyebrow">Configuracion</p>
          <h1 className="title">{settings.name}</h1>
          <p className="subtitle">Datos del salon, staff, horarios y metodos de pago.</p>
        </div>
        <div className="button-row">
          <Link className="btn secondary" href="/admin/configuracion/cumpleanos">
            <Cake size={16} aria-hidden />
            Bono de cumpleaños
          </Link>
        </div>
      </div>

      <div className="grid two">
        {/* Salon settings */}
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
                <label htmlFor="appointmentIntervalMinutes">Intervalo (min)</label>
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
            <button className="btn" type="submit">Guardar</button>
          </form>
        </section>

        {/* Nuevo staff */}
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

        {/* Lista de staff */}
        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>Staff</h2>
          <div className="grid">
            {staff.map((member) => (
              <article className="card" key={member.id} style={{ boxShadow: "none" }}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{member.name}</h3>
                    <p className="small muted">
                      {ROLES[member.role] ?? member.role}
                      {member.email ? ` · ${member.email}` : ""}
                    </p>
                    <p className="small muted">
                      {member.workingHours
                        .filter((h) => h.isActive)
                        .map((h) => `${dayLabels[h.dayOfWeek]} ${h.startTime}-${h.endTime}`)
                        .join(" · ")}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span className="badge">{member.isActive ? "Activo" : "Inactivo"}</span>
                    <Link className="btn secondary" href={`/admin/configuracion/staff/${member.id}`} style={{ minHeight: 34, padding: "0 10px" }}>
                      <Pencil size={14} aria-hidden />
                      Editar
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Métodos de pago */}
        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>Metodos de pago</h2>
          <div className="form-grid">
            {methods.map((method) => (
              <div key={method.id} className="card" style={{ boxShadow: "none", padding: "10px 14px" }}>
                <form className="button-row" action={updatePaymentMethodAction} style={{ justifyContent: "space-between" }}>
                  <input type="hidden" name="methodId" value={method.id} />
                  <div className="button-row">
                    <input className="input" name="name" defaultValue={method.name} style={{ width: 140 }} required />
                    <input className="input" name="sortOrder" type="number" defaultValue={method.sortOrder} style={{ width: 64 }} />
                    <label className="choice" style={{ minHeight: 36, padding: "0 10px" }}>
                      <input name="isActive" type="checkbox" defaultChecked={method.isActive} />
                      <span className="small">Activo</span>
                    </label>
                  </div>
                  <div className="button-row">
                    <button className="btn secondary" type="submit" style={{ minHeight: 36, padding: "0 10px" }}>
                      Guardar
                    </button>
                    <form action={deletePaymentMethodAction}>
                      <input type="hidden" name="methodId" value={method.id} />
                      <button className="btn danger" type="submit" style={{ minHeight: 36, padding: "0 10px" }}>
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </form>
                  </div>
                </form>
              </div>
            ))}
          </div>
          <form className="form-grid" action={createPaymentMethodAction} style={{ marginTop: 16 }}>
            <div className="grid two">
              <div className="field">
                <label htmlFor="method-name">Nuevo metodo</label>
                <input className="input" id="method-name" name="name" required />
              </div>
              <div className="field">
                <label htmlFor="sortOrder">Orden</label>
                <input className="input" id="sortOrder" name="sortOrder" type="number" defaultValue="0" />
              </div>
            </div>
            <button className="btn secondary" type="submit">
              <Plus size={16} aria-hidden />
              Crear metodo
            </button>
          </form>
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Contraseña de acceso</h2>
            <KeyRound size={20} aria-hidden />
          </div>
          <p className="small muted" style={{ marginBottom: 16 }}>
            Cambia la contraseña del panel de administración. Solo la nueva contraseña te permitirá ingresar.
          </p>
          <form className="form-grid" action={changeAdminPasswordAction}>
            <div className="field">
              <label htmlFor="currentPassword">Contraseña actual</label>
              <input className="input" id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
            </div>
            <div className="field">
              <label htmlFor="newPassword">Nueva contraseña</label>
              <input className="input" id="newPassword" name="newPassword" type="password" required autoComplete="new-password" minLength={6} />
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">Confirmar nueva contraseña</label>
              <input className="input" id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" minLength={6} />
            </div>
            <button className="btn" type="submit">
              <KeyRound size={17} aria-hidden />
              Cambiar contraseña
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
