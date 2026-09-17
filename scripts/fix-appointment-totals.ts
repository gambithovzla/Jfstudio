/**
 * Repara el precio de las citas cuyo `totalPrice` quedo pisado al cobrar.
 *
 * Hasta ahora `completeAppointmentAction` guardaba en `totalPrice` el monto que entraba en
 * caja. Cuando la clienta habia dejado adelanto solo se cobra el saldo, asi que el precio
 * de la cita quedaba rebajado por el monto del adelanto y la ficha lo mostraba como
 * "Descuento bono" aunque nunca hubiera bono.
 *
 * Este script recalcula `totalPrice` desde los snapshots de servicio y el bono de
 * cumpleanos canjeado (la unica fuente de descuentos del sistema).
 *
 * Uso:
 *   npm run db:fix-totales            (simulacion, no escribe nada)
 *   npm run db:fix-totales -- --apply (aplica los cambios)
 */
import { PrismaClient } from "@prisma/client";

import { computeAppointmentPricing, sumServicePrices } from "../src/lib/appointment-pricing";
import { loadEnvFiles } from "./load-env";
import { resolveDatabaseUrlForLocalScript } from "./resolve-database-url";

loadEnvFiles();
resolveDatabaseUrlForLocalScript("db:fix-totales");

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const appointments = await prisma.appointment.findMany({
    include: {
      client: { select: { name: true } },
      services: { select: { priceSnapshot: true } },
      birthdayBonus: { select: { discountPercent: true } }
    },
    orderBy: { startAt: "asc" }
  });

  let fixed = 0;

  for (const appointment of appointments) {
    if (appointment.services.length === 0) continue;

    const { total } = computeAppointmentPricing(
      sumServicePrices(appointment.services),
      appointment.birthdayBonus?.discountPercent
    );

    const stored = appointment.totalPrice === null ? null : Number(appointment.totalPrice);
    if (stored !== null && Math.abs(stored - total) < 0.005) continue;

    fixed++;
    console.log(
      `${appointment.startAt.toISOString().slice(0, 10)}  ${appointment.client.name}: ` +
        `${stored === null ? "(sin precio)" : stored.toFixed(2)} -> ${total.toFixed(2)}` +
        (appointment.birthdayBonus ? `  [bono ${appointment.birthdayBonus.discountPercent}%]` : "")
    );

    if (apply) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { totalPrice: total }
      });
    }
  }

  if (fixed === 0) {
    console.log("Todas las citas tienen el precio correcto. Nada que reparar.");
  } else if (apply) {
    console.log(`\n${fixed} cita(s) corregida(s).`);
  } else {
    console.log(`\n${fixed} cita(s) con el precio pisado. Simulacion: no se escribio nada.`);
    console.log("Vuelve a correrlo con --apply para aplicar los cambios.");
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
