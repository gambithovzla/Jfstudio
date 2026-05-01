import Image from "next/image";
import { UserCircle2 } from "lucide-react";

import { landingContent } from "@/content/landing";
import { ScrollReveal } from "./scroll-reveal";

export function About() {
  const { about } = landingContent;

  return (
    <section className="landing-section landing-about" id="sobre">
      <ScrollReveal>
        <div className="landing-about-portrait" aria-hidden={about.portraitUrl ? undefined : true}>
          {about.portraitUrl ? (
            <Image
              src={about.portraitUrl}
              alt={about.portraitAlt}
              fill
              sizes="(max-width: 960px) 100vw, 45vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="hero-placeholder">
              <UserCircle2 size={36} aria-hidden />
              <span className="small muted">Foto de Johanna</span>
            </div>
          )}
          <div className="about-experience-badge">10+ anos de experiencia</div>
        </div>
      </ScrollReveal>
      <ScrollReveal delay={1}>
        <div className="landing-about-text">
          <p className="eyebrow">Quien soy</p>
          <h2 className="section-title">{about.title}</h2>
          {about.paragraphs.map((paragraph, index) => (
            <p key={index} className="lead lead-soft">
              {paragraph}
            </p>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
