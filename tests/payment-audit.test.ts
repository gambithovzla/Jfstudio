import { describe, expect, it } from "vitest";

import {
  describePaymentAuditChange,
  describePaymentAuditSide,
  paymentAuditActionLabel
} from "../src/lib/payment-audit";
import { endOfSalonDayUtc, formatDateInZone, startOfSalonDayUtc, zonedTimeToUtc } from "../src/lib/time";

const soles = (value: number) => `S/ ${value.toFixed(2)}`;

describe("payment audit descriptions", () => {
  it("shows before and after for a corrected amount", () => {
    const text = describePaymentAuditChange(
      { beforeAmount: 280, beforeMethod: "Yape", afterAmount: 230, afterMethod: "Yape" },
      soles
    );

    expect(text).toBe("S/ 280.00 (Yape) → S/ 230.00 (Yape)");
  });

  it("marks a deletion when there is no after side", () => {
    const text = describePaymentAuditChange(
      { beforeAmount: 50, beforeMethod: "Efectivo", afterAmount: null, afterMethod: null },
      soles
    );

    expect(text).toBe("Elimino S/ 50.00 (Efectivo)");
  });

  it("marks a refund as a new negative entry", () => {
    const text = describePaymentAuditChange(
      { beforeAmount: null, beforeMethod: null, afterAmount: -50, afterMethod: "Efectivo" },
      soles
    );

    expect(text).toBe("Registro S/ -50.00 (Efectivo)");
  });

  it("treats a zero amount as a real value, not as a missing side", () => {
    expect(describePaymentAuditSide({ amount: 0, method: "Yape" }, soles)).toBe("S/ 0.00 (Yape)");
  });

  it("renders an empty side as a dash", () => {
    expect(describePaymentAuditSide({ amount: null, method: null }, soles)).toBe("—");
  });

  it("translates action names and falls back to the raw value", () => {
    expect(paymentAuditActionLabel("CREATE")).toBe("Cobro adicional");
    expect(paymentAuditActionLabel("UPDATE")).toBe("Correccion");
    expect(paymentAuditActionLabel("DELETE")).toBe("Eliminacion");
    expect(paymentAuditActionLabel("REFUND")).toBe("Reembolso");
    expect(paymentAuditActionLabel("OTRO")).toBe("OTRO");
  });
});

describe("fecha de un cobro agregado a mano", () => {
  const LIMA = "America/Lima";

  it("deja el cobro en el dia elegido del salon, no en el dia UTC", () => {
    // 23:30 en Lima es el dia siguiente en UTC: el cobro debe seguir contando
    // en el 31 de julio, que es cuando la clienta pago.
    const paidAt = zonedTimeToUtc("2026-07-31", "23:30", LIMA);

    expect(formatDateInZone(paidAt, LIMA)).toContain("31");
    expect(paidAt.toISOString()).toBe("2026-08-01T04:30:00.000Z");
  });

  it("mantiene el cobro dentro del rango del dia que reporta caja", () => {
    const paidAt = zonedTimeToUtc("2026-07-31", "23:30", LIMA);

    expect(paidAt.getTime()).toBeGreaterThanOrEqual(startOfSalonDayUtc("2026-07-31", LIMA).getTime());
    expect(paidAt.getTime()).toBeLessThan(endOfSalonDayUtc("2026-07-31", LIMA).getTime());
  });
});
