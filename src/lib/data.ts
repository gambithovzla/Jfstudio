import { AppointmentStatus, Prisma, TestimonialStatus } from "@prisma/client";

import {
  earliestPublicBookingInstant,
  isPublicBookingStartInDayWindow,
  isSaturdaySalon,
  MIN_BOOKING_ADVANCE_HOURS,
  SATURDAY_MAX_CONCURRENT_STARTS,
  WEB_DEPOSIT_AMOUNT_PEN
} from "@/lib/booking-rules";
import { summarizePayments } from "@/lib/cash";
import { sendBookingConfirmation } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { buildAvailabilitySlots, type AvailabilitySlot, type StaffWorkingHour } from "@/lib/scheduling";
import {
  addMinutes,
  endOfSalonDayUtc,
  formatDateInZone,
  formatTimeInZone,
  localDateTimeToUtc,
  startOfSalonDayUtc,
  todayInTimeZone
} from "@/lib/time";
import { normalizePhone } from "@/lib/utils";

export async function getSalonSettings() {
  assertDatabaseConfigured();

  return (
    (await prisma.salonSettings.findUnique({ where: { id: "default" } })) ??
    (await prisma.salonSettings.create({ data: { id: "default" } }))
  );
}

export async function getBirthdayBonusSettings() {
  assertDatabaseConfigured();

  return (
    (await prisma.birthdayBonusSettings.findUnique({ where: { id: "default" } })) ??
    (await prisma.birthdayBonusSettings.create({ data: { id: "default" } }))
  );
}

export async function getBirthdayBonusesForToday(timezone: string) {
  assertDatabaseConfigured();

  const today = todayInTimeZone(timezone);
  const [year, month, day] = today.split("-").map(Number);
  const startUtc = startOfSalonDayUtc(today, timezone);
  const endUtc = endOfSalonDayUtc(today, timezone);

  const yearOfBonus = year;
  const yearStart = new Date(Date.UTC(yearOfBonus, 0, 1));
  const yearEnd = new Date(Date.UTC(yearOfBonus + 1, 0, 1));

  // Solo clientas con cumpleaños hoy (mes/día en calendario), no toda la base.
  const todayIds = await prisma.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`
      SELECT c.id
      FROM "Client" c
      WHERE c.birthday IS NOT NULL
        AND EXTRACT(MONTH FROM c.birthday)::int = ${month}
        AND EXTRACT(DAY FROM c.birthday)::int = ${day}
    `
  );

  const candidates =
    todayIds.length === 0
      ? []
      : await prisma.client.findMany({
          where: { id: { in: todayIds.map((r) => r.id) } },
          include: {
            birthdayBonuses: {
              where: { generatedAt: { gte: yearStart, lt: yearEnd } },
              orderBy: { generatedAt: "desc" },
              take: 1
            }
          }
        });

  return {
    today,
    month,
    day,
    startUtc,
    endUtc,
    candidates
  };
}

export async function getActiveBirthdayBonusByCode(code: string) {
  assertDatabaseConfigured();

  return prisma.birthdayBonus.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { client: true }
  });
}

function assertDatabaseConfigured() {
  const databaseUrl = process.env.DATABASE_URL;
  const placeholderUrl = "postgresql://user:pass@localhost:5432/jfstudio";

  if (!databaseUrl || databaseUrl.startsWith(placeholderUrl)) {
    throw new Error("Configura DATABASE_URL con Railway Postgres y ejecuta las migraciones.");
  }
}

export async function getBookingBootstrap() {
  const [settings, services, staff] = await Promise.all([
    getSalonSettings(),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        price: true,
        requiresDeposit: true
      }
    }),
    prisma.staff.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true }
    })
  ]);

  return {
    settings,
    services: services.map((service) => ({
      ...service,
      price: Number(service.price)
    })),
    staff
  };
}

export type ApprovedTestimonialCard = {
  quote: string;
  author: string;
  detail?: string;
};

export async function getApprovedTestimonials(): Promise<ApprovedTestimonialCard[]> {
  assertDatabaseConfigured();

  const rows = await prisma.clientTestimonial.findMany({
    where: { status: TestimonialStatus.APPROVED },
    orderBy: { reviewedAt: "desc" },
    take: 12,
    select: { body: true, authorName: true, stars: true }
  });

  return rows.map((r) => ({
    quote: r.body,
    author: r.authorName?.trim() || "Clienta",
    detail: r.stars ? `${r.stars}/5 · testimonio verificado` : "Testimonio verificado"
  }));
}

