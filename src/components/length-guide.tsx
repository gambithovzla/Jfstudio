"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

/**
 * Miniatura siempre visible que abre una imagen de referencia (guía de largos)
 * en un lightbox a pantalla completa. Reutiliza las clases .lb-* de globals.css.
 */
export function LengthGuide({
  src,
  alt,
  caption = "Toca para ver la guía de largos"
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ver guía de largos de cabello"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          padding: 8,
          border: "1px solid var(--border)",
          borderRadius: 12,
          background: "var(--surface-soft)",
          cursor: "pointer",
          textAlign: "left"
        }}
      >
        <span
          style={{
            position: "relative",
            flex: "0 0 auto",
            width: 64,
            height: 96,
            borderRadius: 8,
            overflow: "hidden",
            background: "#1a1a1a"
          }}
        >
          <Image src={src} alt={alt} fill sizes="64px" style={{ objectFit: "cover" }} />
        </span>
        <span style={{ display: "grid", gap: 2 }}>
          <strong style={{ fontSize: "0.9rem" }}>Guía de largos</strong>
          <span className="small muted">{caption}</span>
        </span>
      </button>

      {open ? (
        <div
          className="lb-overlay"
          onClick={close}
          role="dialog"
          aria-modal
          aria-label="Guía de largos ampliada"
        >
          <button className="lb-close" onClick={close} aria-label="Cerrar">
            ✕
          </button>
          <div className="lb-img-wrap" onClick={(e) => e.stopPropagation()}>
            <Image src={src} alt={alt} fill sizes="90vw" style={{ objectFit: "contain" }} priority />
          </div>
        </div>
      ) : null}
    </>
  );
}
