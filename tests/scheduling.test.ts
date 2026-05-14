import { describe, expect, it } from "vitest";

import { buildAvailabilitySlots, overlaps } from "../src/lib/scheduling";

describe("scheduling", () => {
  it("detects overlapping intervals", () => {
    expect(
      overlaps(
        new Date("2026-05-01T10:00:00.000Z"),
        new Date("2026-05-01T11:00:00.000Z"),
        new Date("2026-05-01T10:30:00.000Z"),
        new Date("2026-05-01T12:00:00.000Z")
      )
    ).toBe(true);

    expect(
      overlaps(
        new Date("2026-05-01T10:00:00.000Z"),
        new Date("2026-05-01T11:00:00.000Z"),
        new Date("2026-05-01T11:00:00.000Z"),
        new Date("2026-05-01T12:00:00.000Z")
      )
    ).toBe(false);
  });

  it("blocks slots by service duration and existing appointments", () => {
    const slots = buildAvailabilitySlots({
      date: "2026-05-04",
      timeZone: "America/Lima",
      durationMinutes: 60,
      intervalMinutes: 30,
      now: new Date("2026-05-01T00:00:00.000Z"),
      staff: [
        {
          id: "staff-1",
          name: "Johanna",
          workingHours: [
            {
              dayOfWeek: 1,
              startTime: "09:00",
              endTime: "12:00",
              isActive: true
            }
          ],
          appointments: [
            {
              startAt: new Date("2026-05-04T15:00:00.000Z"),
              endAt: new Date("2026-05-04T16:00:00.000Z")
            }
          ]
        }
      ]
    });

    expect(slots.map((slot) => slot.label)).toEqual(["09:00 - 10:00", "11:00 - 12:00"]);
  });

  it("skips break windows", () => {
    const slots = buildAvailabilitySlots({
      date: "2026-05-04",
      timeZone: "America/Lima",
      durationMinutes: 60,
      intervalMinutes: 60,
      now: new Date("2026-05-01T00:00:00.000Z"),
      staff: [
        {
          id: "staff-1",
          name: "Johanna",
          workingHours: [
            {
              dayOfWeek: 1,
              startTime: "09:00",
              endTime: "13:00",
              breakStart: "11:00",
              breakEnd: "12:00",
              isActive: true
            }
          ],
          appointments: []
        }
      ]
    });

    expect(slots.map((slot) => slot.label)).toEqual(["09:00 - 10:00", "10:00 - 11:00", "12:00 - 13:00"]);
  });

  it("on Sunday allows starts through close even when service ends after workEnd", () => {
    const slots = buildAvailabilitySlots({
      date: "2026-05-03",
      timeZone: "America/Lima",
      durationMinutes: 120,
      intervalMinutes: 60,
      now: new Date("2026-05-01T00:00:00.000Z"),
      staff: [
        {
          id: "staff-1",
          name: "Johanna",
          workingHours: [
            {
              dayOfWeek: 0,
              startTime: "07:00",
              endTime: "09:00",
              isActive: true
            }
          ],
          appointments: []
        }
      ]
    });

    expect(slots.map((slot) => slot.label)).toEqual(["07:00 - 09:00", "08:00 - 10:00", "09:00 - 11:00"]);
  });

  it("on Sunday uses 07:00 web window even when DB working hours start at 09:00", () => {
    const slots = buildAvailabilitySlots({
      date: "2026-05-03",
      timeZone: "America/Lima",
      durationMinutes: 75,
      intervalMinutes: 15,
      now: new Date("2026-05-01T00:00:00.000Z"),
      staff: [
        {
          id: "staff-1",
          name: "Johanna",
          workingHours: [
            {
              dayOfWeek: 0,
              startTime: "09:00",
              endTime: "16:00",
              breakStart: "13:00",
              breakEnd: "14:00",
              isActive: true
            }
          ],
          appointments: []
        }
      ]
    });

    expect(slots[0]?.label).toMatch(/^07:00/);
    expect(slots.map((s) => s.label).some((l) => l.startsWith("09:00"))).toBe(true);
  });
});
