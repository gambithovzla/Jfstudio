import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Pencil, Plus, RotateCcw, Save, Trash2, XCircle } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DeleteAppointmentButton } from "@/components/delete-appointment-button";
import { FlashMessage } from "@/components/flash-message";
import { StatusBadge } from "@/components/status-badge";
import {
  addPaymentAction,
  cancelAppointmentAction,
  cancelForceMajeureAction,
  completeAppointmentAction,
  deletePaymentAction,
  markDepositPaidAction,
  refundPaymentAction,
  updatePaymentAction
} from "@/lib/actions";
import { getAppointmentForCheckout, getSalonSettings } from "@/lib/data";
import { describePaymentAuditChange, paymentAuditActionLabel } from "@/lib/payment-audit";
import { formatDateInZone, formatTimeInZone, todayInTimeZone } from "@/lib/time";
import { formatCurrency, normalizePhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ msg?: string }>;
};

// El panel usa una sola contrasena compartida, asi que la sesion no dice quien
// es la persona: hay que declararlo en cada correccion.
function ActorSelect({
  staff,
  label,
  id,
  full
}: {
  staff: { id: string; name: string }[];
  label: string;
  id?: string;
  full?: boolean;
}) {
  if (staff.length === 0) {
    return (
      <input
        className="input"
        id={id}
        name="actorName"
        required
        placeholder={label}
        aria-label={label}
        style={full ? undefined : { width: 160 }}
      />
    );
  }

  return (
    <select
      className="select"
      id={id}
      name="actorStaffId"
      required
      defaultValue=""
      aria-label={label}
      style={full ? undefined : { width: 160 }}
    >
      <option value="" disabled>
        {label}...
      </option>
      {staff.map((member) => (
        <option value={member.id} key={member.id}>{member.name}</option>
      ))}
    </select>
  );
}

