import { UserCircle2 } from "lucide-react";

import { landingContent } from "@/content/landing";

export function About() {
  const { about } = landingContent;

  return (
    <section className="landing-section landing-about" id="sobre">
      <div className="landing-about-portrait" aria-hidden={about.portraitUrl ? undefined : true}>
        {about.portraitUrl ? (
          <img src={about.portraitUrl} alt={about.portraitAlt} loading="lazy" />
        ) : (
          <div className="hero-placeholder">
            <UserCircle2 size={36} aria-hidden />
            <span className="small muted">Foto de Johanna</span>
          </div>
        )}
      </div>
      <div className="landing-about-text">
        <p className="eyebrow">Quien soy</p>
        <h2 className="section-title">{about.title}</h2>
        {about.paragraphs.map((paragraph, index) => (
          <p key={index} className="lead lead-soft">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