export async function getTestimonialsForAdmin() {
  assertDatabaseConfigured();

  const rows = await prisma.clientTestimonial.findMany({
    orderBy: { createdAt: "desc" },
    take: 150
  });

  return [...rows].sort((a, b) => {
    if (a.status === TestimonialStatus.PENDING && b.status !== TestimonialStatus.PENDING) return -1;
    if (a.status !== TestimonialStatus.PENDING && b.status === TestimonialStatus.PENDING) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export async function getAvailabilityForServices(input: {
  serviceIds: string[];
  date: string;
  staffId?: string | null;
  excludeAppointmentId?: string | null;
}) {
  const settings = await getSalonSettings();
  const serviceIds = Array.from(new Set(input.serviceIds.filter(Boolean)));

  if (serviceIds.length === 0) {
    return [];
  }

  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, isActive: true },
    select: { id: true, durationMinutes: true }
  });

  if (services.length !== serviceIds.length) {
    throw new Error("Uno o mas servicios no estan disponibles.");
  }

  const durationMinutes = services.reduce((total, service) => total + service.durationMinutes, 0);
  const dayStart = startOfSalonDayUtc(input.date, settings.timezone);
  const dayEnd = endOfSalonDayUtc(input.date, settings.timezone);

  const [staff, timeBlocks] = await Promise.all([
    prisma.staff.findMany({
      where: {
        isActive: true,
        ...(input.staffId ? { id: input.staffId } : {})
      },
      orderBy: { name: "asc" },
      include: {
        workingHours: true,
        appointments: {
          where: {
            status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
            startAt: { lt: dayEnd },
            endAt: { gt: dayStart },
            ...(input.excludeAppointmentId ? { id: { not: input.excludeAppointmentId } } : {})
          },
          select: { startAt: true, endAt: true }
        }
      }
    }),
    prisma.timeBlock.findMany({
      where: {
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart }
      },
      select: { staffId: true, startAt: true, endAt: true }
    })
  ]);

  const earliest = earliestPublicBookingInstant();

  const allSlots = buildAvailabilitySlots({
    date: input.date,
    timeZone: settings.timezone,
    durationMinutes,
    intervalMinutes: settings.appointmentIntervalMinutes,
    timeBlocks,
    earliestStartUtc: earliest,
    staff: staff.map((staffMember) => ({
      id: staffMember.id,
      name: staffMember.name,
      appointments: staffMember.appointments,
      workingHours: staffMember.workingHours
    }))
  });

  const windowed = allSlots.filter((s) =>
    isPublicBookingStartInDayWindow(input.date, new Date(s.startAt), settings.timezone)
  );

  // Morning-first rule: if any slot starts before 13:00 local time, only show those.
  // Once morning is fully booked, all slots are shown.
  const fmt = new Intl.DateTimeFormat("es", { timeZone: settings.timezone, hour: "numeric", hour12: false });
  const morningSlots = windowed.filter((s) => parseInt(fmt.format(new Date(s.startAt)), 10) < 13);
  const merged: AvailabilitySlot[] = morningSlots.length > 0 ? morningSlots : windowed;

  const saturdayTeamMode = !input.staffId && isSaturdaySalon(input.date, settings.timezone);

  if (saturdayTeamMode) {
    const existing = await prisma.appointment.findMany({
      where: {
        status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
        startAt: { gte: dayStart, lt: dayEnd },
        ...(input.excludeAppointmentId ? { id: { not: input.excludeAppointmentId } } : {})
      },
      select: { startAt: true }
    });
    const countByStart = new Map<string, number>();
    for (const row of existing) {
      const k = row.startAt.toISOString();
      countByStart.set(k, (countByStart.get(k) ?? 0) + 1);
    }
    const byStart = new Map<string, AvailabilitySlot>();
    for (const slot of merged) {
      if (!byStart.has(slot.startAt)) {
        byStart.set(slot.startAt, slot);
      }
    }
    const out: AvailabilitySlot[] = [];
    for (const slot of byStart.values()) {
      if ((countByStart.get(slot.startAt) ?? 0) < SATURDAY_MAX_CONCURRENT_STARTS) {
        out.push({
          ...slot,
          staffName: "Equipo JF Studio"
        });
      }
    }
    out.sort((a, b) => a.startAt.localeCompare(b.startAt));
    return out;
  }

  return merged;
}

