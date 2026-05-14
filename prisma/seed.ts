import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.salonSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "JF Studio",
      timezone: "America/Lima",
      currency: "PEN",
      appointmentIntervalMinutes: 15,
      bookingLookaheadDays: 45
    }
  });

  const johanna = await prisma.staff.upsert({
    where: { email: "johanna@jfstudio.local" },
    update: {},
    create: {
      name: "Johanna Figueredo",
      email: "johanna@jfstudio.local",
      phone: "+51 999 999 999",
      role: UserRole.ADMIN,
      color: "#0f766e"
    }
  });

  const assistant = await prisma.staff.upsert({
    where: { email: "staff@jfstudio.local" },
    update: {},
    create: {
      name: "Estilista 1",
      email: "staff@jfstudio.local",
      role: UserRole.STYLIST,
      color: "#be185d"
    }
  });

  for (const staff of [johanna, assistant]) {
    for (const dayOfWeek of [1, 2, 3, 4, 5, 6]) {
      await prisma.workingHour.upsert({
        where: { staffId_dayOfWeek: { staffId: staff.id, dayOfWeek } },
        update: {},
        create: {
          staffId: staff.id,
          dayOfWeek,
          startTime: "09:00",
          endTime: dayOfWeek === 6 ? "16:00" : "18:00",
          breakStart: "13:00",
          breakEnd: "14:00"
        }
      });
    }
  }

  const shampoo = await prisma.product.upsert({
    where: { name: "Shampoo profesional" },
    update: {},
    create: { name: "Shampoo profesional", unit: "ml", stock: 2000, lowStockThreshold: 300 }
  });

  const tinte = await prisma.product.upsert({
    where: { name: "Tinte" },
    update: {},
    create: { name: "Tinte", unit: "g", stock: 1500, lowStockThreshold: 250 }
  });

  const tratamiento = await prisma.product.upsert({
    where: { name: "Tratamiento hidratante" },
    update: {},
    create: { name: "Tratamiento hidratante", unit: "ml", stock: 1000, lowStockThreshold: 200 }
  });

  const corte = await prisma.service.upsert({
    where: { name: "Corte y brushing" },
    update: {},
    create: {
      name: "Corte y brushing",
      description: "Corte, lavado y peinado.",
      durationMinutes: 60,
      price: 80,
      requiresDeposit: false
    }
  });

  const color = await prisma.service.upsert({
    where: { name: "Color completo" },
    update: {},
    create: {
      name: "Color completo",
      description: "Coloracion completa con lavado.",
      durationMinutes: 150,
      price: 220,
      requiresDeposit: true,
      depositAmount: 50
    }
  });

  await prisma.service.updateMany({
    where: { name: { in: ["Laceado organico", "Laceado orgánico"] } },
    data: { isActive: false }
  });

  const laceadoDeposit = { requiresDeposit: true, depositAmount: 50 };
  const laceadoDesc = "Alisado orgánico con productos profesionales. El largo se elige al reservar.";

  const laceadoLengthRows = [
    { name: "Laceado orgánico — cabello corto", price: 300, durationMinutes: 240 },
    { name: "Laceado orgánico — cabello medio", price: 350, durationMinutes: 240 },
    { name: "Laceado orgánico — cabello largo", price: 400, durationMinutes: 240 },
    { name: "Laceado orgánico — cabello extra largo", price: 500, durationMinutes: 240 }
  ];

  for (const row of laceadoLengthRows) {
    await prisma.service.upsert({
      where: { name: row.name },
      update: {
        ...laceadoDeposit,
        price: row.price,
        durationMinutes: row.durationMinutes,
        description: laceadoDesc,
        isActive: true
      },
      create: {
        name: row.name,
        description: laceadoDesc,
        durationMinutes: row.durationMinutes,
        price: row.price,
        ...laceadoDeposit
      }
    });
  }

  await prisma.service.upsert({
    where: { name: "Laceado orgánico — suplemento abundancia" },
    update: {
      ...laceadoDeposit,
      price: 80,
      durationMinutes: 30,
      description: "Extra por abundancia de cabello (solo junto a laceado orgánico).",
      isActive: true
    },
    create: {
      name: "Laceado orgánico — suplemento abundancia",
      description: "Extra por abundancia de cabello (solo junto a laceado orgánico).",
      durationMinutes: 30,
      price: 80,
      ...laceadoDeposit
    }
  });

  await prisma.service.upsert({
    where: { name: "Mechas" },
    update: { requiresDeposit: true, depositAmount: 50 },
    create: {
      name: "Mechas",
      description: "Mechas californianas, balayage o reflejos según evaluacion.",
      durationMinutes: 180,
      price: 260,
      requiresDeposit: true,
      depositAmount: 50
    }
  });

  const hidratacion = await prisma.service.upsert({
    where: { name: "Hidratacion profunda" },
    update: {},
    create: {
      name: "Hidratacion profunda",
      description: "Tratamiento capilar hidratante.",
      durationMinutes: 75,
      price: 120
    }
  });

  await prisma.serviceProduct.upsert({
    where: { serviceId_productId: { serviceId: corte.id, productId: shampoo.id } },
    update: {},
    create: { serviceId: corte.id, productId: shampoo.id, quantity: 25, isVariable: false }
  });

  await prisma.serviceProduct.upsert({
    where: { serviceId_productId: { serviceId: color.id, productId: tinte.id } },
    update: {},
    create: { serviceId: color.id, productId: tinte.id, quantity: 90, isVariable: true }
  });

  await prisma.serviceProduct.upsert({
    where: { serviceId_productId: { serviceId: color.id, productId: shampoo.id } },
    update: {},
    create: { serviceId: color.id, productId: shampoo.id, quantity: 35, isVariable: false }
  });

  await prisma.serviceProduct.upsert({
    where: { serviceId_productId: { serviceId: hidratacion.id, productId: tratamiento.id } },
    update: {},
    create: { serviceId: hidratacion.id, productId: tratamiento.id, quantity: 60, isVariable: true }
  });

  for (const [sortOrder, name] of ["Efectivo", "Yape", "Plin", "Tarjeta", "Transferencia"].entries()) {
    await prisma.paymentMethodConfig.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
