"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteClientDialog({
  clientId,
  clientName,
  action
}: {
  clientId: string;
  clientName: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");

  const confirmed = typed.trim().toLowerCase() === clientName.trim().toLowerCase();

  return (
    <>
      <button
        className="btn danger"
        type="button"
        onClick={() => {
          setTyped("");
          dialogRef.current?.showModal();
        }}
      >
        <Trash2 size={15} aria-hidden />
        Eliminar
      </button>

      <dialog ref={dialogRef} className="confirm-dialog">
        <div className="confirm-dialog-inner">
          <h2 className="confirm-dialog-title">Eliminar clienta</h2>
          <p className="small" style={{ color: "#374151", marginBottom: 4 }}>
            Esta acción eliminará a <strong>{clientName}</strong> y{" "}
            <strong>todas sus citas, pagos e historial</strong>. No se puede deshacer.
          </p>
          <p className="small muted" style={{ marginBottom: 16 }}>
            Escribe el nombre exacto para confirmar:
          </p>
          <input
            className="input"
            autoComplete="off"
            placeholder={clientName}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <div className="button-row">
            <button
              className="btn secondary"
              type="button"
              onClick={() => dialogRef.current?.close()}
            >
              Cancelar
            </button>
            <form action={action}>
              <input type="hidden" name="clientId" value={clientId} />
              <button
                className="btn danger"
                type="submit"
                disabled={!confirmed}
              >
                <Trash2 size={15} aria-hidden />
                Eliminar permanentemente
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