export type WebBookingDeposit = {
  voucherKey: string;
  voucherFilename: string;
  voucherMime: string;
  amountPen: number;
};

async function pickStaffForPublicSaturdaySlot(
  tx: Prisma.TransactionClient,
  input: {
    dateStr: string;
    timeZone: string;
    startAt: Date;
    durationMinutes: number;
    intervalMinutes: number;
    timeBlocks: { staffId: string | null; startAt: Date; endAt: Date }[];
  }
) {
  const staffList = await tx.staff.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { workingHours: true }
  });

  const earliest = earliestPublicBookingInstant();

  for (const s of staffList) {
    const slots = buildAvailabilitySlots({
      date: input.dateStr,
      timeZone: input.timeZone,
      durationMinutes: input.durationMinutes,
      intervalMinutes: input.intervalMinutes,
      timeBlocks: input.timeBlocks,
      earliestStartUtc: earliest,
      staff: [
        {
          id: s.id,
          name: s.name,
          workingHours: s.workingHours,
          appointments: []
        }
      ],
      now: new Date()
    });
    if (slots.some((slot) => slot.startAt === input.startAt.toISOString())) {
      return s;
    }
  }

  return null;
}

export async function createBooking(input: {
  client: {
    name: string;
    phone: string;
    email?: string | null;
    birthday?: Date | null;
    documentType?: "DNI" | "CE" | "PASSPORT" | null;
    documentNumber?: string | null;
  };
  serviceIds: string[];
  staffId: string;
  startAt: Date;
  notes?: string | null;
  bonusCode?: string | null;
  bookingSource?: "public_web" | "admin_panel";
  webDeposit?: WebBookingDeposit | null;
  excludeAppointmentId?: string | null;
}) {
  const settings = await getSalonSettings();
  const serviceIds = Array.from(new Set(input.serviceIds.filter(Boolean)));
  const phone = normalizePhone(input.client.phone);
  const bookingSource = input.bookingSource ?? "admin_panel";
  const isPublic = bookingSource === "public_web";

  if (!input.client.name.trim() || !phone || serviceIds.length === 0) {
    throw new Error("Faltan datos para crear la reserva.");
  }

  if (isPublic && !input.webDeposit) {
    throw new Error("Falta el comprobante de adelanto.");
  }

  if (input.webDeposit && Number(input.webDeposit.amountPen) !== WEB_DEPOSIT_AMOUNT_PEN) {
    throw new Error("El monto del adelanto no es valido.");
  }

  const bonusCodeInput = input.bonusCode?.trim().toUpperCase() || null;

  const appointment = await prisma.$transaction(
    async (tx) => {
      const services = await tx.service.findMany({
        where: { id: { in: serviceIds }, isActive: true },
        orderBy: { name: "asc" }
      });

      if (services.length !== serviceIds.length) {
        throw new Error("Selecciona servicios activos.");
      }

      const durationMinutes = services.reduce((total, service) => total + service.durationMinutes, 0);
      const endAt = addMinutes(input.startAt, durationMinutes);

      if (input.startAt <= new Date()) {
        throw new Error("El horario seleccionado ya paso.");
      }

      const dateInSalon = new Intl.DateTimeFormat("en-CA", {
        timeZone: settings.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(input.startAt);

      const dayStart = startOfSalonDayUtc(dateInSalon, settings.timezone);
      const dayEnd = endOfSalonDayUtc(dateInSalon, settings.timezone);

      const timeBlocks = await tx.timeBlock.findMany({
        where: {
          startAt: { lt: dayEnd },
          endAt: { gt: dayStart }
        },
        select: { staffId: true, startAt: true, endAt: true }
      });

      if (isPublic) {
        if (input.startAt.getTime() < earliestPublicBookingInstant().getTime()) {
          throw new Error(
            `Las reservas en linea requieren al menos ${MIN_BOOKING_ADVANCE_HOURS} horas de anticipacion.`
          );
        }
        if (!isPublicBookingStartInDayWindow(dateInSalon, input.startAt, settings.timezone)) {
          throw new Error("Ese horario no esta disponible para reservas en linea en ese dia.");
        }
      }

      const isSaturday = isSaturdaySalon(dateInSalon, settings.timezone);

      let staff: { id: string; name: string; workingHours: StaffWorkingHour[] };

      if (isPublic && isSaturday) {
        const sameStartCount = await tx.appointment.count({
          where: {
            startAt: input.startAt,
            status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
            ...(input.excludeAppointmentId ? { id: { not: input.excludeAppointmentId } } : {})
          }
        });
        if (sameStartCount >= SATURDAY_MAX_CONCURRENT_STARTS) {
          throw new Error("Ese horario ya tiene el maximo de reservas permitidas para sabado.");
        }

        const picked = await pickStaffForPublicSaturdaySlot(tx, {
          dateStr: dateInSalon,
          timeZone: settings.timezone,
          startAt: input.startAt,
          durationMinutes,
          intervalMinutes: settings.appointmentIntervalMinutes,
          timeBlocks
        });
        if (!picked) {
          throw new Error("Ese horario no esta disponible.");
        }
        staff = picked;
      } else {
        const s = await tx.staff.findFirst({
          where: { id: input.staffId, isActive: true },
          include: { workingHours: true }
        });

        if (!s) {
          throw new Error("La estilista seleccionada no esta disponible.");
        }
        staff = s;

        const overlappingAppointment = await tx.appointment.findFirst({
          where: {
            staffId: staff.id,
            status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
            startAt: { lt: endAt },
            endAt: { gt: input.startAt },
            ...(input.excludeAppointmentId ? { id: { not: input.excludeAppointmentId } } : {})
          },
          select: { id: true }
        });

        if (overlappingAppointment) {
          throw new Error("Ese horario ya fue tomado.");
        }
      }

      const earliestSlot = isPublic ? earliestPublicBookingInstant() : undefined;
      const slots = buildAvailabilitySlots({
        date: dateInSalon,
        timeZone: settings.timezone,
        durationMinutes,
        intervalMinutes: settings.appointmentIntervalMinutes,
        staff: [
          {
            id: staff.id,
            name: staff.name,
            workingHours: staff.workingHours,
            appointments: []
          }
        ],
        timeBlocks,
        now: new Date(),
        earliestStartUtc: earliestSlot
      });

      if (!slots.some((slot) => slot.startAt === input.startAt.toISOString())) {
        throw new Error("Ese horario esta fuera del horario laboral.");
      }

      const dni = input.client.documentNumber?.trim() || null;
      const documentType = dni ? input.client.documentType ?? "DNI" : null;

      const client = await tx.client.upsert({
        where: { phone },
        update: {
          name: input.client.name.trim(),
          email: input.client.email?.trim() || null,
          ...(input.client.birthday ? { birthday: input.client.birthday } : {}),
          ...(dni ? { dni, documentType } : {})
        },
        create: {
          name: input.client.name.trim(),
          phone,
          email: input.client.email?.trim() || null,
          birthday: input.client.birthday ?? null,
          dni,
          documentType
        }
      });

      const subtotal = services.reduce((total, service) => total + Number(service.price), 0);

      let bonusToRedeem: { id: string; discountPercent: number } | null = null;
      let totalPrice = subtotal;

      if (bonusCodeInput) {
        const bonus = await tx.birthdayBonus.findUnique({
          where: { code: bonusCodeInput },
          include: { appointment: true }
        });

        if (!bonus) {
          throw new Error("El código de bono no existe.");
        }

        if (bonus.clientId !== client.id) {
          throw new Error("Este código pertenece a otra clienta.");
        }

        if (bonus.appointment) {
          throw new Error("Este código ya fue canjeado.");
        }

        if (bonus.expiresAt < new Date()) {
          throw new Error("Este código ya está vencido.");
        }

        bonusToRedeem = { id: bonus.id, discountPercent: bonus.discountPercent };
        totalPrice = Math.round(subtotal * (1 - bonus.discountPercent / 100) * 100) / 100;
      }

      const wd = input.webDeposit;

      const created = await tx.appointment.create({
        data: {
          clientId: client.id,
          staffId: staff.id,
          startAt: input.startAt,
          endAt,
          status: AppointmentStatus.CONFIRMED,
          notes: input.notes?.trim() || null,
          totalPrice,
          birthdayBonusId: bonusToRedeem?.id ?? null,
          depositPaid: Boolean(wd),
          depositAmountPen: wd?.amountPen ?? null,
          depositVoucherKey: wd?.voucherKey ?? null,
          depositVoucherFilename: wd?.voucherFilename ?? null,
          depositVoucherMime: wd?.voucherMime ?? null,
          services: {
            create: services.map((service) => ({
              serviceId: service.id,
              serviceNameSnapshot: service.name,
              durationMinutesSnapshot: service.durationMinutes,
              priceSnapshot: service.price
            }))
          }
        },
        include: {
          client: true,
          staff: true,
          services: true
        }
      });

      if (wd && !input.excludeAppointmentId) {
        await tx.payment.create({
          data: {
            appointmentId: created.id,
            amount: wd.amountPen,
            method: "Yape/Plin — adelanto (voucher web)",
            note: `Comprobante: ${wd.voucherFilename}`
          }
        });
      }

      if (bonusToRedeem) {
        await tx.birthdayBonus.update({
          where: { id: bonusToRedeem.id },
          data: { redeemedAt: new Date() }
        });
      }

      return created;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  if (appointment.client.email) {
    const serviceNames = appointment.services.map((s) => s.serviceNameSnapshot).join(", ");
    sendBookingConfirmation({
      to: appointment.client.email,
      clientName: appointment.client.name,
      serviceName: serviceNames,
      staffName: appointment.staff.name,
      dateLabel: formatDateInZone(appointment.startAt, settings.timezone),
      timeLabel: formatTimeInZone(appointment.startAt, settings.timezone),
      accessToken: appointment.accessToken
    }).catch((err) => console.error("[email] confirmacion fallo:", err));
  }

  return appointment;
}

export async function createBookingFromLocalTime(input: {
  client: {
    name: string;
    phone: string;
    email?: string | null;
    documentType?: "DNI" | "CE" | "PASSPORT" | null;
    documentNumber?: string | null;
  };
  serviceIds: string[];
  staffId: string;
  localDateTime: string;
  notes?: string | null;
}) {
  const settings = await getSalonSettings();
  return createBooking({
    ...input,
    startAt: localDateTimeToUtc(input.localDateTime, settings.timezone),
    bookingSource: "admin_panel"
  });
}

export async function getAgenda(date?: string) {
  const settings = await getSalonSettings();
  const selectedDate = date || todayInTimeZone(settings.timezone);
  const [appointments, staff, services] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        startAt: { gte: startOfSalonDayUtc(selectedDate, settings.timezone), lt: endOfSalonDayUtc(selectedDate, settings.timezone) }
      },
      orderBy: { startAt: "asc" },
      include: {
        client: true,
        staff: true,
        services: true,
        payments: true
      }
    }),
    prisma.staff.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    })
  ]);

  return {
    settings,
    selectedDate,
    appointments,
    staff,
    services: services.map((service) => ({ ...service, price: Number(service.price) }))
  };
}

