import Link from "next/link";
import { Cake, Plus, Search } from "lucide-react";

import { getClientsWithHistory, getClientsWithoutBirthday, getSalonSettings } from "@/lib/data";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const [clients, settings, noBirthday] = await Promise.all([
    getClientsWithHistory(params.q),
    getSalonSettings(),
    getClientsWithoutBirthday()
  ]);

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1 className="title">Historial de clientas</h1>
          <p className="subtitle">Busca por nombre o telefono. Haz clic en una clienta para ver su historial completo.</p>
        </div>
        <div className="button-row">
          <form className="button-row">
            <input className="input" name="q" type="search" placeholder="Buscar..." defaultValue={params.q} />
            <button className="btn secondary" type="submit">
              <Search size={16} aria-hidden />
              Buscar
            </button>
          </form>
          {noBirthday.length > 0 && (
            <Link className="btn secondary" href="/admin/clientes/cumpleanos">
              <Cake size={16} aria-hidden />
              Cumpleaños ({noBirthday.length})
            </Link>
          )}
          <Link className="btn" href="/admin/clientes/nuevo">
            <Plus size={17} aria-hidden />
            Nueva clienta
          </Link>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="empty">No se encontraron clientas.</div>
      ) : (
        <div className="grid">
          {clients.map((client) => {
            const totalSpent = client.appointments.reduce(
              (sum, apt) => sum + apt.payments.reduce((s, p) => s + Number(p.amount), 0),
              0
            );

            return (
              <article className="card" key={client.id}>
                <div className="card-header">
                  <div>
                    <h2 className="card-title">{client.name}</h2>
                    <p className="small muted">
                      {client.phone ?? "Sin telefono"}
                      {client.email ? ` · ${client.email}` : ""}
                    </p>
                  </div>
                  <div className="button-row">
                    <Link className="btn secondary" href={`/admin/clientes/${client.id}`}>
                      Ver historial
                    </Link>
                    <Link className="btn secondary" href={`/admin/clientes/${client.id}/edit`}>
                      Editar
                    </Link>
                  </div>
                </div>

                {client.appointments.length === 0 ? (
                  <p className="small muted">Sin citas registradas.</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Servicios</th>
                        <th>Estilista</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {client.appointments.map((apt) => {
                        const paid = apt.payments.reduce((s, p) => s + Number(p.amount), 0);
                        return (
                          <tr key={apt.id}>
                            <td className="small">
                              {formatDateInZone(apt.startAt, settings.timezone)}{" "}
                              {formatTimeInZone(apt.startAt, settings.timezone)}
                            </td>
                            <td className="small">{apt.services.map((s) => s.serviceNameSnapshot).join(", ")}</td>
                            <td className="small">{apt.staff.name}</td>
                            <td className="small">
                              {paid > 0 ? formatCurrency(paid, settings.currency) : <span className="muted">Pendiente</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {totalSpent > 0 ? (
                  <p className="small muted" style={{ marginTop: 8 }}>
                    Total acumulado (ultimas 5 citas): <strong>{formatCurrency(totalSpent, settings.currency)}</strong>
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
