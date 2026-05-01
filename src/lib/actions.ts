"use server";

import { AppointmentStatus, InventoryMovementType, Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { createBookingFromLocalTime, getSalonSettings } from "@/lib/data";
import { sendBookingCancellation } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { addMinutes, formatDateInZone, formatTimeInZone } from "@/lib/time";
import { normalizePhone } from "@/lib/utils";

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Campo requerido: ${key}`);
  }

  return value.trim();
}

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function decimalFromForm(formData: FormData, key: string, fallback = "0") {
  const value = formData.get(key);
  const raw = typeof value === "string" && value.trim() ? value.trim() : fallback;
  const number = Number(raw);

  if (!Number.isFinite(number)) {
    throw new Error(`Monto invalido: ${key}`);
  }

  return number;
}

// ─── Agenda / Citas ──────────────────────────────────────────────────────────

export async function createAdminAppointmentAction(formData: FormData) {
  await requireAdmin();

  const date = requiredString(formData, "date");
  const time = requiredString(formData, "time");
  const serviceIds = formData.getAll("serviceIds").filter((value): value is string => typeof value === "string");

  await createBookingFromLocalTime({
    client: {
      name: requiredString(formData, "clientName"),
      phone: requiredString(formData, "clientPhone"),
      email: optionalString(formData, "clientEmail")
    },
    serviceIds,
    staffId: requiredString(formData, "staffId"),
    localDateTime: `${date}T${time}`,
    notes: optionalString(formData, "notes")
  });

  revalidatePath("/admin/agenda");
  redirect(`/admin/agenda?date=${date}`);
}

export async function updateAppointmentAction(formData: FormData) {
  await requireAdmin();

  const appointmentId = requiredString(formData, "appointmentId");
  const date = requiredString(formData, "date");
  const time = requiredString(formData, "time");
  const staffId = requiredString(formData, "staffId");
  const notes = optionalString(formData, "notes");
  const serviceIds = formData
    .getAll("serviceIds")
    .filter((v): v is string => typeof v === "string" && v.trim() !== "");

  const settings = await getSalonSettings();

  await prisma.$transaction(
    async (tx) => {
      const existing = await tx.appointment.findUnique({
        where: { id: appointmentId },
        select: { status: true }
      });

      if (!existing || existing.status !== AppointmentStatus.CONFIRMED) {
        throw new Error("Solo se pueden modificar citas confirmadas.");
      }

      const services = await tx.service.findMany({
        where: { id: { in: serviceIds }, isActive: true }
      });

      if (services.length !== serviceIds.length) {
        throw new Error("Selecciona servicios activos.");
      }

      const staff = await tx.staff.findFirst({
        where: { id: staffId, isActive: true },
        select: { id: true }
      });

      if (!staff) {
        throw new Error("Estilista no disponible.");
      }

      const { localDateTimeToUtc } = await import("@/lib/time");
      const startAt = localDateTimeToUtc(`${date}T${time}`, settings.timezone);
      const durationMinutes = services.reduce((t, s) => t + s.durationMinutes, 0);
      const endAt = addMinutes(startAt, durationMinutes);

      const overlap = await tx.appointment.findFirst({
        where: {
          id: { not: appointmentId },
          staffId,
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
          startAt: { lt: endAt },
          endAt: { gt: startAt }
        },
        select: { id: true }
      });

      if (overlap) {
        throw new Error("Ese horario ya esta ocupado.");
      }

      const totalPrice = services.reduce((t, s) => t + Number(s.price), 0);

      await tx.appointmentService.deleteMany({ where: { appointmentId } });

      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          staffId,
          startAt,
          endAt,
          notes,
          totalPrice,
          services: {
            create: services.map((s) => ({
              serviceId: s.id,
              serviceNameSnapshot: s.name,
              durationMinutesSnapshot: s.durationMinutes,
              priceSnapshot: s.price
            }))
          }
        }
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  revalidatePath("/admin/agenda");
  redirect(`/admin/agenda/${appointmentId}`);
}

export async function cancelAppointmentAction(formData: FormData) {
  await requireAdmin();
  const appointmentId = requiredString(formData, "appointmentId");

  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.CANCELED },
    include: { client: true, staff: true, services: true }
  });

  revalidatePath("/admin/agenda");

  if (appointment.client.email) {
    const settings = await getSalonSettings();
    const serviceNames = appointment.services.map((s) => s.serviceNameSnapshot).join(", ");
    sendBookingCancellation({
      to: appointment.client.email,
      clientName: appointment.client.name,
      serviceName: serviceNames,
      dateLabel: formatDateInZone(appointment.startAt, settings.timezone),
      timeLabel: formatTimeInZone(appointment.startAt, settings.timezone)
    }).catch((err) => console.error("[email] cancelacion fallo:", err));
  }
}

export async function markNoShowAction(formData: FormData) {
  await requireAdmin();
  const appointmentId = requiredString(formData, "appointmentId");

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.NO_SHOW }
  });

  revalidatePath("/admin/agenda");
}

export async function completeAppointmentAction(formData: FormData) {
  await requireAdmin();
  const appointmentId = requiredString(formData, "appointmentId");
  const amount = decimalFromForm(formData, "amount");
  const method = requiredString(formData, "method");
  const note = optionalString(formData, "note");

  const productUsage = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("product:"))
    .map(([key, value]) => ({
      productId: key.replace("product:", ""),
      quantity: typeof value === "string" ? Number(value) : 0
    }))
    .filter((usage) => Number.isFinite(usage.quantity) && usage.quantity > 0);

  await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      select: { status: true }
    });

    if (!appointment || appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new Error("Solo se pueden cobrar citas confirmadas.");
    }

    await tx.payment.create({
      data: {
        appointmentId,
        amount,
        method,
        note
      }
    });

    for (const usage of productUsage) {
      await tx.product.update({
        where: { id: usage.productId },
        data: { stock: { decrement: usage.quantity } }
      });

      await tx.inventoryMovement.create({
        data: {
          productId: usage.productId,
          appointmentId,
          type: InventoryMovementType.SERVICE_USAGE,
          quantity: new Prisma.Decimal(usage.quantity).negated(),
          note: "Consumo por servicio"
        }
      });
    }

    await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.COMPLETED,
        totalPrice: amount,
        completedAt: new Date()
      }
    });
  });

  revalidatePath("/admin/agenda");
  revalidatePath("/admin/productos");
  revalidatePath("/admin/caja");
  redirect("/admin/agenda");
}

// ─── Servicios ───────────────────────────────────────────────────────────────

export async function createServiceAction(formData: FormData) {
  await requireAdmin();

  await prisma.service.create({
    data: {
      name: requiredString(formData, "name"),
      description: optionalString(formData, "description"),
      durationMinutes: Number(requiredString(formData, "durationMinutes")),
      price: decimalFromForm(formData, "price"),
      requiresDeposit: formData.get("requiresDeposit") === "on",
      depositAmount: formData.get("requiresDeposit") === "on" ? decimalFromForm(formData, "depositAmount", "0") : null
    }
  });

  revalidatePath("/admin/servicios");
}

export async function updateServiceAction(formData: FormData) {
  await requireAdmin();

  const serviceId = requiredString(formData, "serviceId");
  const requiresDeposit = formData.get("requiresDeposit") === "on";

  await prisma.service.update({
    where: { id: serviceId },
    data: {
      name: requiredString(formData, "name"),
      description: optionalString(formData, "description"),
      durationMinutes: Number(requiredString(formData, "durationMinutes")),
      price: decimalFromForm(formData, "price"),
      requiresDeposit,
      depositAmount: requiresDeposit ? decimalFromForm(formData, "depositAmount", "0") : null
    }
  });

  revalidatePath("/admin/servicios");
  revalidatePath(`/admin/servicios/${serviceId}`);
}

export async function toggleServiceAction(formData: FormData) {
  await requireAdmin();
  const serviceId = requiredString(formData, "serviceId");
  const nextState = requiredString(formData, "nextState") === "true";

  await prisma.service.update({
    where: { id: serviceId },
    data: { isActive: nextState }
  });

  revalidatePath("/admin/servicios");
}

export async function addServiceProductAction(formData: FormData) {
  await requireAdmin();

  await prisma.serviceProduct.create({
    data: {
      serviceId: requiredString(formData, "serviceId"),
      productId: requiredString(formData, "productId"),
      quantity: decimalFromForm(formData, "quantity", "1"),
      isVariable: formData.get("isVariable") === "on"
    }
  });

  revalidatePath(`/admin/servicios/${formData.get("serviceId")}`);
}

export async function updateServiceProductAction(formData: FormData) {
  await requireAdmin();

  const serviceProductId = requiredString(formData, "serviceProductId");

  await prisma.serviceProduct.update({
    where: { id: serviceProductId },
    data: {
      quantity: decimalFromForm(formData, "quantity", "1"),
      isVariable: formData.get("isVariable") === "on"
    }
  });

  revalidatePath(`/admin/servicios/${formData.get("serviceId")}`);
}

export async function removeServiceProductAction(formData: FormData) {
  await requireAdmin();

  const serviceProductId = requiredString(formData, "serviceProductId");
  const serviceId = requiredString(formData, "serviceId");

  await prisma.serviceProduct.delete({ where: { id: serviceProductId } });

  revalidatePath(`/admin/servicios/${serviceId}`);
}

// ─── Productos ────────────────────────────────────────────────────────────────

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  await prisma.product.create({
    data: {
      name: requiredString(formData, "name"),
      unit: requiredString(formData, "unit"),
      stock: decimalFromForm(formData, "stock"),
      lowStockThreshold: decimalFromForm(formData, "lowStockThreshold")
    }
  });

  revalidatePath("/admin/productos");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();

  const productId = requiredString(formData, "productId");

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: requiredString(formData, "name"),
      unit: requiredString(formData, "unit"),
      lowStockThreshold: decimalFromForm(formData, "lowStockThreshold")
    }
  });

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}`);
}

