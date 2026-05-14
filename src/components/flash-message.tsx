"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const MESSAGES: Record<string, { text: string; type: "success" | "error" }> = {
  guardado: { text: "✓ Cambios guardados correctamente.", type: "success" },
  creado: { text: "✓ Creado correctamente.", type: "success" },
  eliminado: { text: "✓ Eliminado correctamente.", type: "success" },
  aprobado: { text: "✓ Testimonio aprobado y visible en la web.", type: "success" },
  rechazado: { text: "✓ Testimonio rechazado.", type: "success" },
  error: { text: "✗ Ocurrió un error. Intenta de nuevo.", type: "error" },
  error_password: { text: "✗ Contraseña actual incorrecta.", type: "error" },
  error_mismatch: { text: "✗ Las contraseñas nuevas no coinciden.", type: "error" },
};

export function FlashMessage({ msg }: { msg: string | null | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!msg) return;

    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("msg");
      const newUrl = params.size > 0 ? `${pathname}?${params}` : pathname;
      router.replace(newUrl);
    }, 3500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [msg, pathname, router, searchParams]);

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
