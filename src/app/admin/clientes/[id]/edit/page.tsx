import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { deleteClientAction, updateClientAction } from "@/lib/actions";
import { getClientById } from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params;
  const { client } = await getClientById(id);

  if (!client) {
    notFound();
  }

  const hasAppointments = client.appointments.length > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Editar cliente</p>
          <h1 className="title">{client.name}</h1>
        </div>
        <Link className="btn secondary" href={`/admin/clientes/${id}`}>
          <ArrowLeft size={17} aria-hidden />
          Volver
        </Link>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <form className="form-grid" action={updateClientAction}>
          <input type="hidden" name="clientId" value={client.id} />
          <div className="grid two">
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input className="input" id="name" name="name" defaultValue={client.name} required />
            </div>
            <div className="field">
              <label htmlFor="phone">Telefono</label>
              <input className="input" id="phone" name="phone" defaultValue={client.phone ?? ""} />
            </div>
          </div>
          <div className="grid two">
            <div className="field">
              <label htmlFor="email">Correo</label>
              <input className="input" id="email" name="email" type="email" defaultValue={client.email ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="dni">DNI</label>
              <input className="input" id="dni" name="dni" defaultValue={client.dni ?? ""} />
            </div>
          </div>
          <div className="grid two">
            <div className="field">
              <label htmlFor="birthday">Cumpleaños</label>
              <input
                className="input"
                id="birthday"
                name="birthday"
                type="date"
                defaultValue={client.birthday ? new Date(client.birthday).toISOString().slice(0, 10) : ""}
              />
            </div>
            <div className="field">
              <label htmlFor="source">Referencia</label>
              <input className="input" id="source" name="source" defaultValue={client.source ?? ""} placeholder="Ej: Recomendada, Instagram" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="notes">Notas internas</label>
            <textarea className="textarea" id="notes" name="notes" defaultValue={client.notes ?? ""} />
          </div>
          <div className="button-row">
            <button className="btn" type="submit">Guardar cambios</button>
            <Link className="btn secondary" href={`/admin/clientes/${id}`}>Cancelar</Link>
          </div>
        </form>

        {!hasAppointments ? (
          <>
            <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "20px 0" }} />
            <form action={deleteClientAction}>
              <input type="hidden" name="clientId" value={client.id} />
              <p className="small muted" style={{ marginBottom: 10 }}>
                Esta clienta no tiene citas. Puedes eliminarla permanentemente.
              </p>
              <button className="btn danger" type="submit">
                Eliminar clienta
              </button>
            </form>
          </>
        ) : null}
      </div>
    </>
  );
}
