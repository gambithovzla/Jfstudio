"use client";

import { useState, useRef } from "react";
import { XCircle } from "lucide-react";

import { cancelAppointmentAction } from "@/lib/actions";

export function InlineCancelForm({ appointmentId }: { appointmentId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button className="btn danger" type="button" onClick={() => setOpen(true)}>
        <XCircle size={17} aria-hidden />
        Cancelar
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={cancelAppointmentAction}
      style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}
    >
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <textarea
        className="textarea"
        name="note"
        placeholder="Motivo (se envia a la clienta por email)..."
        rows={2}
        style={{ fontSize: "0.85rem" }}
        autoFocus
      />
      <div className="button-row">
        <button className="btn danger" type="submit">
          <XCircle size={16} aria-hidden />
          Confirmar cancelacion
        </button>
        <button className="btn secondary" type="button" onClick={() => setOpen(false)}>
          Volver
        </button>
      </div>
    </form>
  );
}
