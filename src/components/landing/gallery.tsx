"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";

import { landingContent } from "@/content/landing";
import { ScrollReveal } from "./scroll-reveal";
import { GalleryLightbox } from "./gallery-lightbox";

export type LandingGalleryCmsItem = { id: string; src: string; alt: string };

type Props = {
  /** Si hay al menos una imagen en BD, sustituye por completo a las estáticas de `landing.ts`. */
  cmsImages?: LandingGalleryCmsItem[];
};

export function Gallery({ cmsImages = [] }: Props) {
  const { gallery } = landingContent;
  const displayImages =
    cmsImages.length > 0 ? cmsImages.map(({ src, alt }) => ({ src, alt })) : gallery.images;
  const placeholders = Array.from({ length: 6 });
  const hasImages = displayImages.length > 0;

  const [lbIndex, setLbIndex] = useState<number | null>(null);

  const open = (i: number) => setLbIndex(i);
  const close = () => setLbIndex(null);
  const prev = () =>
    setLbIndex((i) => (i === null || i === 0 ? displayImages.length - 1 : i - 1));
  const next = () => setLbIndex((i) => (i === null ? 0 : (i + 1) % displayImages.length));

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
            ? displayImages.map((image, i) => (
                <figure
                  className="gallery-item"
                  key={cmsImages.length > 0 ? (cmsImages[i]?.id ?? `${image.src}-${i}`) : image.src}
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
        images={displayImages}
        index={lbIndex}
        onClose={close}
        onPrev={prev}
        onNext={next}
      />
    </section>
  );
}
