"use client";

import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const TOOLTIP_TEXT =
  "Los precios son referenciales y pueden variar según las características de cada cliente.";

export function PriceDisclaimer() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <span
      ref={ref}
      className={`price-disclaimer${open ? " is-open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="price-disclaimer-trigger"
        aria-label="Información sobre los precios"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Info size={15} aria-hidden />
      </button>
      <span className="price-disclaimer-bubble" role="tooltip">
        {TOOLTIP_TEXT}
      </span>
    </span>
  );
}