export async function getAgendaRange(from: Date, to: Date) {
  const settings = await getSalonSettings();

  const appointments = await prisma.appointment.findMany({
    where: {
      startAt: { gte: from, lt: to }
    },
    orderBy: { startAt: "asc" },
    include: {
      client: true,
      staff: true,
      services: true,
      payments: true
    }
  });

  return { settings, appointments };
}

export async function getAppointmentForCheckout(id: string) {
  const [appointment, methods] = await Promise.all([
    prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        staff: true,
        services: {
          include: {
            service: {
              include: {
                products: {
                  include: { product: true },
                  orderBy: { product: { name: "asc" } }
                }
              }
            }
          }
        },
        payments: true,
        inventoryMovements: { include: { product: true } }
      }
    }),
    prisma.paymentMethodConfig.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } })
  ]);

  return { appointment, methods };
}

export async function getAppointmentForEdit(id: string) {
  const [appointment, settings] = await Promise.all([
    prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        staff: true,
        services: {
          include: { service: true }
        }
      }
    }),
    getSalonSettings()
  ]);

  const [allStaff, allServices] = await Promise.all([
    prisma.staff.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);

  return { appointment, settings, allStaff, allServices };
}

export async function getClientsWithHistory(search?: string) {
  return prisma.client.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search.replace(/[^0-9+]/g, "") } }
          ]
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      appointments: {
        orderBy: { startAt: "desc" },
        take: 5,
        include: {
          services: true,
          staff: true,
          payments: true
        }
      }
    }
  });
}

