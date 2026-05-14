import {
  isSundaySalon,
  PUBLIC_SUNDAY_WEB_CLOSE_LOCAL,
  PUBLIC_SUNDAY_WEB_OPEN_LOCAL
} from "./booking-rules";
import { addMinutes, dayOfWeekForDate, formatTimeInZone, zonedTimeToUtc } from "./time";

export type CalendarAppointment = {
  startAt: Date;
  endAt: Date;
};

export type StaffWorkingHour = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  isActive: boolean;
};

export type StaffSchedule = {
  id: string;
  name: string;
  workingHours: StaffWorkingHour[];
  appointments: CalendarAppointment[];
};

export type AvailabilitySlot = {
  staffId: string;
  staffName: string;
  startAt: string;
  endAt: string;
  label: string;
};

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export type TimeBlockEntry = {
  staffId: string | null;
  startAt: Date;
  endAt: Date;
};

export function buildAvailabilitySlots(input: {
  date: string;
  timeZone: string;
  durationMinutes: number;
  intervalMinutes: number;
  staff: StaffSchedule[];
  timeBlocks?: TimeBlockEntry[];
  now?: Date;
  /** Si se define, no se ofrecen slots que empiecen antes de esta marca de tiempo (UTC). */
  earliestStartUtc?: Date;
}) {
  const dayOfWeek = dayOfWeekForDate(input.date);
  const now = input.now ?? new Date();
  const earliest = input.earliestStartUtc;
  const blocks = input.timeBlocks ?? [];
  const slots: AvailabilitySlot[] = [];

  for (const staffMember of input.staff) {
    const workingHour = staffMember.workingHours.find(
      (hour) => hour.dayOfWeek === dayOfWeek && hour.isActive
    );

    if (!workingHour) {
      continue;
    }

    const staffBlocks = blocks.filter((b) => b.staffId === null || b.staffId === staffMember.id);

    const salonSunday = isSundaySalon(input.date, input.timeZone);
    /**
     * Los domingos el turno de reserva web es 07:00–09:00 (zona del salón), aunque en BD el horario
     * siga el patrón 09:00–… de otros días.
     */
    const workStart = salonSunday
      ? zonedTimeToUtc(input.date, PUBLIC_SUNDAY_WEB_OPEN_LOCAL, input.timeZone)
      : zonedTimeToUtc(input.date, workingHour.startTime, input.timeZone);
    const workEnd = salonSunday
      ? zonedTimeToUtc(input.date, PUBLIC_SUNDAY_WEB_CLOSE_LOCAL, input.timeZone)
      : zonedTimeToUtc(input.date, workingHour.endTime, input.timeZone);
    const breakStart =
      salonSunday || !workingHour.breakStart || !workingHour.breakEnd
        ? null
        : zonedTimeToUtc(input.date, workingHour.breakStart, input.timeZone);
    const breakEnd =
      salonSunday || !workingHour.breakStart || !workingHour.breakEnd
        ? null
        : zonedTimeToUtc(input.date, workingHour.breakEnd, input.timeZone);

    /** Domingo: último inicio permitido es el cierre del turno; el servicio puede terminar después. */
    const sundayStartOnlyThroughClose = salonSunday;

    for (
      let candidate = workStart;
      sundayStartOnlyThroughClose
        ? candidate <= workEnd
        : addMinutes(candidate, input.durationMinutes) <= workEnd;
      candidate = addMinutes(candidate, input.intervalMinutes)
    ) {
      const candidateEnd = addMinutes(candidate, input.durationMinutes);
      const hitsBreak =
        breakStart && breakEnd
          ? candidate >= breakStart && candidate < breakEnd
          : false;
      const hitsAppointment = staffMember.appointments.some((appointment) =>
        overlaps(candidate, candidateEnd, appointment.startAt, appointment.endAt)
      );
      const hitsBlock = staffBlocks.some((block) =>
        overlaps(candidate, candidateEnd, block.startAt, block.endAt)
      );

      if (candidate <= now || hitsBreak || hitsAppointment || hitsBlock) {
        continue;
      }

      if (earliest && candidate < earliest) {
        continue;
      }

      slots.push({
        staffId: staffMember.id,
        staffName: staffMember.name,
        startAt: candidate.toISOString(),
        endAt: candidateEnd.toISOString(),
        label: `${formatTimeInZone(candidate, input.timeZone)} - ${formatTimeInZone(
          candidateEnd,
          input.timeZone
        )}`
      });
    }
  }

  return slots.sort((a, b) => a.startAt.localeCompare(b.startAt) || a.staffName.localeCompare(b.staffName));
}
