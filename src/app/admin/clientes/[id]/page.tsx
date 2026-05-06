import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarPlus, Pencil } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { getClientById } from "@/lib/data";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({
  params,
  searchParams
}: PageProps & { searchParams?: Promise<{ ok?: string }> }) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const saved = sp.ok === "1";
  const { client, settings } = await getClientById(id);

  if (!client) {
    notFound();
  }

  const totalSpent = client.appointments.reduce(
    (sum, apt) => sum + apt.payments.reduce((s, p) => s + Number(p.amount), 0),
    0
  );

  const lastAppointment = client.appointments[0] ?? null;
  const lastPaid = lastAppointment
    ? lastAppointment.payments.reduce((s, p) => s + Number(p.amount), 0)
    : 0;
  const lastServices = lastAppointment
    ? lastAppointment.services.map((s) => s.serviceNameSnapshot).join(", ")
    : null;

  return (
    <>
      {saved ? (
        <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 10, padding: "12px 18px", marginBottom: 20, color: "#166534", fontWeight: 500 }}>
          ✓ Cambios guardados correctamente.
        </div>
      ) : null}
      <div className="page-header">
        <div>
          <p className="eyebrow">Cliente</p>
          <h1 className="title">{client.name}</h1>
          <p className="subtitle">
            {client.phone ?? "Sin telefono"}
            {client.email ? ` · ${client.email}` : ""}
          </p>
        </div>
        <div className="button-row">
          <Link className="btn secondary" href={`/admin/clientes/${id}/edit`}>
            <Pencil size={16} aria-hidden />
            Editar
          </Link>
          <Link className="btn" href={`/admin/agenda?clientId=${id}`}>
            <CalendarPlus size={17} aria-hidden />
            Nueva cita
          </Link>
          <Link className="btn secondary" href="/admin/clientes">
            <ArrowLeft size={17} aria-hidden />
            Volver
          </Link>
        </div>
      </div>

      <div className="grid two">
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Datos del cliente</h2>
          </div>
          <div className="form-grid">
            <div>
              <p className="field-label">Telefono</p>
              <p>{client.phone ?? "—"}</p>
            </div>
            {client.email ? (
              <div>
                <p className="field-label">Correo</p>
                <p>{client.email}</p>
              </div>
            ) : null}
            {client.dni ? (
              <div>
                <p className="field-label">DNI</p>
                <p>{client.dni}</p>
              </div>
            ) : null}
            {client.source ? (
              <div>
                <p className="field-label">Referencia</p>
                <p>{client.source}</p>
              </div>
            ) : null}
            {client.notes ? (
              <div>
                <p className="field-label">Notas</p>
                <p className="small muted">{client.notes}</p>
              </div>
            ) : null}
            <div>
              <p className="field-label">Registrada</p>
              <p className="small">{new Date(client.createdAt).toLocaleDateString("es-PE")}</p>
            </div>
            {client.firstVisitAt ? (
              <div>
                <p className="field-label">Primera visita</p>
                <p className="small">{new Date(client.firstVisitAt).toLocaleDateString("es-PE")}</p>
              </div>
            ) : null}

            {lastAppointment ? (
              <>
                <hr style={{ gridColumn: "1/-1", border: "none", borderTop: "1px solid var(--border)" }} />
                <div>
                  <p className="field-label">Ultima visita</p>
                  <p className="small">
                    {formatDateInZone(lastAppointment.startAt, settings.timezone)}{" "}
                    {formatTimeInZone(lastAppointment.startAt, settings.timezone)}
                  </p>
                </div>
                {lastServices ? (
                  <div>
                    <p className="field-label">Ultimo servicio</p>
                    <p className="small">{lastServices}</p>
                  </div>
                ) : null}
                {lastPaid > 0 ? (
                  <div>
                    <p className="field-label">Ultimo pago</p>
                    <p className="small">{formatCurrency(lastPaid, settings.currency)}</p>
                  </div>
                ) : null}
                {totalSpent > 0 ? (
                  <div>
                    <p className="field-label">Total acumulado</p>
                    <p><strong>{formatCurrency(totalSpent, settings.currency)}</strong></p>
                  </div>
                ) : null}
              </>
            ) : totalSpent > 0 ? (
              <div>
                <p className="field-label">Total acumulado</p>
                <p><strong>{formatCurrency(totalSpent, settings.currency)}</strong></p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>Historial de citas</h2>
          {client.appointments.length === 0 ? (
            <div className="empty">Sin citas registradas.</div>
          ) : (
            <div className="grid">
              {client.appointments.map((apt) => {
                const paid = apt.payments.reduce((s, p) => s + Number(p.amount), 0);
                return (
                  <Link className="card" href={`/admin/agenda/${apt.id}`} key={apt.id} style={{ boxShadow: "none" }}>
                    <div className="card-header">
                      <div>
                        <strong className="small">
                          {formatDateInZone(apt.startAt, settings.timezone)} {formatTimeInZone(apt.startAt, settings.timezone)}
                        </strong>
                        <p className="small muted">
                          {apt.services.map((s) => s.serviceNameSnapshot).join(", ")} · {apt.staff.name}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <StatusBadge status={apt.status} />
                        {paid > 0 ? (
                          <p className="small" style={{ textAlign: "right", marginTop: 4, color: "#166534", fontWeight: 600 }}>
                            {formatCurrency(paid, settings.currency)}
                          </p>
                        ) : apt.status === "CANCELED" ? (
                          <p className="small muted" style={{ textAlign: "right", marginTop: 4 }}>Sin cobro</p>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
