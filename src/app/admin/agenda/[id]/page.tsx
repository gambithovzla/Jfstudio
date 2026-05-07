import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Pencil, RotateCcw, Save, XCircle } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DeleteAppointmentButton } from "@/components/delete-appointment-button";
import { StatusBadge } from "@/components/status-badge";
import { cancelAppointmentAction, cancelForceMajeureAction, completeAppointmentAction, markDepositPaidAction, refundPaymentAction } from "@/lib/actions";
import { getAppointmentForCheckout, getSalonSettings } from "@/lib/data";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";
import { formatCurrency, normalizePhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AppointmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [{ appointment, methods }, settings] = await Promise.all([getAppointmentForCheckout(id), getSalonSettings()]);

  if (!appointment) {
    notFound();
  }

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
          ) : requiresDeposit ? (
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
            <form className="form-grid" action={completeAppointmentAction}>
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
            <table className="table" style={{ marginBottom: 16 }}>
              <thead>
                <tr>
                  <th>Metodo</th>
                  <th>Monto</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {appointment.payments.map((p) => (
                  <tr key={p.id} style={{ color: Number(p.amount) < 0 ? "#b91c1c" : undefined }}>
                    <td>{p.method}</td>
                    <td>{formatCurrency(Number(p.amount), settings.currency)}</td>
                    <td className="muted">{p.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <div className="field">
                <label htmlFor="refund-note">Motivo</label>
                <input className="input" id="refund-note" name="note" placeholder="Motivo del reembolso" />
              </div>
              <button className="btn danger" type="submit" style={{ alignSelf: "flex-start" }}>
                <RotateCcw size={16} aria-hidden />
                Registrar reembolso
              </button>
            </form>
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
