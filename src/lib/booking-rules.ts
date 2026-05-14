import { addMinutes, zonedTimeToUtc } from "./time";

export const MIN_BOOKING_ADVANCE_HOURS = 12;
export const WEB_DEPOSIT_AMOUNT_PEN = 50;
export const SATURDAY_MAX_CONCURRENT_STARTS = 3;

/** Minutos de gracia desde la hora de la cita para presentarse. */
export const ARRIVAL_TOLERANCE_MINUTES = 15;

const WEEKDAY_SHORT_TO_SUN0: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

/** Domingo=0 … Sábado=6 según calendario en `timeZone` (mediodía local de ese día). */
export function salonWeekdaySun0(dateStr: string, timeZone: string): number {
  const instant = zonedTimeToUtc(dateStr, "12:00", timeZone);
  const short = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(instant);
  return WEEKDAY_SHORT_TO_SUN0[short] ?? 0;
}

export function isSaturdaySalon(dateStr: string, timeZone: string): boolean {
  return salonWeekdaySun0(dateStr, timeZone) === 6;
}

export function isSundaySalon(dateStr: string, timeZone: string): boolean {
  return salonWeekdaySun0(dateStr, timeZone) === 0;
}

export function localMinutesFromMidnightInZone(isoInstant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(isoInstant);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

/** Inicio y fin locales del turno de reserva web los domingos (debe coincidir con slots en `buildAvailabilitySlots`). */
export const PUBLIC_SUNDAY_WEB_OPEN_LOCAL = "07:00";
export const PUBLIC_SUNDAY_WEB_CLOSE_LOCAL = "09:00";

function localHmToMinutes(hm: string): number {
  const parts = hm.split(":");
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  return h * 60 + m;
}

/**
 * Ventana pública de inicio de cita (solo reserva web).
 * Sábado 07:00–13:00 · Domingo 07:00–09:00 (inicio hasta las 9:00; la cita puede prolongarse según duración).
 */
export function isPublicBookingStartInDayWindow(dateStr: string, startAt: Date, timeZone: string): boolean {
  const mins = localMinutesFromMidnightInZone(startAt, timeZone);
  if (isSaturdaySalon(dateStr, timeZone)) {
    return mins >= 7 * 60 && mins <= 13 * 60;
  }
  if (isSundaySalon(dateStr, timeZone)) {
    return (
      mins >= localHmToMinutes(PUBLIC_SUNDAY_WEB_OPEN_LOCAL) &&
      mins <= localHmToMinutes(PUBLIC_SUNDAY_WEB_CLOSE_LOCAL)
    );
  }
  return true;
}

export function earliestPublicBookingInstant(now: Date = new Date()): Date {
  return addMinutes(now, MIN_BOOKING_ADVANCE_HOURS * 60);
}
