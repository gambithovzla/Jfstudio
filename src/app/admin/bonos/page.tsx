import Link from "next/link";
import { ArrowLeft, BadgePercent, MessageCircle, Plus, Search } from "lucide-react";

import {
  createBirthdayBonusAction,
  deleteBirthdayBonusAction,
  updateBirthdayBonusAction
} from "@/lib/actions";
import { getBirthdayBonusSettings, getSalonSettings } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { formatDateInZone, formatDateTimeLocalInZone } from "@/lib/time";
import { buildWhatsappLink, renderBirthdayMessage } from "@/lib/whatsapp";
import { ConfirmDeleteBonus } from "@/components/confirm-delete-bonus";
import { CopyCodeButton } from "@/components/copy-code-button";
import { FlashMessage } from "@/components/flash-message";

export const dynamic = "force-dynamic";

export const metadata = { title: "Códigos de descuento · JF Studio" };

type SearchParams = Promise<{ q?: string; msg?: string }>;

export default async function DiscountCodesPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const [settings, bonusSettings] = await Promise.all([getSalonSettings(), getBirthdayBonusSettings()]);

  const q = params.q?.trim().toLowerCase() ?? "";

  const bonuses = await prisma.birthdayBonus.findMany({
    include: {
      client: { select: { name: true, phone: true, email: true } }
    },
    orderBy: { generatedAt: "desc" }
  });

  const filteredBonuses = q
    ? bonuses.filter(
        (b) =>
          b.client.name.toLowerCase().includes(q) ||
          (b.client.phone ?? "").includes(q) ||
          b.code.toLowerCase().includes(q)
      )
    : bonuses;

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true, email: true }
  });

  const now = new Date();

  return (
    <>
      <FlashMessage msg={params.msg} />
      <div className="page-header">
        <div>
          <p className="eyebrow">Promociones</p>
          <h1 className="title">
            <BadgePercent size={26} aria-hidden style={{ verticalAlign: "middle", marginRight: 8 }} />
            Códigos de descuento
          </h1>
          <p className="subtitle">
            Crea bonos manualmente. El código se genera automáticamente, pero <strong>no se envía solo</strong>: usa Copiar o Enviar WhatsApp para entregárselo a la clienta.
          </p>
        </div>
        <div className="button-row">
          <form className="button-row">
            <input className="input" name="q" type="search" placeholder="Buscar código, nombre, teléfono..." defaultValue={params.q} />
            <button className="btn secondary" type="submit">
              <Search size={16} aria-hidden />
              Buscar
            </button>
          </form>
          <Link className="btn secondary" href="/admin/cumpleanos">
            <ArrowLeft size={16} aria-hidden />
            Cumpleaños
          </Link>
        </div>
      </div>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="card-header">
          <h2 className="card-title">
            <Plus size={18} aria-hidden style={{ verticalAlign: "middle", marginRight: 8 }} />
            Nuevo bono
          </h2>
          <span className="small muted" style={{ marginLeft: "auto" }}>
            Descuento por defecto: {bonusSettings.discountPercent}% · {bonusSettings.validityDays} días
          </span>
        </div>

        <form className="form-grid" action={createBirthdayBonusAction}>
          <div className="field">
            <label htmlFor="clientId">Clienta</label>
            <select className="select" id="clientId" name="clientId" required style={{ maxHeight: 260 }}>
              {clients.length === 0 ? (
                <option value="">No hay clientas registradas</option>
              ) : (
                clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} · {client.phone ?? "sin teléfono"}
                    {client.email ? ` · ${client.email}` : ""}
                  </option>
                ))
              )}
            </select>
          </div>
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
                defaultValue={bonusSettings.discountPercent}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="validityDays">Validez (días desde hoy)</label>
              <input
                className="input"
                id="validityDays"
                name="validityDays"
                type="number"
                min="1"
                max="365"
                step="1"
                defaultValue={bonusSettings.validityDays}
                required
              />
            </div>
          </div>
          <div className="button-row">
            <button className="btn" type="submit">
              <Plus size={16} aria-hidden />
              Crear bono (genera código automático)
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Bonos existentes</h2>
          <span className="badge">{filteredBonuses.length}</span>
        </div>

        {filteredBonuses.length === 0 ? (
          <p className="small muted">No hay bonos{q ? ` que coincidan con "${params.q}"` : ""}.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Clienta</th>
                  <th>Código</th>
                  <th>Descuento</th>
                  <th>Generado</th>
                  <th>Vence</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBonuses.map((bonus) => {
                  const expired = bonus.expiresAt < now;
                  const status = bonus.redeemedAt
                    ? { label: "Canjeado", cls: "row-completed" }
                    : expired
                      ? { label: "Vencido", cls: "row-canceled" }
                      : { label: "Activo", cls: "row-confirmed" };

                  return (
                    <tr key={bonus.id} className={status.cls}>
                      <td data-label="Clienta">
                        <strong>{bonus.client.name}</strong>
                        <span className="small muted" style={{ display: "block" }}>
                          {bonus.client.phone ?? "Sin teléfono"}
                        </span>
                      </td>
                      <td data-label="Código">
                        <strong style={{ fontFamily: "ui-monospace, monospace" }}>{bonus.code}</strong>
                        <span className="small muted" style={{ display: "block" }}>
                          {bonus.emailSentAt ? "📧 email" : null}
                          {bonus.emailSentAt && bonus.whatsappSentAt ? " · " : null}
                          {bonus.whatsappSentAt ? "💬 WhatsApp" : null}
                        </span>
                        <span className="button-row" style={{ marginTop: 6 }}>
                          <CopyCodeButton code={bonus.code} />
                          {bonus.client.phone ? (
                            <a
                              className="btn secondary"
                              href={buildWhatsappLink(
                                bonus.client.phone,
                                renderBirthdayMessage({
                                  template: bonusSettings.messageTemplate,
                                  clientName: bonus.client.name,
                                  discountPercent: bonus.discountPercent,
                                  code: bonus.code,
                                  expiresLabel: formatDateInZone(bonus.expiresAt, settings.timezone)
                                })
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                            >
                              <MessageCircle size={14} aria-hidden />
                              Enviar WhatsApp
                            </a>
                          ) : null}
                        </span>
                      </td>
                      <td data-label="Descuento">{bonus.discountPercent}%</td>
                      <td data-label="Generado" className="small">
                        {formatDateInZone(bonus.generatedAt, settings.timezone)}
                      </td>
                      <td data-label="Vence" className="small">
                        {formatDateInZone(bonus.expiresAt, settings.timezone)}
                      </td>
                      <td data-label="Estado">
                        <span className={`small ${bonus.redeemedAt ? "muted" : ""}`} style={{ fontWeight: 700 }}>
                          {status.label}
                        </span>
                      </td>
                      <td data-label="Acciones">
                        <form className="button-row" action={updateBirthdayBonusAction} style={{ flexWrap: "wrap" }}>
                          <input type="hidden" name="bonusId" value={bonus.id} />
                          <input
                            className="input"
                            type="number"
                            name="discountPercent"
                            min="1"
                            max="100"
                            step="1"
                            defaultValue={bonus.discountPercent}
                            style={{ width: 64 }}
                            aria-label={`Descuento de ${bonus.code}`}
                          />
                          <input
                            className="input"
                            type="datetime-local"
                            name="expiresAt"
                            defaultValue={formatDateTimeLocalInZone(bonus.expiresAt, settings.timezone)}
                            aria-label={`Vencimiento de ${bonus.code}`}
                          />
                          <button className="btn secondary" type="submit">
                            Guardar
                          </button>
                        </form>
                        <div style={{ marginTop: 8 }}>
                          <ConfirmDeleteBonus
                            bonusId={bonus.id}
                            code={bonus.code}
                            action={deleteBirthdayBonusAction}
                            disabled={Boolean(bonus.redeemedAt)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}