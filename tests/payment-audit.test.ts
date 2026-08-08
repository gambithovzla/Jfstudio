import { describe, expect, it } from "vitest";

import {
  describePaymentAuditChange,
  describePaymentAuditSide,
  paymentAuditActionLabel
} from "../src/lib/payment-audit";

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
    expect(paymentAuditActionLabel("UPDATE")).toBe("Correccion");
    expect(paymentAuditActionLabel("DELETE")).toBe("Eliminacion");
    expect(paymentAuditActionLabel("REFUND")).toBe("Reembolso");
    expect(paymentAuditActionLabel("OTRO")).toBe("OTRO");
  });
});
