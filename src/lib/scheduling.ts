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

export function buildAvailabilitySlots(input: {
  date: string;
  timeZone: string;
  durationMinutes: number;
  intervalMinutes: number;
  staff: StaffSchedule[];
  now?: Date;
}) {
  const dayOfWeek = dayOfWeekForDate(input.date);
  const now = input.now ?? new Date();
  const slots: AvailabilitySlot[] = [];

  for (const staffMember of input.staff) {
    const workingHour = staffMember.workingHours.find(
      (hour) => hour.dayOfWeek === dayOfWeek && hour.isActive
    );

    if (!workingHour) {
      continue;
    }

    const workStart = zonedTimeToUtc(input.date, workingHour.startTime, input.timeZone);
    const workEnd = zonedTimeToUtc(input.date, workingHour.endTime, input.timeZone);
    const breakStart =
      workingHour.breakStart && workingHour.breakEnd
        ? zonedTimeToUtc(input.date, workingHour.breakStart, input.timeZone)
        : null;
    const breakEnd =
      workingHour.breakStart && workingHour.breakEnd
        ? zonedTimeToUtc(input.date, workingHour.breakEnd, input.timeZone)
        : null;

    for (
      let candidate = workStart;
      addMinutes(candidate, input.durationMinutes) <= workEnd;
      candidate = addMinutes(candidate, input.intervalMinutes)
    ) {
      const candidateEnd = addMinutes(candidate, input.durationMinutes);
      const hitsBreak =
        breakStart && breakEnd ? overlaps(candidate, candidateEnd, breakStart, breakEnd) : false;
      const hitsAppointment = staffMember.appointments.some((appointment) =>
        overlaps(candidate, candidateEnd, appointment.startAt, appointment.endAt)
      );

      if (candidate <= now || hitsBreak || hitsAppointment) {
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
