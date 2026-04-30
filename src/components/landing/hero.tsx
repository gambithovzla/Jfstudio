import Link from "next/link";
import { CalendarHeart, Sparkles } from "lucide-react";

import { landingContent } from "@/content/landing";

export function Hero() {
  const { hero } = landingContent;

  return (
    <section className="landing-hero">
      <div className="landing-hero-text">
        <p className="eyebrow">{hero.eyebrow}</p>
        <h1 className="display-title">{hero.title}</h1>
        <p className="lead">{hero.description}</p>
        <div className="button-row" style={{ marginTop: 18 }}>
          <Link className="btn" href={hero.primaryCta.href}>
            <CalendarHeart size={18} aria-hidden />
            {hero.primaryCta.label}
          </Link>
          <Link className="btn secondary" href={hero.secondaryCta.href}>
            {hero.secondaryCta.label}
          </Link>
        </div>
      </div>
      <div className="landing-hero-media" aria-hidden={hero.imageUrl ? undefined : true}>
        {hero.imageUrl ? (
          <img src={hero.imageUrl} alt={hero.imageAlt} loading="eager" />
        ) : (
          <div className="hero-placeholder">
            <Sparkles size={32} aria-hidden />
            <span className="small muted">Espacio para foto del estudio</span>
          </div>
        )}
      </div>
    </section>
  );
}
