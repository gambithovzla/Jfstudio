"use client";

import { useState } from "react";
import Image from "next/image";

import { landingContent } from "@/content/landing";
import { ScrollReveal } from "./scroll-reveal";
import { GalleryLightbox } from "./gallery-lightbox";

export function StudioSpace() {
  const { studio } = landingContent;
  const [lbIndex, setLbIndex] = useState<number | null>(null);

  if (studio.images.length === 0) return null;

  const open = (i: number) => setLbIndex(i);
  const close = () => setLbIndex(null);
  const prev = () => setLbIndex((i) => (i === null || i === 0 ? studio.images.length - 1 : i - 1));
  const next = () => setLbIndex((i) => (i === null ? 0 : (i + 1) % studio.images.length));

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
          {studio.images.map((image, i) => (
            <figure
              className="studio-item"
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
                sizes="(max-width: 960px) 100vw, 33vw"
                style={{ objectFit: "cover" }}
              />
            </figure>
          ))}
        </div>
      </ScrollReveal>

      <GalleryLightbox
        images={studio.images}
        index={lbIndex}
        onClose={close}
        onPrev={prev}
        onNext={next}
      />
    </section>
  );
}
