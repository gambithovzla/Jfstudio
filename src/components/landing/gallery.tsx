import Image from "next/image";
import { Camera } from "lucide-react";

import { landingContent } from "@/content/landing";
import { ScrollReveal } from "./scroll-reveal";

export function Gallery() {
  const { gallery } = landingContent;
  const placeholders = Array.from({ length: 6 });
  const hasImages = gallery.images.length > 0;

  return (
    <section className="landing-section" id="galeria">
      <ScrollReveal>
        <div className="section-header">
          <p className="eyebrow">{gallery.title}</p>
          <h2 className="section-title">{gallery.description}</h2>
        </div>
      </ScrollReveal>
      <ScrollReveal>
        <div className="gallery-grid">
          {hasImages
            ? gallery.images.map((image, i) => (
                <figure className="gallery-item" key={image.src}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes={i === 0 ? "(max-width: 960px) 100vw, 66vw" : "(max-width: 960px) 50vw, 33vw"}
                    style={{ objectFit: "cover" }}
                  />
                </figure>
              ))
            : placeholders.map((_, index) => (
                <div className="gallery-item gallery-placeholder" key={index} aria-hidden>
                  <Camera size={22} aria-hidden />
                </div>
              ))}
        </div>
      </ScrollReveal>
      {!hasImages ? (
        <p className="small muted" style={{ textAlign: "center", marginTop: 14 }}>
          Pronto sumaremos fotos reales de los trabajos del estudio.
        </p>
      ) : null}
    </section>
  );
}
