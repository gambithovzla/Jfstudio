import Link from "next/link";
import { Scissors, Paintbrush, Sparkles } from "lucide-react";

import { landingContent } from "@/content/landing";
import { formatCurrency } from "@/lib/utils";
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
          ? services.slice(0, 6).map((service, i) => {
              const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
              return (
                <ScrollReveal key={service.id} delay={i < 3 ? (i + 1) as 1 | 2 | 3 : undefined}>
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
                      <strong>{formatCurrency(service.price, currency)}</strong>
                    </div>
                  </article>
                </ScrollReveal>
              );
            })
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