export async function adjustProductStockAction(formData: FormData) {
  await requireAdmin();
  const productId = requiredString(formData, "productId");
  const quantity = decimalFromForm(formData, "quantity");
  const note = optionalString(formData, "note") ?? "Ajuste manual";

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } }
    });

    await tx.inventoryMovement.create({
      data: {
        productId,
        type: InventoryMovementType.ADJUSTMENT,
        quantity,
        note
      }
    });
  });

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}`);
}

// ─── Clientes ────────────────────────────────────────────────────────────────

export async function createClientAction(formData: FormData) {
  await requireAdmin();

  const phone = normalizePhone(requiredString(formData, "phone"));

  await prisma.client.create({
    data: {
      name: requiredString(formData, "name"),
      phone,
      email: optionalString(formData, "email"),
      notes: optionalString(formData, "notes")
    }
  });

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

export async function updateClientAction(formData: FormData) {
  await requireAdmin();

  const clientId = requiredString(formData, "clientId");
  const phone = normalizePhone(requiredString(formData, "phone"));

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name: requiredString(formData, "name"),
      phone,
      email: optionalString(formData, "email"),
      notes: optionalString(formData, "notes")
    }
  });

  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${clientId}`);
}

export async function deleteClientAction(formData: FormData) {
  await requireAdmin();

  const clientId = requiredString(formData, "clientId");

  const appointmentCount = await prisma.appointment.count({ where: { clientId } });

  if (appointmentCount > 0) {
    throw new Error("No se puede eliminar un cliente con citas registradas.");
  }

  await prisma.client.delete({ where: { id: clientId } });

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

// ─── Staff & Horarios ─────────────────────────────────────────────────────────

export async function updateSalonSettingsAction(formData: FormData) {
  await requireAdmin();

  await prisma.salonSettings.upsert({
    where: { id: "default" },
    update: {
      name: requiredString(formData, "name"),
      timezone: requiredString(formData, "timezone"),
      currency: requiredString(formData, "currency"),
      appointmentIntervalMinutes: Number(requiredString(formData, "appointmentIntervalMinutes")),
      bookingLookaheadDays: Number(requiredString(formData, "bookingLookaheadDays"))
    },
    create: {
      id: "default",
      name: requiredString(formData, "name"),
      timezone: requiredString(formData, "timezone"),
      currency: requiredString(formData, "currency"),
      appointmentIntervalMinutes: Number(requiredString(formData, "appointmentIntervalMinutes")),
      bookingLookaheadDays: Number(requiredString(formData, "bookingLookaheadDays"))
    }
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/reservar");
}

export async function createStaffAction(formData: FormData) {
  await requireAdmin();

  const staff = await prisma.staff.create({
    data: {
      name: requiredString(formData, "name"),
      email: optionalString(formData, "email"),
      phone: optionalString(formData, "phone"),
      role: requiredString(formData, "role") as UserRole,
      color: requiredString(formData, "color")
    }
  });

  for (const dayOfWeek of [1, 2, 3, 4, 5, 6]) {
    await prisma.workingHour.create({
      data: {
        staffId: staff.id,
        dayOfWeek,
        startTime: "09:00",
        endTime: dayOfWeek === 6 ? "16:00" : "18:00",
        breakStart: "13:00",
        breakEnd: "14:00",
        isActive: true
      }
    });
  }

  revalidatePath("/admin/configuracion");
  revalidatePath("/reservar");
}

export async function updateStaffAction(formData: FormData) {
  await requireAdmin();

  const staffId = requiredString(formData, "staffId");

  await prisma.staff.update({
    where: { id: staffId },
    data: {
      name: requiredString(formData, "name"),
      email: optionalString(formData, "email"),
      phone: optionalString(formData, "phone"),
      role: requiredString(formData, "role") as UserRole,
      color: requiredString(formData, "color")
    }
  });

  revalidatePath("/admin/configuracion");
  revalidatePath(`/admin/configuracion/staff/${staffId}`);
  revalidatePath("/reservar");
}

export async function deactivateStaffAction(formData: FormData) {
  await requireAdmin();

  const staffId = requiredString(formData, "staffId");

  await prisma.staff.update({
    where: { id: staffId },
    data: { isActive: false }
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/reservar");
  redirect("/admin/configuracion");
}

export async function updateWorkingHourAction(formData: FormData) {
  await requireAdmin();

  const workingHourId = requiredString(formData, "workingHourId");
  const isActive = formData.get("isActive") === "on";

  await prisma.workingHour.update({
    where: { id: workingHourId },
    data: {
      isActive,
      startTime: isActive ? requiredString(formData, "startTime") : "09:00",
      endTime: isActive ? requiredString(formData, "endTime") : "18:00",
      breakStart: optionalString(formData, "breakStart"),
      breakEnd: optionalString(formData, "breakEnd")
    }
  });

  revalidatePath("/admin/configuracion");
  revalidatePath(`/admin/configuracion/staff/${formData.get("staffId")}`);
  revalidatePath("/reservar");
}

// ─── Métodos de pago ─────────────────────────────────────────────────────────

export async function createPaymentMethodAction(formData: FormData) {
  await requireAdmin();

  await prisma.paymentMethodConfig.create({
    data: {
      name: requiredString(formData, "name"),
      sortOrder: Number(formData.get("sortOrder") || 0)
    }
  });

  revalidatePath("/admin/configuracion");
}

export async function updatePaymentMethodAction(formData: FormData) {
  await requireAdmin();

  const methodId = requiredString(formData, "methodId");

  await prisma.paymentMethodConfig.update({
    where: { id: methodId },
    data: {
      name: requiredString(formData, "name"),
      sortOrder: Number(formData.get("sortOrder") || 0),
      isActive: formData.get("isActive") === "on"
    }
  });

  revalidatePath("/admin/configuracion");
}

export async function deletePaymentMethodAction(formData: FormData) {
  await requireAdmin();

  const methodId = requiredString(formData, "methodId");

  await prisma.paymentMethodConfig.delete({ where: { id: methodId } });

  revalidatePath("/admin/configuracion");
}

// ─── Time Blocks ──────────────────────────────────────────────────────────────

export async function createTimeBlockAction(formData: FormData) {
  await requireAdmin();

  const startDate = requiredString(formData, "startDate");
  const startTime = formData.get("startTime") as string | null;
  const endDate = requiredString(formData, "endDate");
  const endTime = formData.get("endTime") as string | null;
  const reason = optionalString(formData, "reason");
  const staffId = optionalString(formData, "staffId");

  const settings = await getSalonSettings();
  const { localDateTimeToUtc } = await import("@/lib/time");

  const startAt = localDateTimeToUtc(`${startDate}T${startTime || "00:00"}`, settings.timezone);
  const endAt = localDateTimeToUtc(`${endDate}T${endTime || "23:59"}`, settings.timezone);

  if (endAt <= startAt) {
    throw new Error("La fecha de fin debe ser posterior al inicio.");
  }

  await prisma.timeBlock.create({
    data: { startAt, endAt, reason, staffId }
  });

  revalidatePath("/admin/configuracion/bloqueos");
}

export async function deleteTimeBlockAction(formData: FormData) {
  await requireAdmin();

  const blockId = requiredString(formData, "blockId");

  await prisma.timeBlock.delete({ where: { id: blockId } });

  revalidatePath("/admin/configuracion/bloqueos");
}

// ─── Reembolsos ───────────────────────────────────────────────────────────────

// ─── Depositos ────────────────────────────────────────────────────────────────

export async function markDepositPaidAction(formData: FormData) {
  await requireAdmin();
  const appointmentId = requiredString(formData, "appointmentId");
  const note = optionalString(formData, "note");

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { depositPaid: true, notes: note || undefined }
  });

  revalidatePath(`/admin/agenda/${appointmentId}`);
  revalidatePath("/admin/agenda");
}

export async function refundPaymentAction(formData: FormData) {
  await requireAdmin();
  const appointmentId = requiredString(formData, "appointmentId");
  const amount = decimalFromForm(formData, "amount");
  const method = requiredString(formData, "method");
  const note = optionalString(formData, "note");

  if (amount <= 0) {
    throw new Error("El monto de reembolso debe ser mayor a cero.");
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true }
  });

  if (!appointment || appointment.status !== AppointmentStatus.COMPLETED) {
    throw new Error("Solo se pueden reembolsar citas completadas.");
  }

  await prisma.payment.create({
    data: {
      appointmentId,
      amount: -amount,
      method,
      note: note ?? "Reembolso"
    }
  });

  revalidatePath(`/admin/agenda/${appointmentId}`);
  revalidatePath("/admin/caja");
}

