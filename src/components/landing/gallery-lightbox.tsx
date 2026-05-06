"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";

type LightboxImage = { src: string; alt: string };

type Props = {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function GalleryLightbox({ images, index, onClose, onPrev, onNext }: Props) {
  const isOpen = index !== null;
  const current = index !== null ? images[index] : null;

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [isOpen, onClose, onPrev, onNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !current) return null;

  return (
    <div
      className="lb-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label="Galería ampliada"
    >
      <button className="lb-close" onClick={onClose} aria-label="Cerrar">✕</button>

      <button
        className="lb-prev"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Anterior"
      >
        ←
      </button>

      <div className="lb-img-wrap" onClick={(e) => e.stopPropagation()}>
        <Image
          src={current.src}
          alt={current.alt}
          fill
          sizes="95vw"
          style={{ objectFit: "contain" }}
          priority
        />
      </div>

      <button
        className="lb-next"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Siguiente"
      >
        →
      </button>

      <span className="lb-counter">
        {(index as number) + 1} / {images.length}
      </span>
    </div>
  );
}