export async function getClientsWithoutBirthday() {
  return prisma.client.findMany({
    where: { birthday: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      _count: { select: { appointments: true } }
    }
  });
}

const CLIENT_APPOINTMENT_HISTORY_LIMIT = 200;

export async function getClientById(id: string) {
  const [client, settings, paymentSum, appointmentTotal] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { startAt: "desc" },
          take: CLIENT_APPOINTMENT_HISTORY_LIMIT,
          include: {
            services: true,
            staff: true,
            payments: true
          }
        }
      }
    }),
    getSalonSettings(),
    prisma.payment.aggregate({
      where: { appointment: { clientId: id } },
      _sum: { amount: true }
    }),
    prisma.appointment.count({ where: { clientId: id } })
  ]);

  return {
    client,
    settings,
    totalSpentAllTime: Number(paymentSum._sum.amount ?? 0),
    appointmentHistoryTruncated: appointmentTotal > CLIENT_APPOINTMENT_HISTORY_LIMIT
  };
}

/** Perfil mínimo para edición: no carga el historial de citas (solo el conteo). */
export async function getClientForEdit(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      _count: { select: { appointments: true } }
    }
  });
}

export async function getServicesAdmin() {
  return prisma.service.findMany({
    orderBy: { name: "asc" },
    include: {
      products: {
        include: { product: true },
        orderBy: { product: { name: "asc" } }
      }
    }
  });
}

