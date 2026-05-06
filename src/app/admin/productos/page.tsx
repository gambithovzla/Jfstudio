import Link from "next/link";
import { History, PackagePlus, PlusCircle } from "lucide-react";

import { adjustProductStockAction, createProductAction } from "@/lib/actions";
import { getProductsAdmin } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProductsAdmin();
  const lowStock = products.filter((product) => Number(product.stock) <= Number(product.lowStockThreshold));

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Inventario</p>
          <h1 className="title">Productos</h1>
          <p className="subtitle">Stock actual, umbrales bajos y movimientos por ajustes o servicios.</p>
        </div>
      </div>

      {lowStock.length ? (
        <section className="card" style={{ marginBottom: 16 }}>
          <h2 className="card-title">Stock bajo</h2>
          <div className="button-row" style={{ marginTop: 12 }}>
            {lowStock.map((product) => (
              <span className="badge low" key={product.id}>
                {product.name}: {Number(product.stock)} {product.unit}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid two">
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Nuevo producto</h2>
            <PackagePlus size={20} aria-hidden />
          </div>
          <form className="form-grid" action={createProductAction}>
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input className="input" id="name" name="name" required />
            </div>
            <div className="grid three">
              <div className="field">
                <label htmlFor="unit">Unidad</label>
                <input className="input" id="unit" name="unit" placeholder="ml, g, uds" required />
              </div>
              <div className="field">
                <label htmlFor="stock">Stock</label>
                <input className="input" id="stock" name="stock" type="number" step="0.01" required />
              </div>
              <div className="field">
                <label htmlFor="lowStockThreshold">Umbral</label>
                <input className="input" id="lowStockThreshold" name="lowStockThreshold" type="number" step="0.01" required />
              </div>
            </div>
            <button className="btn" type="submit">
              Crear producto
            </button>
          </form>
        </section>

        <section className="grid">
          {products.map((product) => (
            <article className="card" key={product.id}>
              <div className="card-header">
                <div>
                  <h2 className="card-title">{product.name}</h2>
                  <p className="small muted">
                    {Number(product.stock)} {product.unit} · minimo {Number(product.lowStockThreshold)} {product.unit}
                  </p>
                </div>
                {Number(product.stock) <= Number(product.lowStockThreshold) ? <span className="badge low">Bajo</span> : null}
              </div>
              <form className="form-grid" action={adjustProductStockAction}>
                <input type="hidden" name="productId" value={product.id} />
                <div className="grid two">
                  <div className="field">
                    <label htmlFor={`quantity-${product.id}`}>Ajuste</label>
                    <input className="input" id={`quantity-${product.id}`} name="quantity" type="number" step="0.01" required />
                  </div>
                  <div className="field">
                    <label htmlFor={`note-${product.id}`}>Nota</label>
                    <input className="input" id={`note-${product.id}`} name="note" />
                  </div>
                </div>
                <div className="button-row">
                  <button className="btn secondary" type="submit">
                    <PlusCircle size={17} aria-hidden />
                    Aplicar ajuste
                  </button>
                  <Link className="btn secondary" href={`/admin/productos/${product.id}`}>
                    <History size={17} aria-hidden />
                    Historial
                  </Link>
                </div>
              </form>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
