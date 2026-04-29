import { CreditCard } from "lucide-react";

import { getCashReport } from "@/lib/data";
import { formatTimeInZone } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ date?: string }>;
};

export default async function CashPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const { settings, selectedDate, payments, summary } = await getCashReport(params.date);

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Caja</p>
          <h1 className="title">Cierre diario</h1>
          <p className="subtitle">Ingresos del dia, metodos de pago y cobros enlazados a citas.</p>
        </div>
        <form className="button-row">
          <input className="input" name="date" type="date" defaultValue={selectedDate} />
          <button className="btn secondary" type="submit">
            Ver fecha
          </button>
        </form>
      </div>

      <div className="grid three" style={{ marginBottom: 16 }}>
        <article className="card metric">
          <span className="small muted">Total</span>
          <span className="metric-value">{formatCurrency(summary.total, settings.currency)}</span>
        </article>
        <article className="card metric">
          <span className="small muted">Cobros</span>
          <span className="metric-value">{payments.length}</span>
        </article>
        <article className="card metric">
          <span className="small muted">Metodos</span>
          <span className="metric-value">{summary.byMethod.length}</span>
        </article>
      </div>

      <div className="grid two">
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Por metodo</h2>
            <CreditCard size={20} aria-hidden />
          </div>
          {summary.byMethod.length === 0 ? (
            <div className="empty">No hay pagos en esta fecha.</div>
          ) : (
            <table className="table">
              <tbody>
                {summary.byMethod.map((row) => (
                  <tr key={row.method}>
                    <td>{row.method}</td>
                    <td>{formatCurrency(row.amount, settings.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h2 className="card-title">Pagos</h2>
          {payments.length === 0 ? (
            <div className="empty">Sin pagos registrados.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Metodo</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatTimeInZone(payment.paidAt, settings.timezone)}</td>
                    <td>{payment.appointment.client.name}</td>
                    <td>{payment.method}</td>
                    <td>{formatCurrency(Number(payment.amount), settings.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
