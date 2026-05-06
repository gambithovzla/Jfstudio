"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";

import { landingContent } from "@/content/landing";
import { ScrollReveal } from "./scroll-reveal";
import { GalleryLightbox } from "./gallery-lightbox";

export function Gallery() {
  const { gallery } = landingContent;
  const placeholders = Array.from({ length: 6 });
  const hasImages = gallery.images.length > 0;

  const [lbIndex, setLbIndex] = useState<number | null>(null);

  const open = (i: number) => setLbIndex(i);
  const close = () => setLbIndex(null);
  const prev = () => setLbIndex((i) => (i === null || i === 0 ? gallery.images.length - 1 : i - 1));
  const next = () => setLbIndex((i) => (i === null ? 0 : (i + 1) % gallery.images.length));

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
                <figure
                  className="gallery-item"
                  key={image.src}
                  onClick={() => open(i)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver ${image.alt}`}
                  onKeyDown={(e) => e.key === "Enter" && open(i)}
                  style={{ cursor: "zoom-in" }}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes={i === 0 ? "(max-width: 960px) 100vw, 66vw" : "(max-width: 960px) 50vw, 33vw"}
                    style={{ objectFit: "cover", objectPosition: "center 20%" }}
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

      <GalleryLightbox
        images={gallery.images}
        index={lbIndex}
        onClose={close}
        onPrev={prev}
        onNext={next}
      />
    </section>
  );
}
