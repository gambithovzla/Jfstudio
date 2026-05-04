import Image from "next/image";

import { landingContent } from "@/content/landing";
import { ScrollReveal } from "./scroll-reveal";

export function StudioSpace() {
  const { studio } = landingContent;

  if (studio.images.length === 0) return null;

  return (
    <section className="landing-section" id="estudio">
      <ScrollReveal>
        <div className="section-header">
          <p className="eyebrow">{studio.title}</p>
          <h2 className="section-title">{studio.description}</h2>
        </div>
      </ScrollReveal>
      <ScrollReveal>
        <div className="studio-grid">
          {studio.images.map((image) => (
            <figure className="studio-item" key={image.src}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 960px) 100vw, 33vw"
                style={{ objectFit: "cover" }}
              />
            </figure>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
