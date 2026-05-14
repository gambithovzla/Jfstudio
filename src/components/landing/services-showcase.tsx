import Link from "next/link";
import { Scissors, Paintbrush, Sparkles } from "lucide-react";

import { landingContent } from "@/content/landing";
import { isLaceadoPartitioned, partitionLaceadoServices } from "@/lib/laceado-services";
import { formatCurrency } from "@/lib/utils";
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
              const partition = partitionLaceadoServices(services);
              const { laceadoLengthTiers, laceadoAbundancia, otherServices } = partition;
              const hasLaceadoGroup = isLaceadoPartitioned(partition);

              type RowItem = { kind: "laceado" } | { kind: "svc"; service: Service };
              const rows: RowItem[] = [];
              if (hasLaceadoGroup) rows.push({ kind: "laceado" });
              for (const s of otherServices) rows.push({ kind: "svc", service: s });

              const maxLaceadoMin =
                laceadoLengthTiers.length > 0 ? Math.max(...laceadoLengthTiers.map((t) => t.durationMinutes)) : 0;
              const minLaceadoPrice = laceadoLengthTiers[0]?.price ?? 0;

              return rows.slice(0, 6).map((item, i) => {
                const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
                if (item.kind === "laceado") {
                  return (
                    <ScrollReveal key="laceado-org-group" delay={i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined}>
                      <article className="card service-card">
                        <div className="service-card-icon">
                          <Icon size={22} aria-hidden />
                        </div>
                        <h3 className="card-title">Laceado orgánico</h3>
                        <p className="small muted">
                          Alisado orgánico con productos profesionales. Elige el largo de tu cabello al reservar.
                        </p>
                        <div className="service-card-meta">
                          <span className="badge">{maxLaceadoMin} min</span>
                          <span className="price-with-disclaimer">
                            <PriceDisclaimer />
                            <strong>Desde {formatCurrency(minLaceadoPrice, currency)}</strong>
                          </span>
                        </div>
                        {laceadoAbundancia ? (
                          <p className="small muted" style={{ marginTop: 8, marginBottom: 0 }}>
                            Suplemento por abundancia +{formatCurrency(laceadoAbundancia.price, currency)} (opcional).
                          </p>
                        ) : null}
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
                      <h3 className="card-title">{service.name}</h3>
                      {service.description ? (
                        <p className="small muted">{service.description}</p>
                      ) : null}
                      <div className="service-card-meta">
                        <span className="badge">{service.durationMinutes} min</span>
                        <span className="price-with-disclaimer">
                          <PriceDisclaimer />
                          <strong>{formatCurrency(service.price, currency)}</strong>
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
