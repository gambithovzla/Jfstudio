import { CreditCard, Download } from "lucide-react";
import Link from "next/link";

import { getCashReport } from "@/lib/data";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ date?: string; from?: string; to?: string }>;
};

export default async function CashPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const isRange = Boolean(params.from && params.to);
  const { settings, selectedDate, payments, summary } = await getCashReport(
    isRange ? { from: params.from, to: params.to } : { date: params.date }
  );

  const fromDate = params.from || selectedDate;
  const toDate = params.to || selectedDate;

  const byStaff = new Map<string, { name: string; amount: number; count: number }>();
  const byService = new Map<string, { name: string; amount: number; count: number }>();

  for (const payment of payments) {
    const staffName = payment.collectedByStaff?.name ?? payment.appointment.staff.name;
    const staffKey = payment.appointment.staffId;
    const current = byStaff.get(staffKey) ?? { name: staffName, amount: 0, count: 0 };
    byStaff.set(staffKey, { ...current, amount: current.amount + Number(payment.amount), count: current.count + 1 });

    for (const svc of payment.appointment.services) {
      const existing = byService.get(svc.serviceId) ?? { name: svc.serviceNameSnapshot, amount: 0, count: 0 };
      byService.set(svc.serviceId, { ...existing, count: existing.count + 1 });
    }
  }

  const csvParams = new URLSearchParams();
  if (isRange) {
    csvParams.set("from", fromDate);
    csvParams.set("to", toDate);
  } else {
    csvParams.set("date", selectedDate);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Caja</p>
          <h1 className="title">Reportes de ingresos</h1>
          <p className="subtitle">Por dia o rango de fechas. Exporta a CSV para Excel.</p>
        </div>
        <div className="button-row">
          <Link className="btn secondary" href={`/api/admin/cash/export?${csvParams.toString()}`}>
            <Download size={16} aria-hidden />
            CSV
          </Link>
        </div>
      </div>

      <div className="grid two" style={{ marginBottom: 12 }}>
        <form className="card" style={{ padding: "14px 16px" }}>
          <p className="small muted" style={{ margin: "0 0 8px" }}>Por dia</p>
          <div className="button-row">
            <input className="input" name="date" type="date" defaultValue={selectedDate} />
            <button className="btn secondary" type="submit">Ver</button>
          </div>
        </form>
        <form className="card" style={{ padding: "14px 16px" }}>
          <p className="small muted" style={{ margin: "0 0 8px" }}>Por rango</p>
          <div className="button-row">
            <input className="input" name="from" type="date" defaultValue={fromDate} />
            <span className="small muted">a</span>
            <input className="input" name="to" type="date" defaultValue={toDate} />
            <button className="btn secondary" type="submit">Ver</button>
          </div>
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
            <div className="empty">No hay pagos en este periodo.</div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Metodo</th><th>Total</th></tr>
              </thead>
              <tbody>
                {summary.byMethod.map((row) => (
                  <tr key={row.method}>
                    <td>
                      <span className={`method-tag ${row.method.toLowerCase().replace(/\s+/g, "")}`}>
                        {row.method}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(row.amount, settings.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>Por estilista</h2>
          {byStaff.size === 0 ? (
            <div className="empty">Sin datos.</div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Estilista</th><th>Cobros</th><th>Total</th></tr>
              </thead>
              <tbody>
                {Array.from(byStaff.values()).map((row) => (
                  <tr key={row.name}>
                    <td style={{ fontWeight: 600 }}>{row.name}</td>
                    <td className="muted">{row.count}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(row.amount, settings.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>Por servicio</h2>
          {byService.size === 0 ? (
            <div className="empty">Sin datos.</div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Servicio</th><th>Citas</th></tr>
              </thead>
              <tbody>
                {Array.from(byService.values())
                  .sort((a, b) => b.count - a.count)
                  .map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>
                        <span className="badge">{row.count}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>Detalle de pagos</h2>
          {payments.length === 0 ? (
            <div className="empty">Sin pagos registrados.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Cliente</th>
                  <th>Metodo</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                      {formatDateInZone(payment.paidAt, settings.timezone)}{" "}
                      {formatTimeInZone(payment.paidAt, settings.timezone)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{payment.appointment.client.name}</td>
                    <td>
                      <span className={`method-tag ${payment.method.toLowerCase().replace(/\s+/g, "")}`}>
                        {payment.method}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(Number(payment.amount), settings.currency)}</td>
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
