"use client";

import { useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { es } from "date-fns/locale/es";

import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const SERVICE_PALETTE = [
  "#c4587a", "#c9a96e", "#5b8de8", "#6bbf8a",
  "#e0855a", "#9b6bbf", "#4db6c8", "#e07070",
  "#7a9c4d", "#c46f9b"
];

function colorForService(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SERVICE_PALETTE[h % SERVICE_PALETTE.length];
}

type CalendarAppointment = {
  id: string;
  clientName: string;
  staffName: string;
  staffColor: string;
  services: string[];
  startAt: string;
  endAt: string;
  status: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarAppointment;
};

export function AgendaCalendar({
  appointments,
  defaultDate
}: {
  appointments: CalendarAppointment[];
  defaultDate: Date;
}) {
  const events = useMemo<CalendarEvent[]>(
    () =>
      appointments
        .filter((appt) => appt.status !== "CANCELED" && appt.status !== "NO_SHOW")
        .map((appt) => ({
          id: appt.id,
          title: appt.status === "COMPLETED"
            ? `✓ ${appt.clientName} · ${appt.services.join(", ")}`
            : `${appt.clientName} · ${appt.services.join(", ")}`,
          start: new Date(appt.startAt),
          end: new Date(appt.endAt),
          resource: appt
        })),
    [appointments]
  );

  const eventPropGetter = useCallback(
    (event: CalendarEvent) => {
      const colors = event.resource.services.map(colorForService);
      const bg = colors.length > 1
        ? `linear-gradient(135deg, ${colors[0]} 60%, ${colors[1]} 100%)`
        : colors[0];
      const isCompleted = event.resource.status === "COMPLETED";
      return {
        style: {
          background: bg,
          backgroundColor: colors[0],
          borderColor: colors[0],
          opacity: isCompleted ? 0.75 : 1,
          fontSize: "0.78rem",
          borderRadius: "6px",
          borderLeft: isCompleted ? "4px solid #166534" : undefined
        }
      };
    },
    []
  );

  const onSelectEvent = useCallback((event: CalendarEvent) => {
    window.location.href = `/admin/agenda/${event.id}`;
  }, []);

  return (
    <div style={{ height: 650, fontFamily: "inherit" }}>
      <Calendar
        localizer={localizer}
        events={events}
        defaultView={"week" as View}
        views={["week", "day", "agenda"]}
        defaultDate={defaultDate}
        step={15}
        timeslots={4}
        min={new Date(0, 0, 0, 7, 0)}
        max={new Date(0, 0, 0, 22, 0)}
        eventPropGetter={eventPropGetter}
        onSelectEvent={onSelectEvent}
        messages={{
          week: "Semana",
          day: "Dia",
          agenda: "Lista",
          today: "Hoy",
          previous: "Anterior",
          next: "Siguiente",
          noEventsInRange: "Sin citas en este periodo."
        }}
        culture="es"
      />
    </div>
  );
}
