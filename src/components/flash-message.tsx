"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const MESSAGES: Record<string, { text: string; type: "success" | "error" }> = {
  guardado: { text: "✓ Cambios guardados correctamente.", type: "success" },
  creado: { text: "✓ Creado correctamente.", type: "success" },
  eliminado: { text: "✓ Eliminado correctamente.", type: "success" },
  eliminado_servicio: { text: "✓ Servicio eliminado del catálogo.", type: "success" },
  aprobado: { text: "✓ Testimonio aprobado y visible en la web.", type: "success" },
  rechazado: { text: "✓ Testimonio rechazado.", type: "success" },
  error: { text: "✗ Ocurrió un error. Intenta de nuevo.", type: "error" },
  error_password: { text: "✗ Contraseña actual incorrecta.", type: "error" },
  error_mismatch: { text: "✗ Las contraseñas nuevas no coinciden.", type: "error" },
  error_servicio_citas: {
    text: "✗ No se puede eliminar: hay citas históricas con este servicio. Desactívalo en su lugar.",
    type: "error"
  },
  error_adjunto_grande: { text: "✗ El archivo de cuidados supera 2 MB.", type: "error" },
  error_adjunto_tipo: { text: "✗ Formato no permitido. Usa JPG, PNG, WebP o PDF.", type: "error" },
  error_s3: {
    text: "✗ No hay almacenamiento S3 configurado para adjuntos. Añade texto o configura DEPOSIT_S3_*.",
    type: "error"
  }
};

export function FlashMessage({ msg }: { msg: string | null | undefined }) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!msg) return;

    timerRef.current = setTimeout(() => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      if (!url.searchParams.has("msg")) return;
      url.searchParams.delete("msg");
      const qs = url.searchParams.toString();
      router.replace(`${url.pathname}${qs ? `?${qs}` : ""}`);
    }, 3500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [msg, router]);

  if (!msg) return null;
  const entry = MESSAGES[msg];
  if (!entry) return null;

  return (
    <div
      className={`flash-message flash-${entry.type}`}
      role="status"
      aria-live="polite"
    >
      {entry.text}
    </div>
  );
}
