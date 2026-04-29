import { getClientsWithHistory, getSalonSettings } from "@/lib/data";
import { formatDateInZone } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [clients, settings] = await Promise.all([getClientsWithHistory(), getSalonSettings()]);

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1 className="title">Historial</h1>
          <p className="subtitle">Servicios realizados, staff y precios cobrados por clienta.</p>
        </div>
      </div>

      <div className="grid">
        {clients.length === 0 ? <div className="empty">Aun no hay clientas registradas.</div> : null}
        {clients.map((client) => (
          <article className="card" key={client.id}>
            <div className="card-header">
              <div>
                <h2 className="card-title">{client.name}</h2>
                <p className="small muted">
                  {client.phone}
                  {client.email ? ` · ${client.email}` : ""}
                </p>
              </div>
              <span className="badge">{client.appointments.length} ultimas</span>
            </div>
            {client.appointments.length === 0 ? (
              <p className="small muted">Sin citas todavia.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Servicios</th>
                    <th>Staff</th>
                    <th>Cobrado</th>
                  </tr>
                </thead>
                <tbody>
                  {client.appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{formatDateInZone(appointment.startAt, settings.timezone)}</td>
                      <td>{appointment.services.map((service) => service.serviceNameSnapshot).join(", ")}</td>
                      <td>{appointment.staff.name}</td>
                      <td>
                        {appointment.payments.length
                          ? formatCurrency(
                              appointment.payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
                              settings.currency
                            )
                          : "Pendiente"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
