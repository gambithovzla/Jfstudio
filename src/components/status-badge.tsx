import { AppointmentStatus } from "@prisma/client";

const labels: Record<AppointmentStatus, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELED: "Cancelada"
};

const classes: Record<AppointmentStatus, string> = {
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELED: "canceled"
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`badge ${classes[status]}`}>{labels[status]}</span>;
}
