import Link from "next/link";
import { ArrowLeft, Cake } from "lucide-react";

import { updateBirthdayBonusSettingsAction } from "@/lib/actions";
import { getBirthdayBonusSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Bono de cumpleaños · JF Studio" };

const PLACEHOLDERS = ["{nombre}", "{descuento}", "{codigo}", "{vence}"];

export default async function BirthdayBonusConfigPage() {
  const settings = await getBirthdayBonusSettings();

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Configuración</p>
          <h1 className="title">Bono de cumpleaños</h1>
          <p className="subtitle">
            Configura el descuento que recibirán las clientas el día de su cumpleaños y el mensaje que se les envía.
          </p>
        </div>
        <Link className="btn secondary" href="/admin/configuracion">
          <ArrowLeft size={17} aria-hidden />
          Volver
        </Link>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-header">
          <h2 className="card-title">
            <Cake size={20} aria-hidden style={{ verticalAlign: "middle", marginRight: 8 }} />
            Saludo automático
          </h2>
        </div>

        <form className="form-grid" action={updateBirthdayBonusSettingsAction}>
          <label className="choice" style={{ minHeight: 42, padding: "0 12px" }}>
            <input type="checkbox" name="enabled" defaultChecked={settings.enabled} />
            <span>Activar saludo de cumpleaños</span>
          </label>

          <div className="grid two">
            <div className="field">
              <label htmlFor="discountPercent">Descuento (%)</label>
              <input
                className="input"
                id="discountPercent"
                name="discountPercent"
                type="number"
                min="1"
                max="100"
                step="1"
                defaultValue={settings.discountPercent}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="validityDays">Validez (días)</label>
              <input
                className="input"
                id="validityDays"
                name="validityDays"
                type="number"
                min="1"
                max="365"
                step="1"
                defaultValue={settings.validityDays}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="messageTemplate">Mensaje</label>
            <textarea
              className="textarea"
              id="messageTemplate"
              name="messageTemplate"
              rows={6}
              defaultValue={settings.messageTemplate}
            />
            <p className="small muted" style={{ marginTop: 6 }}>
              Variables disponibles:{" "}
              {PLACEHOLDERS.map((p) => (
                <code key={p} style={{ background: "var(--surface-soft)", padding: "1px 6px", borderRadius: 4, marginRight: 6 }}>
                  {p}
                </code>
              ))}
            </p>
          </div>

          <div className="button-row">
            <button className="btn" type="submit">Guardar configuración</button>
          </div>
        </form>
      </div>
    </>
  );
}
