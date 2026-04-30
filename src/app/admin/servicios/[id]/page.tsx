import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Minus, Plus } from "lucide-react";

import {
  addServiceProductAction,
  removeServiceProductAction,
  updateServiceAction,
  updateServiceProductAction
} from "@/lib/actions";
import { getServiceById } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditServicePage({ params }: PageProps) {
  const { id } = await params;
  const { service, allProducts } = await getServiceById(id);

  if (!service) {
    notFound();
  }

  const linkedProductIds = new Set(service.products.map((p) => p.productId));
  const availableProducts = allProducts.filter((p) => !linkedProductIds.has(p.id));

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Servicio</p>
          <h1 className="title">{service.name}</h1>
        </div>
        <Link className="btn secondary" href="/admin/servicios">
          <ArrowLeft size={17} aria-hidden />
          Volver
        </Link>
      </div>

      <div className="grid two">
        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 16 }}>
            Datos del servicio
          </h2>
          <form className="form-grid" action={updateServiceAction}>
            <input type="hidden" name="serviceId" value={service.id} />
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input className="input" id="name" name="name" defaultValue={service.name} required />
            </div>
            <div className="field">
              <label htmlFor="description">Descripcion</label>
              <textarea className="textarea" id="description" name="description" defaultValue={service.description ?? ""} />
            </div>
            <div className="grid three">
              <div className="field">
                <label htmlFor="durationMinutes">Duracion (min)</label>
                <input
                  className="input"
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  min="15"
                  step="15"
                  defaultValue={service.durationMinutes}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="price">Precio</label>
                <input
                  className="input"
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={Number(service.price)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="depositAmount">Deposito</label>
                <input
                  className="input"
                  id="depositAmount"
                  name="depositAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={Number(service.depositAmount ?? 0)}
                />
              </div>
            </div>
            <label className="choice">
              <input name="requiresDeposit" type="checkbox" defaultChecked={service.requiresDeposit} />
              <span>Requiere deposito</span>
            </label>
            <button className="btn" type="submit">
              Guardar cambios
            </button>
          </form>
        </section>

        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 4 }}>
            Receta de productos
          </h2>
          <p className="small muted" style={{ marginBottom: 16 }}>
            Los productos se descuentan del inventario al completar la cita.
          </p>

          {service.products.length === 0 ? (
            <div className="empty">Sin productos asignados.</div>
          ) : (
            <div className="form-grid">
              {service.products.map((sp) => (
                <div key={sp.id} className="card" style={{ boxShadow: "none" }}>
                  <div className="card-header" style={{ marginBottom: 10 }}>
                    <div>
                      <strong>{sp.product.name}</strong>
                      <span className="small muted"> ({sp.product.unit})</span>
                    </div>
                    <form action={removeServiceProductAction}>
                      <input type="hidden" name="serviceProductId" value={sp.id} />
                      <input type="hidden" name="serviceId" value={service.id} />
                      <button className="btn danger" type="submit" style={{ minHeight: 34, padding: "0 10px" }}>
                        <Minus size={15} aria-hidden />
                      </button>
                    </form>
                  </div>
                  <form className="grid two" action={updateServiceProductAction} style={{ gap: 10 }}>
                    <input type="hidden" name="serviceProductId" value={sp.id} />
                    <input type="hidden" name="serviceId" value={service.id} />
                    <div className="field">
                      <label>Cantidad ({sp.product.unit})</label>
                      <input className="input" name="quantity" type="number" step="0.01" min="0" defaultValue={Number(sp.quantity)} />
                    </div>
                    <div className="field" style={{ justifyContent: "flex-end" }}>
                      <label className="choice" style={{ marginTop: "auto" }}>
                        <input name="isVariable" type="checkbox" defaultChecked={sp.isVariable} />
                        <span className="small">Variable</span>
                      </label>
                    </div>
                    <button className="btn secondary" type="submit" style={{ gridColumn: "1/-1" }}>
                      Actualizar cantidad
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          {availableProducts.length > 0 ? (
            <form className="form-grid" action={addServiceProductAction} style={{ marginTop: 16 }}>
              <input type="hidden" name="serviceId" value={service.id} />
              <h3 className="card-title" style={{ fontSize: "0.95rem" }}>
                Agregar producto
              </h3>
              <div className="grid three" style={{ gap: 10 }}>
                <div className="field">
                  <label>Producto</label>
                  <select className="select" name="productId" required>
                    {availableProducts.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name} ({p.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Cantidad</label>
                  <input className="input" name="quantity" type="number" step="0.01" min="0" defaultValue={1} required />
                </div>
                <div className="field" style={{ justifyContent: "flex-end" }}>
                  <label className="choice" style={{ marginTop: "auto" }}>
                    <input name="isVariable" type="checkbox" />
                    <span className="small">Variable</span>
                  </label>
                </div>
              </div>
              <button className="btn secondary" type="submit">
                <Plus size={16} aria-hidden />
                Agregar
              </button>
            </form>
          ) : null}
        </section>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="small muted">
          Precio actual: <strong>{formatCurrency(Number(service.price))}</strong> · Duracion:{" "}
          <strong>{service.durationMinutes} min</strong>
          {service.requiresDeposit ? ` · Deposito: ${formatCurrency(Number(service.depositAmount ?? 0))}` : ""}
        </p>
      </div>
    </>
  );
}
