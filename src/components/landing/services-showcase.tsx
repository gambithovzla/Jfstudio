import Link from "next/link";
import { Scissors } from "lucide-react";

import { landingContent } from "@/content/landing";
import { formatCurrency } from "@/lib/utils";

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
      <div className="section-header">
        <p className="eyebrow">{copy.title}</p>
        <h2 className="section-title">{copy.description}</h2>
      </div>
      <div className="grid three landing-card-grid">
        {showDb
          ? services.slice(0, 6).map((service) => (
              <article className="card service-card" key={service.id}>
                <div className="service-card-icon">
                  <Scissors size={20} aria-hidden />
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
            ))
          : copy.items.map((item) => (
              <article className="card service-card" key={item.title}>
                <div className="service-card-icon">
                  <Scissors size={20} aria-hidden />
                </div>
                <h3 className="card-title">{item.title}</h3>
                <p className="small muted">{item.description}</p>
                {item.highlight ? <span className="badge">{item.highlight}</span> : null}
              </article>
            ))}
      </div>
      <div className="button-row" style={{ marginTop: 22 }}>
        <Link className="btn" href="/reservar">
          Ver disponibilidad y reservar
        </Link>
      </div>
    </section>
  );
}
