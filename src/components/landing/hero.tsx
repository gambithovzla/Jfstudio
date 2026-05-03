import Link from "next/link";
import Image from "next/image";
import { CalendarHeart } from "lucide-react";

import { landingContent } from "@/content/landing";
import { ScrollReveal } from "./scroll-reveal";

export function Hero() {
  const { hero } = landingContent;

  return (
    <section className="landing-hero">
      <ScrollReveal>
        <div className="landing-hero-text">
          <p className="eyebrow">{hero.eyebrow}</p>
          <p className="hero-tagline">Transformación de Lujo</p>
          <h1 className="display-title">{hero.title}</h1>
          <p className="lead">{hero.description}</p>
          <div className="button-row" style={{ marginTop: 22 }}>
            <Link className="btn" href={hero.primaryCta.href}>
              <CalendarHeart size={18} aria-hidden />
              {hero.primaryCta.label}
            </Link>
            <Link className="btn secondary" href={hero.secondaryCta.href}>
              {hero.secondaryCta.label}
            </Link>
          </div>
        </div>
      </ScrollReveal>
      <ScrollReveal delay={1}>
        <div className="landing-hero-media" aria-hidden={hero.imageUrl ? undefined : true}>
          {hero.imageUrl ? (
            <Image
              src={hero.imageUrl}
              alt={hero.imageAlt}
              fill
              sizes="(max-width: 960px) 100vw, 55vw"
              priority
              style={{ objectFit: "cover", objectPosition: "center 15%" }}
            />
          ) : (
            <div className="hero-placeholder">
              <CalendarHeart size={32} aria-hidden />
              <span className="small muted">Espacio para foto del estudio</span>
            </div>
          )}
        </div>
      </ScrollReveal>
    </section>
  );
}
