import { AppointmentStatus, Prisma } from "@prisma/client";

import { summarizePayments } from "@/lib/cash";
import { prisma } from "@/lib/prisma";
import { buildAvailabilitySlots } from "@/lib/scheduling";
import {
  addMinutes,
  endOfSalonDayUtc,
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

export async function getAvailabilityForServices(input: {
  serviceIds: string[];
  date: string;
  staffId?: string | null;
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

  const staff = await prisma.staff.findMany({
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
          endAt: { gt: dayStart }
        },
        select: { startAt: true, endAt: true }
      }
    }
  });

  return buildAvailabilitySlots({
    date: input.date,
    timeZone: settings.timezone,
    durationMinutes,
    intervalMinutes: settings.appointmentIntervalMinutes,
    staff: staff.map((staffMember) => ({
      id: staffMember.id,
      name: staffMember.name,
      appointments: staffMember.appointments,
      workingHours: staffMember.workingHours
    }))
  });
}

export async function createBooking(input: {
  client: { name: string; phone: string; email?: string | null };
  serviceIds: string[];
  staffId: string;
  startAt: Date;
  notes?: string | null;
}) {
  const settings = await getSalonSettings();
  const serviceIds = Array.from(new Set(input.serviceIds.filter(Boolean)));
  const phone = normalizePhone(input.client.phone);

  if (!input.client.name.trim() || !phone || serviceIds.length === 0) {
    throw new Error("Faltan datos para crear la reserva.");
  }

  return prisma.$transaction(
    async (tx) => {
      const services = await tx.service.findMany({
        where: { id: { in: serviceIds }, isActive: true },
        orderBy: { name: "asc" }
      });

      if (services.length !== serviceIds.length) {
        throw new Error("Selecciona servicios activos.");
      }

      const staff = await tx.staff.findFirst({
        where: { id: input.staffId, isActive: true },
        include: { workingHours: true }
      });

      if (!staff) {
        throw new Error("La estilista seleccionada no esta disponible.");
      }

      const durationMinutes = services.reduce((total, service) => total + service.durationMinutes, 0);
      const endAt = addMinutes(input.startAt, durationMinutes);

      if (input.startAt <= new Date()) {
        throw new Error("El horario seleccionado ya paso.");
      }

      const overlappingAppointment = await tx.appointment.findFirst({
        where: {
          staffId: staff.id,
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
          startAt: { lt: endAt },
          endAt: { gt: input.startAt }
        },
        select: { id: true }
      });

      if (overlappingAppointment) {
        throw new Error("Ese horario ya fue tomado.");
      }

      const dateInSalon = new Intl.DateTimeFormat("en-CA", {
        timeZone: settings.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(input.startAt);

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
        now: new Date()
      });

      if (!slots.some((slot) => slot.startAt === input.startAt.toISOString())) {
        throw new Error("Ese horario esta fuera del horario laboral.");
      }

      const client = await tx.client.upsert({
        where: { phone },
        update: {
          name: input.client.name.trim(),
          email: input.client.email?.trim() || null
        },
        create: {
          name: input.client.name.trim(),
          phone,
          email: input.client.email?.trim() || null
        }
      });

      const totalPrice = services.reduce((total, service) => total + Number(service.price), 0);

      return tx.appointment.create({
        data: {
          clientId: client.id,
          staffId: staff.id,
          startAt: input.startAt,
          endAt,
          status: AppointmentStatus.CONFIRMED,
          notes: input.notes?.trim() || null,
          totalPrice,
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
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function createBookingFromLocalTime(input: {
  client: { name: string; phone: string; email?: string | null };
  serviceIds: string[];
  staffId: string;
  localDateTime: string;
  notes?: string | null;
}) {
  const settings = await getSalonSettings();
  return createBooking({
    ...input,
    startAt: localDateTimeToUtc(input.localDateTime, settings.timezone)
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

export async function getClientsWithHistory() {
  return prisma.client.findMany({
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

export async function getProductsAdmin() {
  return prisma.product.findMany({
    orderBy: { name: "asc" },
    include: {
      movements: {
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  });
}

export async function getCashReport(date?: string) {
  const settings = await getSalonSettings();
  const selectedDate = date || todayInTimeZone(settings.timezone);
  const payments = await prisma.payment.findMany({
    where: {
      paidAt: {
        gte: startOfSalonDayUtc(selectedDate, settings.timezone),
        lt: endOfSalonDayUtc(selectedDate, settings.timezone)
      }
    },
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
