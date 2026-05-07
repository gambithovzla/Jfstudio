"use client";

import { Trash2 } from "lucide-react";

import { deleteAppointmentAction } from "@/lib/actions";

export function DeleteAppointmentButton({ appointmentId }: { appointmentId: string }) {
  return (
    <form action={deleteAppointmentAction}>
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <button
        className="btn danger"
        type="submit"
        style={{ fontSize: "0.82rem" }}
        onClick={(e) => {
          if (!window.confirm("¿Eliminar esta cita y todo su historial de pagos? Esta acción no se puede deshacer.")) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 size={15} aria-hidden />
        Eliminar registro
      </button>
    </form>
  );
}
