import { describe, expect, it } from "vitest";

import { summarizePayments } from "../src/lib/cash";

describe("cash summary", () => {
  it("sums total and groups by payment method", () => {
    const summary = summarizePayments([
      { amount: 80, method: "Efectivo" },
      { amount: 120, method: "Yape" },
      { amount: 20, method: "Efectivo" }
    ]);

    expect(summary.total).toBe(220);
    expect(summary.byMethod).toEqual([
      { method: "Efectivo", amount: 100 },
      { method: "Yape", amount: 120 }
    ]);
  });
});
