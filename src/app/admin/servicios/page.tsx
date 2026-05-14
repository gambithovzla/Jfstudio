import Link from "next/link";
import { Pencil, Power, Scissors, Trash2 } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { createServiceAction, deleteServiceAction, toggleServiceAction } from "@/lib/actions";
import { getServicesAdmin, getSalonSettings } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { FlashMessage } from "@/components/flash-message";

export const dynamic = "force-dynamic";

type PageProps = { searchParams?: Promise<{ msg?: string }> };

export default async function ServicesPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const [services, settings] = await Promise.all([getServicesAdmin(), getSalonSettings()]);

  return (
    <>
      <FlashMessage msg={params.msg} />
      <div className="page-header">
        <div>
          <p className="eyebrow">Servicios</p>
          <h1 className="title">Menu del salon</h1>
          <p className="subtitle">Duracion, precio base, adelantos y recetas de producto por servicio.</p>
        </div>
      </div>

      <div className="grid two">
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Nuevo servicio</h2>
            <Scissors size={20} aria-hidden />
          </div>
          <form className="form-grid" action={createServiceAction}>
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input className="input" id="name" name="name" required />
            </div>
            <div className="field">
              <label htmlFor="description">Descripcion</label>
              <textarea className="textarea" id="description" name="description" />
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="durationMinutes">Duracion (min)</label>
                <input className="input" id="durationMinutes" name="durationMinutes" type="number" min="15" step="15" required />
              </div>
              <div className="field">
                <label htmlFor="price">Precio</label>
                <input className="input" id="price" name="price" type="number" min="0" step="0.01" required />
              </div>
            </div>
            <label className="choice">
              <input type="checkbox" name="requiresDeposit" />
              <span>Requiere adelanto</span>
            </label>
            <div className="field">
              <label htmlFor="depositAmount">Monto de adelanto</label>
              <input className="input" id="depositAmount" name="depositAmount" type="number" min="0" step="0.01" defaultValue="0" />
            </div>
            <button className="btn" type="submit">Crear servicio</button>
          </form>
        </section>

        <section className="grid">
          {services.map((service) => (
            <article className="card" key={service.id}>
              <div className="card-header">
                <div>
                  <h2 className="card-title">{service.name}</h2>
                  <p className="small muted">
                    {service.durationMinutes} min · {formatCurrency(Number(service.price), settings.currency)}
                    {service.requiresDeposit ? " · requiere adelanto" : ""}
                  </p>
                </div>
                <span className="badge">{service.isActive ? "Activo" : "Inactivo"}</span>
              </div>
              {service.products.length ? (
                <div className="small muted">
                  {service.products
                    .map((row) => `${row.product.name}: ${Number(row.quantity)} ${row.product.unit}${row.isVariable ? " variable" : ""}`)
                    .join(" · ")}
                </div>
              ) : (
                <p className="small muted">Sin productos asociados.</p>
              )}
              <div className="button-row" style={{ marginTop: 12 }}>
                <Link className="btn secondary" href={`/admin/servicios/${service.id}`}>
                  <Pencil size={15} aria-hidden />
                  Editar
                </Link>
                <form action={toggleServiceAction}>
                  <input type="hidden" name="serviceId" value={service.id} />
                  <input type="hidden" name="nextState" value={String(!service.isActive)} />
                  <button className="btn secondary" type="submit">
                    <Power size={15} aria-hidden />
                    {service.isActive ? "Desactivar" : "Activar"}
                  </button>
                </form>
                <form action={deleteServiceAction}>
                  <input type="hidden" name="serviceId" value={service.id} />
                  <ConfirmSubmitButton
                    className="btn danger"
                    type="submit"
                    message="¿Eliminar este servicio del catálogo? Solo es posible si nunca se usó en una cita."
                  >
                    <Trash2 size={15} aria-hidden />
                    Eliminar
                  </ConfirmSubmitButton>
                </form>
              </div>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
