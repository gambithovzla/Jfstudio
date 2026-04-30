"use client";

import { useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { es } from "date-fns/locale/es";

import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

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
      appointments.map((appt) => ({
        id: appt.id,
        title: `${appt.clientName} · ${appt.services.join(", ")}`,
        start: new Date(appt.startAt),
        end: new Date(appt.endAt),
        resource: appt
      })),
    [appointments]
  );

  const eventPropGetter = useCallback(
    (event: CalendarEvent) => ({
      style: {
        backgroundColor: event.resource.staffColor,
        borderColor: event.resource.staffColor,
        opacity: event.resource.status === "CANCELED" || event.resource.status === "NO_SHOW" ? 0.4 : 1,
        fontSize: "0.78rem",
        borderRadius: "6px"
      }
    }),
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
