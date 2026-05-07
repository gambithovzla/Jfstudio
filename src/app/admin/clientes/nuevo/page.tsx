import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClientAction } from "@/lib/actions";

export const metadata = { title: "Nueva clienta" };

export default function NewClientPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1 className="title">Nueva clienta</h1>
        </div>
        <Link className="btn secondary" href="/admin/clientes">
          <ArrowLeft size={17} aria-hidden />
          Volver
        </Link>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <form className="form-grid" action={createClientAction}>
          <div className="grid two">
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input className="input" id="name" name="name" required />
            </div>
            <div className="field">
              <label htmlFor="phone">Telefono</label>
              <input className="input" id="phone" name="phone" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="email">Correo</label>
            <input className="input" id="email" name="email" type="email" />
          </div>
          <div className="grid two">
            <div className="field">
              <label htmlFor="documentType">Tipo de documento</label>
              <select className="select" id="documentType" name="documentType" defaultValue="DNI">
                <option value="DNI">DNI</option>
                <option value="CE">Carnet de extranjería</option>
                <option value="PASSPORT">Pasaporte</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="dni">Número de documento</label>
              <input className="input" id="dni" name="dni" />
            </div>
          </div>
          <div className="grid two">
            <div className="field">
              <label htmlFor="birthday">Cumpleaños</label>
              <input className="input" id="birthday" name="birthday" type="date" />
            </div>
            <div className="field">
              <label htmlFor="source">Referencia</label>
              <input className="input" id="source" name="source" placeholder="Ej: Recomendada, Instagram" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="notes">Notas internas</label>
            <textarea className="textarea" id="notes" name="notes" placeholder="Alergias, preferencias..." />
          </div>
          <div className="button-row">
            <button className="btn" type="submit">Crear clienta</button>
            <Link className="btn secondary" href="/admin/clientes">Cancelar</Link>
          </div>
        </form>
      </div>
    </>
  );
}
