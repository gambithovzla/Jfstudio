import Link from "next/link";
import { ArrowLeft, Cake } from "lucide-react";

import { updateClientBirthdayAction } from "@/lib/actions";
import { getClientsWithoutBirthday } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function BirthdaysPage() {
  await requireAdmin();
  const clients = await getClientsWithoutBirthday();

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1 className="title">Cumpleaños pendientes</h1>
          <p className="subtitle">
            {clients.length === 0
              ? "Todas las clientas tienen cumpleaños registrado."
              : `${clients.length} clienta${clients.length !== 1 ? "s" : ""} sin fecha de cumpleaños.`}
          </p>
        </div>
        <Link className="btn secondary" href="/admin/clientes">
          <ArrowLeft size={16} aria-hidden />
          Volver
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="empty">
          <Cake size={32} aria-hidden />
          <p>¡Todas las clientas tienen cumpleaños registrado!</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th style={{ textAlign: "center" }}>Citas</th>
                <th>Fecha de cumpleaños</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <strong>{client.name}</strong>
                  </td>
                  <td className="small muted">{client.phone}</td>
                  <td className="small" style={{ textAlign: "center" }}>
                    {client._count.appointments}
                  </td>
                  <td colSpan={2}>
                    <form
                      action={updateClientBirthdayAction}
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <input type="hidden" name="clientId" value={client.id} />
                      <input
                        className="input"
                        type="date"
                        name="birthday"
                        required
                        max={new Date().toISOString().slice(0, 10)}
                        style={{ maxWidth: 180 }}
                      />
                      <button className="btn secondary" type="submit" style={{ whiteSpace: "nowrap" }}>
                        <Cake size={14} aria-hidden />
                        Guardar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