export default async function AppointmentDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const [{ appointment, methods, staff, paymentAuditLog }, settings] = await Promise.all([
    getAppointmentForCheckout(id),
    getSalonSettings()
  ]);

  if (!appointment) {
    notFound();
  }

  const today = todayInTimeZone(settings.timezone);
  const total = appointment.services.reduce((sum, service) => sum + Number(service.priceSnapshot), 0);
  const requiresDeposit = appointment.services.some((s) => s.service.requiresDeposit);
  const usage = new Map<
    string,
    {
      productId: string;
      name: string;
      unit: string;
      quantity: number;
      isVariable: boolean;
    }
  >();

  for (const appointmentService of appointment.services) {
    for (const recipe of appointmentService.service.products) {
      const current = usage.get(recipe.productId);
      usage.set(recipe.productId, {
        productId: recipe.productId,
        name: recipe.product.name,
        unit: recipe.product.unit,
        quantity: (current?.quantity ?? 0) + Number(recipe.quantity),
        isVariable: Boolean(current?.isVariable || recipe.isVariable)
      });
    }
  }

  const phone = appointment.client.phone
    ? normalizePhone(appointment.client.phone).replace(/^\+/, "")
    : null;
  const message = phone
    ? encodeURIComponent(
        `Hola ${appointment.client.name}, te confirmamos tu cita en ${settings.name} para el ${formatDateInZone(
          appointment.startAt,
          settings.timezone
        )} a las ${formatTimeInZone(appointment.startAt, settings.timezone)}.`
      )
    : "";

  return (
    <>
      <FlashMessage msg={sp.msg} />
      <div className="page-header">
        <div>
          <p className="eyebrow">Cita</p>
          <h1 className="title">{appointment.client.name}</h1>
          <p className="subtitle">
            {formatDateInZone(appointment.startAt, settings.timezone)} ·{" "}
            {formatTimeInZone(appointment.startAt, settings.timezone)} -{" "}
            {formatTimeInZone(appointment.endAt, settings.timezone)} · {appointment.staff.name}
          </p>
        </div>
        <div className="button-row">
          {appointment.status === "CONFIRMED" ? (
            <Link className="btn secondary" href={`/admin/agenda/${id}/edit`}>
              <Pencil size={16} aria-hidden />
              Editar
            </Link>
          ) : null}
          <Link className="btn secondary" href="/admin/agenda">
            <ArrowLeft size={17} aria-hidden />
            Agenda
          </Link>
          <StatusBadge status={appointment.status} />
          {requiresDeposit && !appointment.depositPaid ? (
            <form action={markDepositPaidAction}>
              <input type="hidden" name="appointmentId" value={appointment.id} />
              <button className="btn secondary" type="submit" style={{ fontSize: "0.82rem" }}>
                Marcar adelanto recibido
              </button>
            </form>
          ) : requiresDeposit || appointment.depositPaid ? (
            <span className="badge" style={{ background: "#dcfce7", color: "#166534" }}>Adelanto recibido</span>
          ) : null}
        </div>
      </div>

      <div className="grid two">
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Detalle</h2>
              <p className="small muted">{appointment.client.phone ?? "Sin telefono"}</p>
              {appointment.depositVoucherKey ? (
                <p className="small" style={{ marginTop: 8 }}>
                  <a
                    className="btn secondary"
                    href={`/api/admin/appointments/${id}/deposit-voucher`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.85rem" }}
                  >
                    Ver comprobante de adelanto
                    {appointment.depositAmountPen != null
                      ? ` (S/ ${Number(appointment.depositAmountPen).toFixed(2)})`
                      : ""}
                  </a>
                </p>
              ) : null}
              {appointment.client.dni ? (
                <p className="small muted">
                  {appointment.client.documentType === "CE"
                    ? "CE"
                    : appointment.client.documentType === "PASSPORT"
                    ? "Pasaporte"
                    : "DNI"}
                  : {appointment.client.dni}
                </p>
              ) : null}
            </div>
            {phone ? (
              <Link className="btn secondary" href={`https://wa.me/${phone}?text=${message}`} target="_blank">
                <MessageCircle size={17} aria-hidden />
                WhatsApp
              </Link>
            ) : null}
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Duracion</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              {appointment.services.map((service) => (
                <tr key={service.id}>
                  <td>{service.serviceNameSnapshot}</td>
                  <td>{service.durationMinutesSnapshot} min</td>
                  <td>{formatCurrency(Number(service.priceSnapshot), settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="button-row" style={{ justifyContent: "space-between", marginTop: 14 }}>
            <span className="muted">Total sugerido</span>
            <strong>{formatCurrency(total, settings.currency)}</strong>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Cobro y consumo</h2>
              <p className="small muted">El inventario se descuenta al completar la cita.</p>
            </div>
          </div>

          {appointment.status !== "CONFIRMED" ? (
            <div className="empty">Esta cita ya no esta pendiente de cobro.</div>
          ) : (
            <>
            <form className="form-grid" action={cancelAppointmentAction} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
              <input type="hidden" name="appointmentId" value={appointment.id} />
              <div className="field">
                <label htmlFor="cancel-note">Motivo de cancelación (se envía a la clienta)</label>
                <textarea className="textarea" id="cancel-note" name="note" placeholder="Ej: agenda completa, reagendaremos pronto..." rows={2} />
              </div>
              <ConfirmSubmitButton
                className="btn danger"
                type="submit"
                style={{ alignSelf: "flex-start" }}
                message="¿Cancelar esta cita? Se notificará a la clienta por email."
              >
                <XCircle size={16} aria-hidden />
                Cancelar y notificar a la clienta
              </ConfirmSubmitButton>
            </form>

            <form className="form-grid" action={cancelForceMajeureAction} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--line)", background: "#fef3c7", borderRadius: 10, padding: "14px 16px" }}>
              <input type="hidden" name="appointmentId" value={appointment.id} />
              <p className="small" style={{ margin: "0 0 8px", fontWeight: 600, color: "#92400e" }}>⚡ Cancelar por fuerza mayor</p>
              <p className="small muted" style={{ margin: "0 0 10px", fontSize: "0.8rem" }}>La clienta recibirá un email especial indicando que su adelanto será reembolsado o puede reagendar sin costo.</p>
              <div className="field">
                <label htmlFor="fm-reason" style={{ fontSize: "0.85rem" }}>Motivo (obligatorio)</label>
                <textarea className="textarea" id="fm-reason" name="reason" placeholder="Ej: Johanna se encuentra en urgencias médicas. Nos disculpamos..." rows={2} required />
              </div>
              <ConfirmSubmitButton
                className="btn"
                type="submit"
                style={{ alignSelf: "flex-start", background: "#f59e0b", color: "#fff", borderColor: "#f59e0b" }}
                message="¿Cancelar por fuerza mayor? Se enviará un email especial a la clienta con la promesa de reembolso."
              >
                <XCircle size={16} aria-hidden />
                Cancelar por fuerza mayor y notificar
              </ConfirmSubmitButton>
            </form>
            <form className="form-grid" action={completeAppointmentAction} encType="multipart/form-data">
              <input type="hidden" name="appointmentId" value={appointment.id} />
              <div className="grid two">
                <div className="field">
                  <label htmlFor="amount">Monto final</label>
                  <input className="input" id="amount" name="amount" type="number" step="0.01" defaultValue={total} required />
                </div>
                <div className="field">
                  <label htmlFor="method">Metodo</label>
                  <select className="select" id="method" name="method" required>
                    {methods.map((method) => (
                      <option value={method.name} key={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="careNote">Cuidados para la clienta (texto, opcional)</label>
                <textarea
                  className="textarea"
                  id="careNote"
                  name="careNote"
                  rows={4}
                  placeholder="Ej. no lavar en 48 h, usar protector térmico, evitar el mar…"
                />
                <p className="small muted" style={{ marginTop: 6 }}>
                  Si la clienta tiene correo y escribes aquí o adjuntas un archivo, recibirá un email al completar la cita.
                </p>
              </div>
              <div className="field">
                <label htmlFor="careAttachment">Adjunto de cuidados (opcional: JPG, PNG, WebP o PDF, máx. 8 MB)</label>
                <input className="input" id="careAttachment" name="careAttachment" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" />
                <p className="small muted" style={{ marginTop: 6 }}>
                  Requiere el mismo almacenamiento S3 que los comprobantes de adelanto (variables DEPOSIT_S3_*).
                </p>
              </div>

              {usage.size > 0 ? (
                <div className="form-grid">
                  <span className="field-label">Productos usados</span>
                  {Array.from(usage.values()).map((product) => (
                    <div className="field" key={product.productId}>
                      <label htmlFor={`product-${product.productId}`}>
                        {product.name} ({product.unit}) {product.isVariable ? "· variable" : ""}
                      </label>
                      <input
                        className="input"
                        id={`product-${product.productId}`}
                        name={`product:${product.productId}`}
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={product.quantity}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="field">
                <label htmlFor="note">Nota de pago</label>
                <textarea className="textarea" id="note" name="note" />
              </div>
              <button className="btn" type="submit">
                <Save size={17} aria-hidden />
                Completar y cobrar
              </button>
            </form>
            </>
          )}
        </section>

        {appointment.status === "COMPLETED" && appointment.payments.length > 0 ? (
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Historial de pagos</h2>
                <p className="small muted">
                  Total neto: {formatCurrency(appointment.payments.reduce((s, p) => s + Number(p.amount), 0), settings.currency)}
                </p>
              </div>
            </div>
            <p className="small muted" style={{ marginTop: 0 }}>
              Corrige el monto, el metodo o la nota de un cobro mal registrado y guarda. Usa eliminar solo si el
              cobro nunca debio existir; para devolver dinero a la clienta registra un reembolso.
            </p>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              {appointment.payments.map((p) => {
                const isRefund = Number(p.amount) < 0;
                const label = `${formatCurrency(Number(p.amount), settings.currency)} (${p.method})`;

                return (
                  <div key={p.id} className="card" style={{ boxShadow: "none", padding: "10px 14px" }}>
                    <form className="button-row" action={updatePaymentAction} style={{ flexWrap: "wrap", gap: 8 }}>
                      <input type="hidden" name="paymentId" value={p.id} />
                      <select className="select" name="method" defaultValue={p.method} required style={{ width: 150 }}>
                        {methods.some((method) => method.name === p.method) ? null : (
                          <option value={p.method}>{p.method}</option>
                        )}
                        {methods.map((method) => (
                          <option value={method.name} key={method.id}>{method.name}</option>
                        ))}
                      </select>
                      <input
                        className="input"
                        name="amount"
                        type="number"
                        step="0.01"
                        defaultValue={Number(p.amount)}
                        required
                        aria-label="Monto"
                        style={{ width: 110, color: isRefund ? "#b91c1c" : undefined }}
                      />
                      <input
                        className="input"
                        name="note"
                        defaultValue={p.note ?? ""}
                        placeholder="Nota"
                        aria-label="Nota"
                        style={{ width: 180 }}
                      />
                      <ActorSelect staff={staff} label="Quien corrige" />
                      <input
                        className="input"
                        name="reason"
                        placeholder="Motivo (opcional)"
                        aria-label="Motivo de la correccion"
                        style={{ width: 180 }}
                      />
                      <button className="btn secondary" type="submit" style={{ minHeight: 36, padding: "0 10px" }}>
                        <Save size={15} aria-hidden />
                        Guardar
                      </button>
                    </form>
                    <p className="small muted" style={{ margin: "6px 0 0" }}>
                      {isRefund ? "Reembolso" : "Cobro"} registrado el {formatDateInZone(p.paidAt, settings.timezone)}{" "}
                      {formatTimeInZone(p.paidAt, settings.timezone)}
                    </p>
                    <details style={{ marginTop: 6 }}>
                      <summary className="small" style={{ color: "#b91c1c", cursor: "pointer" }}>
                        Eliminar este cobro
                      </summary>
                      <form className="button-row" action={deletePaymentAction} style={{ flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                        <input type="hidden" name="paymentId" value={p.id} />
                        <ActorSelect staff={staff} label="Quien elimina" />
                        <input
                          className="input"
                          name="reason"
                          placeholder="Motivo (obligatorio)"
                          aria-label="Motivo de la eliminacion"
                          required
                          style={{ width: 240 }}
                        />
                        <ConfirmSubmitButton
                          className="btn danger"
                          type="submit"
                          style={{ minHeight: 36, padding: "0 10px" }}
                          message={`Eliminar el cobro de ${label}? Quedara registrado en la bitacora, pero el cobro desaparece de caja.`}
                        >
                          <Trash2 size={15} aria-hidden />
                          Eliminar
                        </ConfirmSubmitButton>
                      </form>
                    </details>
                  </div>
                );
              })}
            </div>
            <details style={{ marginBottom: 16 }}>
              <summary className="small" style={{ cursor: "pointer", fontWeight: 600 }}>
                Registrar cobro adicional
              </summary>
              <form className="form-grid" action={addPaymentAction} style={{ marginTop: 10 }}>
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <p className="small muted" style={{ margin: 0 }}>
                  Para plata que si entro y falta registrar: un saldo que la clienta pago despues o un cobro
                  que se omitio. No lo uses para arreglar un monto mal tipeado — para eso corrige el cobro
                  original arriba.
                </p>
                <div className="grid two">
                  <div className="field">
                    <label htmlFor="add-amount">Monto</label>
                    <input className="input" id="add-amount" name="amount" type="number" step="0.01" min="0.01" required />
                  </div>
                  <div className="field">
                    <label htmlFor="add-method">Metodo</label>
                    <select className="select" id="add-method" name="method" required>
                      {methods.map((method) => (
                        <option value={method.name} key={method.id}>{method.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid two">
                  <div className="field">
                    <label htmlFor="add-paidOn">Fecha del cobro</label>
                    <input className="input" id="add-paidOn" name="paidOn" type="date" max={today} defaultValue={today} />
                    <span className="small muted">
                      Es el dia en que entro la plata: define en que fecha suma en caja.
                    </span>
                  </div>
                  <div className="field">
                    <label htmlFor="add-actor">Quien registra</label>
                    <ActorSelect staff={staff} id="add-actor" label="Quien registra" full />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="add-note">Nota</label>
                  <input className="input" id="add-note" name="note" placeholder="Ej: saldo pagado el viernes" />
                </div>
                <button className="btn secondary" type="submit" style={{ alignSelf: "flex-start" }}>
                  <Plus size={16} aria-hidden />
                  Registrar cobro
                </button>
              </form>
            </details>
            <form className="form-grid" action={refundPaymentAction}>
              <input type="hidden" name="appointmentId" value={appointment.id} />
              <p className="small muted" style={{ margin: 0 }}>Registrar reembolso</p>
              <div className="grid two">
                <div className="field">
                  <label htmlFor="refund-amount">Monto a reembolsar</label>
                  <input className="input" id="refund-amount" name="amount" type="number" step="0.01" min="0.01" required />
                </div>
                <div className="field">
                  <label htmlFor="refund-method">Metodo</label>
                  <select className="select" id="refund-method" name="method" required>
                    {methods.map((method) => (
                      <option value={method.name} key={method.id}>{method.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid two">
                <div className="field">
                  <label htmlFor="refund-note">Motivo</label>
                  <input className="input" id="refund-note" name="note" placeholder="Motivo del reembolso" />
                </div>
                <div className="field">
                  <label htmlFor="refund-actor">Quien registra</label>
                  <ActorSelect staff={staff} id="refund-actor" label="Quien registra" full />
                </div>
              </div>
              <button className="btn danger" type="submit" style={{ alignSelf: "flex-start" }}>
                <RotateCcw size={16} aria-hidden />
                Registrar reembolso
              </button>
            </form>
          </section>
        ) : null}

        {paymentAuditLog.length > 0 ? (
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Bitacora de correcciones</h2>
                <p className="small muted">
                  Registro permanente de cada correccion, eliminacion o reembolso sobre los cobros de esta cita.
                  No se puede editar ni borrar desde el panel.
                </p>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Cuando</th>
                  <th>Quien</th>
                  <th>Accion</th>
                  <th>Cambio</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {paymentAuditLog.map((log) => (
                  <tr key={log.id}>
                    <td className="small">
                      {formatDateInZone(log.createdAt, settings.timezone)}{" "}
                      {formatTimeInZone(log.createdAt, settings.timezone)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.actorName}</td>
                    <td className="small">{paymentAuditActionLabel(log.action)}</td>
                    <td className="small">
                      {describePaymentAuditChange(log, (value) => formatCurrency(value, settings.currency))}
                    </td>
                    <td className="small muted">{log.reason ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {appointment.status === "COMPLETED" && (appointment.postVisitCareNote || appointment.postVisitAttachmentKey) ? (
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Cuidados enviados a la clienta</h2>
                <p className="small muted">Registro del correo enviado al completar la cita (si había email registrado).</p>
              </div>
            </div>
            {appointment.postVisitCareNote ? (
              <p style={{ whiteSpace: "pre-wrap", marginTop: 0 }}>{appointment.postVisitCareNote}</p>
            ) : null}
            {appointment.postVisitAttachmentKey ? (
              <p style={{ marginTop: 12 }}>
                <a
                  className="btn secondary"
                  href={`/api/admin/appointments/${id}/care-attachment`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver adjunto de cuidados
                </a>
              </p>
            ) : null}
          </section>
        ) : null}
      </div>

      <section className="card" style={{ marginTop: 16, borderColor: "#fca5a5" }}>
        <div className="card-header">
          <div>
            <h2 className="card-title" style={{ color: "#b91c1c" }}>Zona de peligro</h2>
            <p className="small muted">Eliminar el registro borra también todos los pagos asociados. No se puede deshacer.</p>
          </div>
          <DeleteAppointmentButton appointmentId={id} />
        </div>
      </section>
    </>
  );
}
