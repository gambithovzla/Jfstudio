import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { adjustProductStockAction, updateProductAction } from "@/lib/actions";
import { getProductById } from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const movementTypeLabel: Record<string, string> = {
  PURCHASE: "Compra",
  ADJUSTMENT: "Ajuste",
  SERVICE_USAGE: "Consumo"
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const isLow = Number(product.stock) <= Number(product.lowStockThreshold);

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Producto</p>
          <h1 className="title">{product.name}</h1>
          <p className="subtitle">
            Stock: <strong>{Number(product.stock)} {product.unit}</strong>
            {isLow ? <span className="badge low" style={{ marginLeft: 8 }}>Stock bajo</span> : null}
          </p>
        </div>
        <Link className="btn secondary" href="/admin/productos">
          <ArrowLeft size={17} aria-hidden />
          Volver
        </Link>
      </div>

      <div className="grid two">
        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>Editar producto</h2>
          <form className="form-grid" action={updateProductAction}>
            <input type="hidden" name="productId" value={product.id} />
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input className="input" id="name" name="name" defaultValue={product.name} required />
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="unit">Unidad</label>
                <input className="input" id="unit" name="unit" placeholder="ml, g, uds" defaultValue={product.unit} required />
              </div>
              <div className="field">
                <label htmlFor="lowStockThreshold">Umbral de alerta</label>
                <input
                  className="input"
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={Number(product.lowStockThreshold)}
                  required
                />
              </div>
            </div>
            <button className="btn" type="submit">Guardar cambios</button>
          </form>

          <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "20px 0" }} />

          <h3 className="card-title" style={{ marginBottom: 14, fontSize: "0.97rem" }}>Ajustar stock</h3>
          <form className="form-grid" action={adjustProductStockAction}>
            <input type="hidden" name="productId" value={product.id} />
            <div className="grid two">
              <div className="field">
                <label htmlFor="quantity">Cantidad (+ entrada / - salida)</label>
                <input className="input" id="quantity" name="quantity" type="number" step="0.01" required />
              </div>
              <div className="field">
                <label htmlFor="note">Nota</label>
                <input className="input" id="note" name="note" placeholder="Ej: compra proveedor" />
              </div>
            </div>
            <button className="btn secondary" type="submit">Registrar movimiento</button>
          </form>
        </section>

        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>Historial de movimientos</h2>
          {product.movements.length === 0 ? (
            <div className="empty">Sin movimientos registrados.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Clienta / Nota</th>
                </tr>
              </thead>
              <tbody>
                {product.movements.map((mv) => (
                  <tr key={mv.id}>
                    <td className="small">{new Date(mv.createdAt).toLocaleDateString("es-PE")}</td>
                    <td className="small">{movementTypeLabel[mv.type] ?? mv.type}</td>
                    <td className="small" style={{ color: Number(mv.quantity) < 0 ? "var(--danger)" : "var(--brand)" }}>
                      {Number(mv.quantity) > 0 ? "+" : ""}{Number(mv.quantity)} {product.unit}
                    </td>
                    <td className="small muted">
                      {mv.type === "SERVICE_USAGE" && mv.appointment?.client ? (
                        <Link href={`/admin/clientes/${mv.appointment.client.id}`} style={{ color: "var(--brand)", textDecoration: "none" }}>
                          {mv.appointment.client.name}
                        </Link>
                      ) : (
                        mv.note ?? "-"
                      )}
                    </td>
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
