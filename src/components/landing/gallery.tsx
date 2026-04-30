import { Camera } from "lucide-react";

import { landingContent } from "@/content/landing";

export function Gallery() {
  const { gallery } = landingContent;
  const placeholders = Array.from({ length: 6 });
  const hasImages = gallery.images.length > 0;

  return (
    <section className="landing-section" id="galeria">
      <div className="section-header">
        <p className="eyebrow">{gallery.title}</p>
        <h2 className="section-title">{gallery.description}</h2>
      </div>
      <div className="gallery-grid">
        {hasImages
          ? gallery.images.map((image) => (
              <figure className="gallery-item" key={image.src}>
                <img src={image.src} alt={image.alt} loading="lazy" />
              </figure>
            ))
          : placeholders.map((_, index) => (
              <div className="gallery-item gallery-placeholder" key={index} aria-hidden>
                <Camera size={22} aria-hidden />
              </div>
            ))}
      </div>
      {!hasImages ? (
        <p className="small muted" style={{ textAlign: "center", marginTop: 14 }}>
          Pronto sumaremos fotos reales de los trabajos del estudio.
        </p>
      ) : null}
    </section>
  );
}