export async function getServiceById(id: string) {
  const [service, allProducts] = await Promise.all([
    prisma.service.findUnique({
      where: { id },
      include: {
        products: {
          include: { product: true },
          orderBy: { product: { name: "asc" } }
        }
      }
    }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);

  return { service, allProducts };
}

export async function getProductsAdmin() {
  return prisma.product.findMany({
    orderBy: { name: "asc" },
    include: {
      movements: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { createdByStaff: { select: { name: true } } }
      }
    }
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      movements: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          createdByStaff: { select: { name: true } },
          appointment: {
            include: { client: { select: { id: true, name: true } } }
          }
        }
      }
    }
  });
}

export async function getCashReport(options?: { date?: string; from?: string; to?: string }) {
  const settings = await getSalonSettings();

  let dateRange: { gte: Date; lt: Date };

  if (options?.from && options?.to) {
    dateRange = {
      gte: startOfSalonDayUtc(options.from, settings.timezone),
      lt: endOfSalonDayUtc(options.to, settings.timezone)
    };
  } else {
    const selectedDate = options?.date || todayInTimeZone(settings.timezone);
    dateRange = {
      gte: startOfSalonDayUtc(selectedDate, settings.timezone),
      lt: endOfSalonDayUtc(selectedDate, settings.timezone)
    };
  }

  const selectedDate = options?.date || options?.from || todayInTimeZone(settings.timezone);

  const payments = await prisma.payment.findMany({
    where: { paidAt: dateRange },
    orderBy: { paidAt: "desc" },
    include: {
      appointment: {
        include: {
          client: true,
          staff: true,
          services: true
        }
      },
      collectedByStaff: true
    }
  });

  return {
    settings,
    selectedDate,
    payments,
    summary: summarizePayments(payments.map((payment) => ({ amount: Number(payment.amount), method: payment.method })))
  };
}

export async function getConfigurationAdmin() {
  const [settings, staff, methods] = await Promise.all([
    getSalonSettings(),
    prisma.staff.findMany({
      orderBy: { name: "asc" },
      include: { workingHours: { orderBy: { dayOfWeek: "asc" } } }
    }),
    prisma.paymentMethodConfig.findMany({ orderBy: { sortOrder: "asc" } })
  ]);

  return { settings, staff, methods };
}

export async function getStaffById(id: string) {
  return prisma.staff.findUnique({
    where: { id },
    include: { workingHours: { orderBy: { dayOfWeek: "asc" } } }
  });
}

export async function getAppointmentByToken(token: string) {
  return prisma.appointment.findUnique({
    where: { accessToken: token },
    include: {
      client: true,
      staff: true,
      services: { select: { id: true, serviceId: true, serviceNameSnapshot: true, durationMinutesSnapshot: true, priceSnapshot: true } },
      payments: { select: { id: true, amount: true, method: true } }
    }
  });
}
