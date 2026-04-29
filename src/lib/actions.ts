"use server";

import { AppointmentStatus, InventoryMovementType, Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { createBookingFromLocalTime, getSalonSettings } from "@/lib/data";
import { prisma } from "@/lib/prisma";

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

export async function cancelAppointmentAction(formData: FormData) {
  await requireAdmin();
  const appointmentId = requiredString(formData, "appointmentId");

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.CANCELED }
  });

  revalidatePath("/admin/agenda");
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
  const { staffId } = await requireAdmin();
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
        note,
        collectedByStaffId: staffId
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
          note: "Consumo por servicio",
          createdByStaffId: staffId
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

export async function adjustProductStockAction(formData: FormData) {
  const { staffId } = await requireAdmin();
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
        note,
        createdByStaffId: staffId
      }
    });
  });

  revalidatePath("/admin/productos");
}

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

  const settings = await getSalonSettings();

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
  void settings;
}

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
