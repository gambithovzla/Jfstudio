import { describe, expect, it } from "vitest";

import { computeAppointmentPricing, sumServicePrices } from "../src/lib/appointment-pricing";

describe("appointment pricing", () => {
  it("sums the service price snapshots", () => {
    expect(sumServicePrices([{ priceSnapshot: 350 }, { priceSnapshot: "120.50" }])).toBe(470.5);
  });

  it("no aplica descuento cuando la cita no canjeo un bono", () => {
    expect(computeAppointmentPricing(350)).toEqual({ subtotal: 350, discount: 0, total: 350 });
    expect(computeAppointmentPricing(350, null)).toEqual({ subtotal: 350, discount: 0, total: 350 });
  });

  it("aplica el porcentaje del bono de cumpleanos", () => {
    expect(computeAppointmentPricing(350, 15)).toEqual({ subtotal: 350, discount: 52.5, total: 297.5 });
  });

  it("no inventa un descuento por el adelanto ya pagado", () => {
    // Cita de S/ 350 con adelanto de S/ 50: en caja se cobran 300, pero el precio sigue
    // siendo 350 y no hay descuento que mostrar.
    const pricing = computeAppointmentPricing(sumServicePrices([{ priceSnapshot: 350 }]));
    expect(pricing.total).toBe(350);
    expect(pricing.discount).toBe(0);
  });

  it("redondea a dos decimales", () => {
    expect(computeAppointmentPricing(120, 15)).toEqual({ subtotal: 120, discount: 18, total: 102 });
    expect(computeAppointmentPricing(99.99, 15).total).toBe(84.99);
  });

  it("acota porcentajes fuera de rango", () => {
    expect(computeAppointmentPricing(100, -10).total).toBe(100);
    expect(computeAppointmentPricing(100, 150).total).toBe(0);
  });
});
