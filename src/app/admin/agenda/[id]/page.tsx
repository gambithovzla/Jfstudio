import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Save } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { completeAppointmentAction } from "@/lib/actions";
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

  const phone = normalizePhone(appointment.client.phone).replace(/^\+/, "");
  const message = encodeURIComponent(
    `Hola ${appointment.client.name}, te confirmamos tu cita en ${settings.name} para el ${formatDateInZone(
      appointment.startAt,
      settings.timezone
    )} a las ${formatTimeInZone(appointment.startAt, settings.timezone)}.`
  );

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
        <StatusBadge status={appointment.status} />
      </div>

      <div className="grid two">
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Detalle</h2>
              <p className="small muted">{appointment.client.phone}</p>
            </div>
            <Link className="btn secondary" href={`https://wa.me/${phone}?text=${message}`} target="_blank">
              <MessageCircle size={17} aria-hidden />
              WhatsApp
            </Link>
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
          )}
        </section>
      </div>
    </>
  );
}
