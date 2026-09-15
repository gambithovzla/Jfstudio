"use client";

import { Trash2 } from "lucide-react";

export function ConfirmDeleteBonus({
  bonusId,
  code,
  action,
  disabled
}: {
  bonusId: string;
  code: string;
  action: (formData: FormData) => Promise<void>;
  disabled?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`¿Eliminar el bono ${code}? Esta acción no se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="bonusId" value={bonusId} />
      <button className="btn danger" type="submit" disabled={disabled}>
        <Trash2 size={15} aria-hidden />
        Eliminar
      </button>
    </form>
  );
}