import Link from "next/link";
import { Scissors, Paintbrush, Sparkles } from "lucide-react";

import { landingContent } from "@/content/landing";
import { isLaceadoPartitioned, partitionLaceadoServices } from "@/lib/laceado-services";
import { isBotoxPartitioned, partitionBotoxServices } from "@/lib/botox-services";
import { formatDesdeCurrency, polishServiceDescription, polishServiceTitle } from "@/lib/public-service-copy";
import { PriceDisclaimer } from "./price-disclaimer";
import { ScrollReveal } from "./scroll-reveal";

const SERVICE_ICONS = [Scissors, Paintbrush, Sparkles, Scissors, Paintbrush, Sparkles];

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
};

type Props = {
  services: Service[];
  currency: string;
};

export function ServicesShowcase({ services, currency }: Props) {
  const { services: copy } = landingContent;
  const showDb = services.length > 0;

  return (
    <section className="landing-section" id="servicios">
      <ScrollReveal>
        <div className="section-header">
          <p className="eyebrow">{copy.title}</p>
          <h2 className="section-title">{copy.description}</h2>
        </div>
      </ScrollReveal>
      <div className="grid three landing-card-grid">
        {showDb
          ? (() => {
              const laceadoPartition = partitionLaceadoServices(services);
              const botoxPartition = partitionBotoxServices(laceadoPartition.otherServices);
              const { laceadoLengthTiers } = laceadoPartition;
              const { botoxLengthTiers, otherServices } = botoxPartition;
              const hasLaceadoGroup = isLaceadoPartitioned(laceadoPartition);
              const hasBotoxGroup = isBotoxPartitioned(botoxPartition);

              type RowItem = { kind: "laceado" } | { kind: "botox" } | { kind: "svc"; service: Service };
              const rows: RowItem[] = [];
              if (hasLaceadoGroup) rows.push({ kind: "laceado" });
              if (hasBotoxGroup) rows.push({ kind: "botox" });
              for (const s of otherServices) rows.push({ kind: "svc", service: s });

              const maxLaceadoMin =
                laceadoLengthTiers.length > 0 ? Math.max(...laceadoLengthTiers.map((t) => t.durationMinutes)) : 0;
              const minLaceadoPrice = laceadoLengthTiers[0]?.price ?? 0;
              const maxBotoxMin =
                botoxLengthTiers.length > 0 ? Math.max(...botoxLengthTiers.map((t) => t.durationMinutes)) : 0;
              const minBotoxPrice = botoxLengthTiers[0]?.price ?? 0;

              return rows.slice(0, 6).map((item, i) => {
                const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
                if (item.kind === "laceado") {
                  return (
                    <ScrollReveal key="laceado-org-group" delay={i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined}>
                      <article className="card service-card">
                        <div className="service-card-icon">
                          <Icon size={22} aria-hidden />
                        </div>
                        <h3 className="card-title">Laceado Orgánico</h3>
                        <p className="small muted">
                          {polishServiceDescription(
                            "Alisado orgánico con productos profesionales. Elige el largo de tu cabello al reservar."
                          )}
                        </p>
                        <div className="service-card-meta">
                          <span className="badge">{maxLaceadoMin} min</span>
                          <span className="price-with-disclaimer">
                            <PriceDisclaimer />
                            <strong>{formatDesdeCurrency(minLaceadoPrice, currency)}</strong>
                          </span>
                        </div>
                      </article>
                    </ScrollReveal>
                  );
                }
                if (item.kind === "botox") {
                  return (
                    <ScrollReveal key="botox-org-group" delay={i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined}>
                      <article className="card service-card">
                        <div className="service-card-icon">
                          <Icon size={22} aria-hidden />
                        </div>
                        <h3 className="card-title">Botox Orgánico</h3>
                        <p className="small muted">
                          {polishServiceDescription(
                            "Tratamiento botox orgánico. Elige el largo de tu cabello al reservar."
                          )}
                        </p>
                        <div className="service-card-meta">
                          <span className="badge">{maxBotoxMin} min</span>
                          <span className="price-with-disclaimer">
                            <PriceDisclaimer />
                            <strong>{formatDesdeCurrency(minBotoxPrice, currency)}</strong>
                          </span>
                        </div>
                      </article>
                    </ScrollReveal>
                  );
                }
                const service = item.service;
                return (
                  <ScrollReveal key={service.id} delay={i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined}>
                    <article className="card service-card">
                      <div className="service-card-icon">
                        <Icon size={22} aria-hidden />
                      </div>
                      <h3 className="card-title">{polishServiceTitle(service.name)}</h3>
                      {service.description ? (
                        <p className="small muted">{polishServiceDescription(service.description)}</p>
                      ) : null}
                      <div className="service-card-meta">
                        <span className="badge">{service.durationMinutes} min</span>
                        <span className="price-with-disclaimer">
                          <PriceDisclaimer />
                          <strong>{formatDesdeCurrency(service.price, currency)}</strong>
                        </span>
                      </div>
                    </article>
                  </ScrollReveal>
                );
              });
            })()
          : copy.items.map((item, i) => {
              const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
              return (
                <ScrollReveal key={item.title} delay={i < 3 ? (i + 1) as 1 | 2 | 3 : undefined}>
                  <article className="card service-card">
                    <div className="service-card-icon">
                      <Icon size={22} aria-hidden />
                    </div>
                    <h3 className="card-title">{item.title}</h3>
                    <p className="small muted">{item.description}</p>
                    {item.highlight ? <span className="badge">{item.highlight}</span> : null}
                  </article>
                </ScrollReveal>
              );
            })}
      </div>
      <ScrollReveal>
        <div className="button-row" style={{ marginTop: 24, justifyContent: "center" }}>
          <Link className="btn" href="/reservar">
            Ver disponibilidad y reservar
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
