import Link from "next/link";
import { Cake, Mail, MessageCircle, Settings } from "lucide-react";

import { Prisma } from "@prisma/client";

import { markBirthdayBonusWhatsappSentAction } from "@/lib/actions";
import { getBirthdayBonusesForToday, getBirthdayBonusSettings, getSalonSettings } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { formatDateInZone } from "@/lib/time";
import { buildWhatsappLink, renderBirthdayMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cumpleaños · JF Studio" };

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

type SearchParams = Promise<{ mes?: string }>;

export default async function BirthdaysPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const [salon, bonusSettings] = await Promise.all([
    getSalonSettings(),
    getBirthdayBonusSettings()
  ]);

  const tz = salon.timezone;
  const todayInfo = await getBirthdayBonusesForToday(tz);
  const now = new Date();
  const monthFilter = Number(params.mes ?? now.getMonth() + 1);
  const validMonth = Number.isFinite(monthFilter) && monthFilter >= 1 && monthFilter <= 12 ? monthFilter : now.getMonth() + 1;

  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const yearEnd = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));

  const monthClientIds = await prisma.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`
      SELECT c.id
      FROM "Client" c
      WHERE c.birthday IS NOT NULL
        AND EXTRACT(MONTH FROM c.birthday)::int = ${validMonth}
    `
  );

  const allBirthdays =
    monthClientIds.length === 0
      ? []
      : await prisma.client.findMany({
          where: { id: { in: monthClientIds.map((r) => r.id) } },
          include: {
            birthdayBonuses: {
              where: {
                generatedAt: {
                  gte: yearStart,
                  lt: yearEnd
                }
              },
              orderBy: { generatedAt: "desc" },
              take: 1
            }
          }
        });

  const monthBirthdays = allBirthdays
    .filter((c) => c.birthday && c.birthday.getUTCMonth() + 1 === validMonth)
    .sort((a, b) => (a.birthday!.getUTCDate() - b.birthday!.getUTCDate()));

  const todayClients = todayInfo.candidates;

  const whatsappLinkFor = (
    client: { name: string; phone: string | null },
    bonus: { code: string; discountPercent: number; expiresAt: Date }
  ) => {
    if (!client.phone) return null;
    const message = renderBirthdayMessage({
      template: bonusSettings.messageTemplate,
      clientName: client.name,
      discountPercent: bonus.discountPercent,
      code: bonus.code,
      expiresLabel: formatDateInZone(bonus.expiresAt, tz)
    });
    return buildWhatsappLink(client.phone, message);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Cumpleaños</p>
          <h1 className="title">
            <Cake size={26} aria-hidden style={{ verticalAlign: "middle", marginRight: 8 }} />
            Saludos y bonos
          </h1>
          <p className="subtitle">
            {bonusSettings.enabled
              ? `Activo · ${bonusSettings.discountPercent}% de descuento, válido ${bonusSettings.validityDays} días.`
              : "Saludo automático desactivado."}
          </p>
        </div>
        <div className="button-row">
          <Link className="btn secondary" href="/admin/configuracion/cumpleanos">
            <Settings size={16} aria-hidden />
            Configurar bono
          </Link>
        </div>
      </div>

      {/* Cumpleaños de HOY */}
      <section className="card" style={{ marginBottom: 18 }}>
        <div className="card-header">
          <h2 className="card-title">🎂 Hoy ({formatDateInZone(now, tz)})</h2>
          <span className="badge">{todayClients.length}</span>
        </div>

        {todayClients.length === 0 ? (
          <p className="small muted">No hay cumpleaños hoy.</p>
        ) : (
          <div className="grid">
            {todayClients.map((client) => {
              const bonus = client.birthdayBonuses[0];
              return (
                <article className="card" key={client.id} style={{ boxShadow: "none" }}>
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">{client.name}</h3>
                      <p className="small muted">
                        {client.phone ?? "Sin teléfono"}
                        {client.email ? ` · ${client.email}` : ""}
                      </p>
                      {bonus ? (
                        <p className="small">
                          Código: <strong>{bonus.code}</strong> · {bonus.discountPercent}% · vence {formatDateInZone(bonus.expiresAt, tz)}
                        </p>
                      ) : (
                        <p className="small muted">Bono pendiente — corre el cron <code>/api/cron/birthdays</code>.</p>
                      )}
                      <p className="small muted">
                        {bonus?.emailSentAt ? <>📧 Email enviado · </> : null}
                        {bonus?.whatsappSentAt ? <>💬 WhatsApp marcado como enviado</> : null}
                      </p>
                    </div>
                    <div className="button-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                      {bonus && client.phone ? (
                        <a
                          className="btn"
                          href={whatsappLinkFor(client, bonus)!}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle size={16} aria-hidden />
                          Enviar WhatsApp
                        </a>
                      ) : null}
                      {bonus && !bonus.whatsappSentAt && client.phone ? (
                        <form action={markBirthdayBonusWhatsappSentAction}>
                          <input type="hidden" name="bonusId" value={bonus.id} />
                          <button className="btn secondary" type="submit" style={{ width: "100%" }}>
                            Marcar como enviado
                          </button>
                        </form>
                      ) : null}
                      {bonus?.emailSentAt && client.email ? (
                        <span className="small muted" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Mail size={14} aria-hidden /> Email enviado
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Calendario por mes */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Calendario de cumpleaños</h2>
          <form className="button-row">
            <select className="select" name="mes" defaultValue={validMonth} style={{ width: 160 }}>
              {MONTHS.map((label, i) => (
                <option key={i} value={i + 1}>
                  {label}
                </option>
              ))}
            </select>
            <button className="btn secondary" type="submit">Ver</button>
          </form>
        </div>

        {monthBirthdays.length === 0 ? (
          <p className="small muted">No hay clientas con cumpleaños registrado en {MONTHS[validMonth - 1]}.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Día</th>
                <th>Clienta</th>
                <th>Contacto</th>
                <th>Bono este año</th>
              </tr>
            </thead>
            <tbody>
              {monthBirthdays.map((client) => {
                const bonus = client.birthdayBonuses[0];
                return (
                  <tr key={client.id}>
                    <td className="small" data-label="Día">{client.birthday!.getUTCDate()}</td>
                    <td className="small" data-label="Clienta">{client.name}</td>
                    <td className="small" data-label="Contacto">
                      {client.phone ?? "—"}
                      {client.email ? ` · ${client.email}` : ""}
                    </td>
                    <td className="small" data-label="Bono">
                      {bonus ? (
                        <>
                          <strong>{bonus.code}</strong> · {bonus.discountPercent}%
                          {bonus.redeemedAt ? " · canjeado" : bonus.expiresAt < now ? " · vencido" : " · activo"}
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
